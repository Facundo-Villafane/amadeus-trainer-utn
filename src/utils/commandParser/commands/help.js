// src/utils/commandParser/commands/help.js
// Función para generar texto de ayuda general
export function generateHelpText() {
    return `
  COMANDOS DISPONIBLES:
  
  AYUDA:
  HE                      Despliega este mensaje de ayuda
  HE[COMANDO]             Ayuda específica sobre un comando
  
  CODIFICACIÓN/DECODIFICACIÓN:
  DAN[CIUDAD]             Codificar ciudad/aeropuerto
  DAC[CÓDIGO]             Decodificar ciudad/aeropuerto
  DNA[AEROLÍNEA]          Codificar aerolínea
  
  DISPONIBILIDAD:
  AN[FECHA][ORIGEN][DESTINO]          Disponibilidad de vuelos
  SN[FECHA][ORIGEN][DESTINO]          Horarios de vuelos
  TN[FECHA][ORIGEN][DESTINO]          Frecuencias de vuelos
  
  PAGINACIÓN:
  MD o M                  Mostrar más resultados (página siguiente)
  U                       Volver a la página anterior
  
  PNR:
  SS[ASIENTOS][CLASE][LÍNEA]          Seleccionar asientos
  NM[CANTIDAD][APELLIDO]/[NOMBRE]     Agregar nombre
  AP [CIUDAD] [TELÉFONO]              Agregar teléfono de contacto
  RF[NOMBRE]                          Recibido de
  ET                                  Finalizar transacción
  RT[LOCALIZADOR]                     Recuperar PNR
  
  Para más detalles sobre un comando específico, escriba HE seguido del comando (ejemplo: HEAN)
  `;
  }
  
  // Función para manejar el comando de ayuda (HE)
  export function handleHelpCommand(cmd) {
    const subCommand = cmd.slice(2).trim().toUpperCase();
    
    // Ayuda específica para cada comando
    switch (subCommand) {
      case 'AN':
        return `
  AN - Despliegue de Disponibilidad Neutral
  
  Formato: AN[FECHA][ORIGEN][DESTINO][/OPCIONES]
  
  Ejemplos:
  AN15NOVBUEMAD         Disponibilidad para el 15 de noviembre de Buenos Aires a Madrid
  AN15NOVBUEMAD/AAR     Disponibilidad con la aerolínea AR (Aerolíneas Argentinas)
  AN15NOVBUEMAD/CJ      Disponibilidad en clase J
  AN15NOVBUEMAD*20NOV   Disponibilidad ida y vuelta
  
  Usa MD para ver más resultados y U para volver a la página anterior.
  `;
      
      case 'SN':
        return `
  SN - Despliegue de Horarios Neutrales
  
  Formato: SN[FECHA][ORIGEN][DESTINO][/OPCIONES]
  
  Ejemplos:
  SN15NOVBUEMAD         Horarios para el 15 de noviembre de Buenos Aires a Madrid
  SN15NOVBUEMAD/AAR     Horarios con la aerolínea AR (Aerolíneas Argentinas)
  
  Muestra todos los vuelos incluyendo clases cerradas (indicadas con C).
  Usa MD para ver más resultados y U para volver a la página anterior.
  `;
      
      case 'TN':
        return `
  TN - Despliegue de Tabla de Horarios (Frecuencias)
  
  Formato: TN[FECHA][ORIGEN][DESTINO][/OPCIONES]
  
  Ejemplos:
  TNBUEMAD             Frecuencias de vuelos entre Buenos Aires y Madrid
  TNBUEMAD/AAR         Frecuencias de Aerolíneas Argentinas entre Buenos Aires y Madrid
  
  Muestra los días de operación de los vuelos (1=lunes, 2=martes, etc. o D=diario).
  Usa MD para ver más resultados y U para volver a la página anterior.
  `;
      
      case 'MD':
      case 'M':
        return `
  MD - Comando Move Down
  
  Muestra la siguiente página de resultados después de ejecutar un comando AN, SN o TN.
  También puedes usar M como abreviatura.
  `;
      
      case 'U':
        return `
  U - Comando Move Up
  
  Vuelve a la página anterior después de haber avanzado con MD.
  `;
      
      case 'SS':
        return `
  SS - Selección de Asientos (Venta de Segmentos)
  
  Formato: SS[CANTIDAD][CLASE][LÍNEA]
  
  Ejemplos:
  SS1Y1                 Selecciona 1 asiento en clase Y de la línea 1
  SS2J3                 Selecciona 2 asientos en clase J de la línea 3
  `;
      
      case 'NM':
        return `
  NM - Nombre de Pasajero
  
  Formato: NM[CANTIDAD][APELLIDO]/[NOMBRE] [TÍTULO]
  
  Ejemplos:
  NM1GARCIA/JUAN MR     Agrega al pasajero Juan Garcia (Sr.)
  NM1PEREZ/ANA MRS      Agrega a la pasajera Ana Perez (Sra.)
  NM1SMITH/JOHN(CHD)    Agrega a un niño (John Smith)
  `;
      
      case 'DAC':
        return `
  DAC - Decodificación de Ciudad o Aeropuerto
  
  Formato: DAC[CÓDIGO]
  
  Ejemplos:
  DACBUE                Decodifica el código BUE (Buenos Aires)
  DACEZE                Decodifica el código EZE (Aeropuerto Internacional de Ezeiza)
  `;
      
      case 'DAN':
        return `
  DAN - Codificación de Ciudad o Aeropuerto
  
  Formato: DAN[NOMBRE]
  
  Ejemplos:
  DANBUENOSAIRES        Codifica la ciudad de Buenos Aires
  DANEZEIZA             Codifica el aeropuerto de Ezeiza
  `;
      
      // Agregar más casos según sea necesario
      
      default:
        return `No se encontró ayuda para el comando: ${subCommand}`;
    }
  }