// src/utils/commandParser/commands/equipment.js
import { mockEquipment } from '../../../data/mockData';

export async function handleDecodeEquipment(cmd) {
    try {
        const searchTerm = cmd.slice(3).trim().toUpperCase();

        if (!searchTerm) {
            return 'FORMAT ERROR - PLEASE PROVIDE EQUIPMENT CODE OR NAME';
        }

        // Buscar coincidencias (por código, fabricante o modelo)
        const matches = mockEquipment.filter(eq =>
            eq.code.includes(searchTerm) ||
            eq.manufacturer.includes(searchTerm) ||
            eq.model.toUpperCase().includes(searchTerm)
        );

        if (matches.length === 0) {
            return `NOT FOUND - NO EQUIPMENT MATCHES '${searchTerm}'`;
        }

        let response = `DNE ${searchTerm}\n`;

        // Sort matches by code for consistent output
        matches.sort((a, b) => a.code.localeCompare(b.code));

        matches.forEach(eq => {
            // Formato Amadeus: 738 N BOEING   737-800                 JET  123-186
            // CODE (3) + " " + TYPE (1) + " " + MANUFACTURER (8) + " " + MODEL (23) + " " + ENGINE (3) + "  " + SEATS (7)

            const code = eq.code.padEnd(3);
            const type = eq.type;
            const mfg = eq.manufacturer.padEnd(8);
            const model = eq.model.padEnd(23);
            const eng = eq.engine.padEnd(3);
            const seats = eq.seats.padStart(7);

            response += `${code} ${type} ${mfg} ${model} ${eng}  ${seats}\n`;
        });

        // Mimic the Amadeus terminal footer seen in the user's screenshot
        response += `*TRN*`;

        return response;
    } catch (error) {
        console.error('Error al procesar el comando DNE:', error);
        return `Error al procesar el comando: ${error.message}`;
    }
}
