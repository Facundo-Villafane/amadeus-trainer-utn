// src/utils/commandParser/paginationState.js

// Estado de paginación compartido entre todos los comandos
const paginationState = {
    currentCommand: '',    // Comando actual completo (ej: ANBUEMAD)
    commandType: '',       // Tipo de comando (AN, SN, TN, etc.)
    dateStr: null,         // Fecha extraída del comando (ej: 9SEP)
    origin: null,          // Origen (ej: BUE)
    destination: null,     // Destino (ej: MAD)
    options: null,         // Opciones del comando (ej: /AAR)
    lastVisible: null,     // Último documento visible para "Move Down"
    previousPages: [],     // Historial de páginas para "Move Up"
    pageSize: 5,           // Número de vuelos por página
    currentResults: [],    // Resultados actuales para mostrar
    currentIndex: 1        // Contador para la numeración continua
  };
  
  export default paginationState;