import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../../services/firebase';
import { getCurrentPNR, setCurrentPNR } from './pnrState';
import { formatPNRResponse } from './pnrUtils';
import { createInfantSSR } from './pnrSupplementary';

function buildElementMap(pnr) {
  const elementMap = [];

  (pnr.passengers || []).forEach((_, index) => {
    elementMap.push({ type: 'passenger', index });
  });

  (pnr.segments || []).forEach((_, index) => {
    elementMap.push({ type: 'segment', index });
  });

  (pnr.contacts || []).forEach((_, index) => {
    elementMap.push({ type: 'contact', index });
  });

  (pnr.emailContacts || []).forEach((_, index) => {
    elementMap.push({ type: 'emailContact', index });
  });

  (pnr.osiElements || []).forEach((_, index) => {
    elementMap.push({ type: 'osiElement', index });
  });

  (pnr.ssrElements || []).forEach((_, index) => {
    elementMap.push({ type: 'ssrElement', index });
  });

  if (pnr.ticketing) {
    elementMap.push({ type: 'ticketing' });
  }

  (pnr.remarks || []).forEach((_, index) => {
    elementMap.push({ type: 'remark', index });
  });

  (pnr.confidentialRemarks || []).forEach((_, index) => {
    elementMap.push({ type: 'confidentialRemark', index });
  });

  (pnr.itineraryRemarks || []).forEach((_, index) => {
    elementMap.push({ type: 'itineraryRemark', index });
  });

  return elementMap;
}

function parseContactChange(change) {
  const contactPattern = /^([A-Z]{3})\s*([0-9-]+)-([A-Z])(?:\/P(\d+))?$/i;
  const match = change.match(contactPattern);

  if (!match) {
    return null;
  }

  const [, city, phone, type, passengerNumber] = match;
  return {
    city: city.toUpperCase(),
    phone,
    type: type.toUpperCase(),
    passengerNumber: passengerNumber ? parseInt(passengerNumber, 10) : undefined,
    addedAt: new Date()
  };
}

function parseEmailChange(change) {
  const emailPattern = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\/P(\d+))?$/i;
  const match = change.match(emailPattern);

  if (!match) {
    return null;
  }

  const [, email, passengerNumber] = match;
  return {
    email: email.toLowerCase(),
    type: 'E',
    passengerNumber: passengerNumber ? parseInt(passengerNumber, 10) : undefined,
    addedAt: new Date()
  };
}

function parseInfantChange(change, passenger) {
  const withLastName = change.match(/^\(INF\/([A-Z]+)\/([A-Z]+)\/(\d{1,2}[A-Z]{3}\d{2})\)$/i);
  if (withLastName) {
    return {
      lastName: withLastName[1].toUpperCase(),
      firstName: withLastName[2].toUpperCase(),
      dateOfBirth: withLastName[3].toUpperCase()
    };
  }

  const withInheritedLastName = change.match(/^\(INF\/([A-Z]+)\/(\d{1,2}[A-Z]{3}\d{2})\)$/i);
  if (withInheritedLastName) {
    return {
      lastName: passenger.lastName,
      firstName: withInheritedLastName[1].toUpperCase(),
      dateOfBirth: withInheritedLastName[2].toUpperCase(),
      inheritedLastName: true
    };
  }

  return null;
}

function validatePassengerReference(pnr, passengerNumber) {
  if (!passengerNumber) return null;
  if (passengerNumber < 1 || passengerNumber > (pnr.passengers?.length || 0)) {
    return `Error: El pasajero ${passengerNumber} no existe en el PNR actual.`;
  }
  return null;
}

async function persistPNRModification(pnr, cmd, result) {
  if (!pnr.id) return;

  await updateDoc(doc(db, 'pnrs', pnr.id), {
    passengers: pnr.passengers || [],
    segments: pnr.segments || [],
    contacts: pnr.contacts || [],
    emailContacts: pnr.emailContacts || [],
    ssrElements: pnr.ssrElements || [],
    updatedAt: serverTimestamp(),
    [`history.${Date.now()}`]: {
      command: cmd,
      result,
      timestamp: new Date().toISOString()
    }
  });
}

export async function handleModifyElement(cmd) {
  try {
    const currentPNR = getCurrentPNR();
    if (!currentPNR) {
      return 'No hay un PNR en progreso para modificar elementos.';
    }

    const match = cmd.match(/^(\d+)\/(.+)$/);
    if (!match) {
      return 'Formato incorrecto. Ejemplos: 4/3, 5/BUE 1135877344-O/P1, 2/(INF/DIEGO/20JAN22)';
    }

    const elementNumber = parseInt(match[1], 10);
    const change = match[2].trim();
    const elementMap = buildElementMap(currentPNR);
    const target = elementMap[elementNumber - 1];

    if (!target) {
      return `Error: El elemento ${elementNumber} no existe en el PNR actual.`;
    }

    let resultMessage;

    if (target.type === 'segment') {
      const quantity = parseInt(change, 10);
      if (!/^\d+$/.test(change) || quantity < 1 || quantity > 9) {
        return 'Formato incorrecto para segmento. Ejemplo: 4/3 para cambiar la cantidad a 3 lugares.';
      }

      currentPNR.segments[target.index] = {
        ...currentPNR.segments[target.index],
        quantity,
        updatedAt: new Date()
      };
      resultMessage = `Segment element ${elementNumber} quantity changed to ${quantity}`;
    } else if (target.type === 'contact') {
      const contact = parseContactChange(change);
      if (!contact) {
        return 'Formato incorrecto para contacto. Ejemplo: 5/BUE 1135877344-O/P1';
      }

      const passengerError = validatePassengerReference(currentPNR, contact.passengerNumber);
      if (passengerError) return passengerError;

      currentPNR.contacts[target.index] = contact;
      resultMessage = `Contact element ${elementNumber} modified`;
    } else if (target.type === 'emailContact') {
      const emailContact = parseEmailChange(change);
      if (!emailContact) {
        return 'Formato incorrecto para email. Ejemplo: 6/usuario@ejemplo.com/P1';
      }

      const passengerError = validatePassengerReference(currentPNR, emailContact.passengerNumber);
      if (passengerError) return passengerError;

      currentPNR.emailContacts[target.index] = emailContact;
      resultMessage = `Email element ${elementNumber} modified`;
    } else if (target.type === 'passenger') {
      const passenger = currentPNR.passengers[target.index];
      const infantData = parseInfantChange(change, passenger);

      if (!infantData) {
        return 'Los nombres de pasajeros no son modificables. Solo se admite agregar INF. Ejemplo: 2/(INF/DIEGO/20JAN22)';
      }

      passenger.type = 'INF';
      passenger.infant = infantData;

      currentPNR.ssrElements = (currentPNR.ssrElements || []).filter(ssr =>
        !(ssr.code === 'INFT' && ssr.passengerNumber === elementNumber)
      );

      Object.assign(currentPNR, createInfantSSR(currentPNR, elementNumber, infantData));
      resultMessage = `Infant added to passenger element ${elementNumber}`;
    } else {
      return `El elemento ${elementNumber} no admite modificación directa. Use XE para eliminarlo y vuelva a cargarlo.`;
    }

    setCurrentPNR(currentPNR);

    try {
      await persistPNRModification(currentPNR, cmd, resultMessage);
    } catch (error) {
      console.error('Error al guardar modificación de elemento:', error);
    }

    return formatPNRResponse(currentPNR);
  } catch (error) {
    console.error('Error al procesar modificación de elemento:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}
