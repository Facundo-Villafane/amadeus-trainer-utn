import { setCurrentPNR, getCurrentPNR } from './pnrState';
import { generatePNR } from '../../../pnrGenerator';
import { formatPNRResponse } from './pnrUtils';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import experienceService from '../../../../services/experienceService';

// To handle splitting, we need to track both Parent and Associate PNR.
// Since pnrState only holds the current PNR, we store the split state
// internally in the current PNR object during the SP command.

/**
 * Handle the SP command — Split PNR
 * Formats: SP[#], SP[#],[#],[#]
 * 
 * Flow:
 * 1. User types SP2
 * 2. System takes Pax 2 out of the parent PNR and moves it to a new "Associate PNR".
 *    The parent PNR is suspended in memory. The Associate PNR becomes current.
 *    The terminal displays ---RLR  SFP--- -ASSOCIATE PNR-
 * 3. User makes changes to the Associate PNR.
 * 4. User types RF
 * 5. User types EF (End & File Associate).
 *    System switches back to the Parent PNR.
 *    The terminal displays ---RLR  SFP--- -PARENT PNR-
 * 6. User types RF
 * 7. User types ET (End Transaction).
 *    System finalizes the split, saving both PNRs to Firestore and assigning locators.
 *    The terminal shows FIN DE TRANSACCION COMPLETADO - LOCALIZADOR_PADRE SP-LOCALIZADOR_ASOCIADO
 */
export async function handleSplit(cmd) {
    try {
        const parentPNR = getCurrentPNR();
        if (!parentPNR || !parentPNR.recordLocator) {
            return 'No hay un PNR finalizado en curso. Solo se pueden dividir PNRs ya guardados.';
        }

        if (parentPNR.passengers.length <= 1) {
            return 'No se puede dividir un PNR con un solo pasajero.';
        }

        // Parse SP1, SP1,3, SP2-4
        const args = cmd.replace(/^SP/, '').trim();
        if (!args) {
            return 'Debe indicar qué pasajero(s) desea separar. Ejemplo: SP2';
        }

        const paxTargetIndices = new Set();
        args.split(',').forEach(part => {
            part = part.trim();
            const num = parseInt(part, 10);
            if (!isNaN(num) && num > 0 && num <= parentPNR.passengers.length) {
                paxTargetIndices.add(num);
            }
        });

        if (paxTargetIndices.size === 0) {
            return 'No se especificaron pasajeros válidos para la división.';
        }

        if (paxTargetIndices.size === parentPNR.passengers.length) {
            return 'No puede separar a todos los pasajeros. Debe quedar al menos uno en el PNR original.';
        }

        // ── Create Associate PNR ──
        const associatePax = [];
        const remainingPax = [];

        // Separate Passengers
        parentPNR.passengers.forEach((pax, index) => {
            const pNum = index + 1;
            if (paxTargetIndices.has(pNum)) associatePax.push(pax);
            else remainingPax.push(pax);
        });

        // Helper to map old pax index to new pax index for Associate and Parent
        const mapPaxRef = (oldNum, isAssociate) => {
            const targetList = isAssociate ? associatePax : remainingPax;
            const originalPax = parentPNR.passengers[oldNum - 1];
            const newIndex = targetList.findIndex(p => p === originalPax);
            return newIndex >= 0 ? newIndex + 1 : null;
        };

        // Filter and remap SSR/Contacts/etc
        const associatePNR = {
            ...JSON.parse(JSON.stringify(parentPNR)), // Deep copy primitive data
            passengers: associatePax,
            contacts: parentPNR.contacts.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, true) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, true) : null })),
            emailContacts: parentPNR.emailContacts?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, true) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, true) : null })) || [],
            ssrElements: parentPNR.ssrElements?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, true) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, true) : null })) || [],
            osiElements: parentPNR.osiElements?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, true) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, true) : null })) || [],
            recordLocator: 'XXXXXX', // Temporary, will be generated on ET
            id: null,
            receivedFrom: null,
            splitState: 'ASSOCIATE',
            splitParentData: {
                originalPNRId: parentPNR.id,
                originalLocator: parentPNR.recordLocator,
                parentPax: remainingPax,
                parentContacts: parentPNR.contacts.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, false) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, false) : null })),
                parentEmailContacts: parentPNR.emailContacts?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, false) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, false) : null })) || [],
                parentSsrElements: parentPNR.ssrElements?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, false) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, false) : null })) || [],
                parentOsiElements: parentPNR.osiElements?.filter(c => !c.passengerNumber || mapPaxRef(c.passengerNumber, false) !== null).map(c => ({ ...c, passengerNumber: c.passengerNumber ? mapPaxRef(c.passengerNumber, false) : null })) || [],
            }
        };

        // Keep only common elements or elements specific to Associate
        setCurrentPNR(associatePNR);

        let output = '\n---RLR  SFP---\n-ASSOCIATE PNR-\n';
        output += formatPNRResponse(associatePNR).replace(/^\s+|\s+$/g, '');
        return output;
    } catch (e) {
        console.error('Error SP:', e);
        return `Error al procesar el comando SP: ${e.message}`;
    }
}

/**
 * Handle EF Command (End & File Associate PNR)
 * Switches context back to Parent PNR.
 */
export async function handleCloseAssociate(cmd) {
    const currentPNR = getCurrentPNR();
    if (!currentPNR || currentPNR.splitState !== 'ASSOCIATE') {
        return 'Comando EF solo se puede usar para cerrar un PNR Asociado durante una división (SP).';
    }

    if (!currentPNR.receivedFrom) {
        return "Falta la información de 'Received From'. Use RF para añadirla antes de cerrar el PNR asociado.";
    }

    // Restore parent PNR into memory with modifications
    const parentPNR = {
        ...JSON.parse(JSON.stringify(currentPNR)), // Grab shared fields
        passengers: currentPNR.splitParentData.parentPax,
        contacts: currentPNR.splitParentData.parentContacts,
        emailContacts: currentPNR.splitParentData.parentEmailContacts,
        ssrElements: currentPNR.splitParentData.parentSsrElements,
        osiElements: currentPNR.splitParentData.parentOsiElements,
        recordLocator: currentPNR.splitParentData.originalLocator,
        id: currentPNR.splitParentData.originalPNRId,
        receivedFrom: null, // Parent needs RF again
        splitState: 'PARENT',
        splitAssociateData: {
            associatePNR: { ...currentPNR, splitParentData: undefined, splitState: undefined } // The pending associate
        }
    };

    setCurrentPNR(parentPNR);

    let output = '\n---RLR  SFP---\n-PARENT PNR-\n';
    output += formatPNRResponse(parentPNR).replace(/^\s+|\s+$/g, '');
    return output;
}

/**
 * Executes ET/ER from a PARENT split state.
 * Saves both PNRs to Firestore.
 */
export async function handleFinalizeSplit(cmd, userId) {
    const currentPNR = getCurrentPNR();

    // Gen new locator for associate
    const associateLocator = generatePNR();
    const parentLocator = currentPNR.recordLocator;

    const associatePNR = currentPNR.splitAssociateData.associatePNR;
    associatePNR.recordLocator = associateLocator;
    associatePNR.status = 'CONFIRMED';

    // Parent update
    currentPNR.splitState = undefined;
    currentPNR.splitAssociateData = undefined;
    currentPNR.status = 'CONFIRMED';

    // Add Remarks to both crossing reference
    const dateMarker = new Date().toISOString().substring(8, 10) + new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const parentRefRemark = { type: 'RM', message: `SP TO ${associateLocator}`, addedAt: new Date() };
    const associateRefRemark = { type: 'RM', message: `SP FROM ${parentLocator}`, addedAt: new Date() };

    if (!currentPNR.remarks) currentPNR.remarks = [];
    currentPNR.remarks.push(parentRefRemark);

    if (!associatePNR.remarks) associatePNR.remarks = [];
    associatePNR.remarks.push(associateRefRemark);

    // Firestore saves
    console.log('Saving Split - Parent:', currentPNR);
    console.log('Saving Split - Associate:', associatePNR);

    try {
        // 1. Update Parent
        if (currentPNR.id) {
            await updateDoc(doc(db, 'pnrs', currentPNR.id), {
                passengers: currentPNR.passengers,
                contacts: currentPNR.contacts,
                emailContacts: currentPNR.emailContacts,
                ssrElements: currentPNR.ssrElements,
                osiElements: currentPNR.osiElements,
                remarks: currentPNR.remarks,
                updatedAt: serverTimestamp(),
            });
        }

        // 2. Insert Associate
        const newAssocRef = await addDoc(collection(db, 'pnrs'), {
            ...associatePNR,
            userId: userId || 'unknown',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (userId) {
            await experienceService.recordSuccessfulCommand(userId, 'SP', 'SPLIT');
        }

        if (cmd === 'ET') {
            setCurrentPNR(null);
            return `FIN DE TRANSACCION COMPLETADO - ${parentLocator} SP-${associateLocator}`;
        } else {
            // ER = Retrieve Parent again
            setCurrentPNR(currentPNR);
            return formatPNRResponse(currentPNR);
        }
    } catch (e) {
        console.error('Error finalizando Split:', e);
        return `Error al guardar la división: ${e.message}`;
    }
}
