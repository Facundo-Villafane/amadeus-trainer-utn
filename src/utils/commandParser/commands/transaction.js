// src/utils/commandParser/commands/transaction.js
import { generatePNR } from '../../pnrGenerator';

// Función para manejar el fin de transacción (ET/ER)
export function handleEndTransaction(cmd) {
  try {
    // Generar un código de reserva (PNR)
    const recordLocator = generatePNR();
    
    if (cmd === 'ET') {
      return `FIN DE TRANSACCION COMPLETADO - ${recordLocator}`;
    } else {
      // Para ER, simulamos que reabre el PNR
      return `
---RLR---
RP/UTN5168476/AGENTE FF/WE 01JAN/1200Z ${recordLocator}
1.APELLIDO/NOMBRE MR
2 XX 1234 Y 01JAN 1 XXXYYY HK1 1200 1400 01JAN E 737
3 AP BUE 12345678-H
4 TK TL01JAN/1200
*TRN*
>`;
    }
  } catch (error) {
    console.error('Error al procesar el comando:', error);
    return `Error al procesar el comando: ${error.message}`;
  }
}