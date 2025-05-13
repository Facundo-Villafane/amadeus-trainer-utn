      // Agregar más casos según sea necesario// src/utils/commandParser/commands/help.js
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
  APE-[CORREO]                        Agregar correo electrónico de contacto
  OS [AEROLÍNEA] [MENSAJE] /P[#]      Agregar información especial (OSI)
  SR[CÓDIGO]/P[#]                     Agregar solicitud de servicio especial
  SRFOID[AEROLÍNEA]HK1-[TIPO][#]/P[#] Agregar documento de identidad
  SM                                  Abrir mapa de asientos gráfico
  ST[SEGMENTO][ASIENTO]/P[PASAJERO]   Asignar asiento (ej: ST14A/P1)
  RM [TEXTO]                          Agregar comentario general
  RC [TEXTO]                          Agregar comentario confidencial
  RIR [TEXTO]                         Agregar comentario para el itinerario
  RF[NOMBRE]                          Recibido de
  TK[OPCIONES]                        Emisión de billetes
  ET                                  Finalizar transacción
  ER                                  Finalizar y recuperar PNR
  RT[LOCALIZADOR]                     Recuperar PNR
  XE[ELEMENTO(S)]                     Borrar elemento(s) del PNR
  XI                                  Cancelar PNR (requiere confirmación)
  
  Para más detalles sobre un comando específico, escriba HE seguido del comando (ejemplo: HEXE)
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
      
      case 'OS':
        return `
  OS - Other Special Information (Información Especial Adicional)
  
  Formato: OS [AEROLÍNEA] [MENSAJE] /P[NÚMERO_PASAJERO]
  
  Ejemplos:
  OS UX PAX VIP WAGNER /P1     Información especial para la aerolínea UX, referente al pasajero 1
  OS YY FREQUENT FLYER         Información especial para todas las aerolíneas del itinerario
  
  Notas:
  - El mensaje no puede exceder los 68 caracteres
  - Si se usa YY como código de aerolínea, se añade el OSI a todas las aerolíneas del itinerario
  - La referencia al pasajero (/P1) es opcional
  - Un PNR puede contener hasta 127 elementos OSI
  
  Este comando es opcional pero importante para incluir información relevante para las aerolíneas.
  `;

      case 'XE':
        return `
  XE - Borrar elementos del PNR
  
  Formato: XE[ELEMENTO(S)]
  
  Ejemplos:
  XE3                   Borra el elemento número 3 del PNR actual
  XE3,6                 Borra los elementos 3 y 6 del PNR
  XE3-6                 Borra los elementos del 3 al 6 del PNR (inclusivo)
  
  Los elementos en un PNR están numerados secuencialmente:
  1,2,... : Pasajeros
  n+1,... : Segmentos/Vuelos
  n+m+1,...: Contactos y otros elementos
  
  Nota: No se puede deshacer esta acción.
  `;
      
      case 'XI':
        return `
  XI - Cancelar el PNR completo
  
  Formato: XI
  
  Este comando solicita la cancelación del PNR actual. 
  Requiere confirmación usando el comando RF[NOMBRE].
  
  Secuencia de ejemplo:
  1. XI                 Solicita cancelar el PNR actual
  2. RF AGENTE          Confirma la cancelación del PNR
  
  Una vez cancelado, el PNR no será recuperable con RT, pero los administradores
  aún podrán verlo marcado como cancelado en la interfaz de administración.
  `;
      
      case 'ET':
      case 'ER':
        return `
  ET / ER - Finalizar Transacción
  
  ET                    Finaliza la transacción y guarda el PNR
  ER                    Finaliza la transacción, guarda el PNR y lo muestra completo
  
  La finalización de transacción genera un código de reserva (record locator)
  de 6 caracteres y confirma todos los segmentos.
  `;
      
      case 'RT':
        return `
  RT - Recuperar PNR
  
  Formato: RT[LOCALIZADOR]
  
  Ejemplos:
  RTABC123             Recupera el PNR con código localizador ABC123
  
  Permite recuperar un PNR guardado previamente para visualizarlo
  o continuar trabajando con él.
  `;
      
      case 'AP':
        return `
  AP - Agregar Contacto Telefónico
  
  Formato: AP [CIUDAD] [TELÉFONO]-[TIPO]
  
  Ejemplos:
  AP BUE 12345678-M     Agregar teléfono móvil en Buenos Aires
  AP MAD 98765432-H     Agregar teléfono de hogar en Madrid
  
  Tipos de contacto:
  M - Móvil/Celular
  H - Hogar (Home)
  B - Trabajo (Business)
  
  Se requiere al menos un contacto para finalizar el PNR.
  `;
      
      case 'APE':
        return `
  APE - Agregar Contacto Email
  
  Formato: APE-[CORREO]
  
  Ejemplos:
  APE-usuario@ejemplo.com    Agregar dirección de correo electrónico
  
  El correo electrónico es opcional pero recomendado para notificaciones.
  `;
      
      case 'RF':
        return `
  RF - Received From (Recibido De)
  
  Formato: RF [NOMBRE]
  
  Ejemplos:
  RF AGENTE             Indica que el PNR fue recibido del agente
  RF MARIA PEREZ        Indica que el PNR fue recibido de María Pérez
  
  Este comando es obligatorio antes de finalizar un PNR.
  También se utiliza para confirmar la cancelación de un PNR después del comando XI.
  `;
       
      case 'TK':
            return `
      TK - Emisión de billetes (Ticketing)
      
      Formato: TK[OPCIÓN]
      
      Ejemplos:
      TKOK                  Emisión inmediata (OK)
      TKTL15NOV/1600        Time Limit hasta el 15 de noviembre a las 16:00
      TKXL16NOV/1200        Cancelar emisión (XL) hasta el 16 de noviembre a las 12:00
      
      Se requiere una opción de emisión para finalizar el PNR.
      `;
      
      case 'SR':
        return `
  SR - Special Service Request (Solicitud de Servicio Especial)
  
  Formato: SR[CÓDIGO]/P[NÚMERO_PASAJERO]
  
  Ejemplos:
  SRVGML/P2               Solicita comida vegetariana para el pasajero 2
  SRWCHR/P1               Solicita silla de ruedas para el pasajero 1
  
  Notas:
  - Se crea un SSR para cada segmento del itinerario automáticamente
  - Los pasajeros con infantes automáticamente tienen un SSR INFT
  - Use HE SSRCODES para ver la lista completa de códigos SSR válidos
  
  Este comando es opcional pero importante para incluir servicios especiales
  para los pasajeros.
  `;
      
      case 'FOID':
      case 'SRFOID':
        return `
  SRFOID - Form of Identification (Documento de Identidad)
  
  Formato: SRFOID [AEROLÍNEA] HK1-[TIPO][NÚMERO]/P[PASAJERO]
  
  Ejemplos:
  SRFOID YY HK1-PP12345678/P1      Pasaporte con número 12345678 para el pasajero 1
  SRFOID IB HK1-NI30123456/P2      DNI con número 30123456 para el pasajero 2
  SRFOID BA HK1-PPA1B2C3D4/P3      Pasaporte alfanumérico A1B2C3D4 para el pasajero 3
  
  Tipos de documentos:
  PP - Pasaporte
  NI - Documento Nacional de Identidad
  
  Notas:
  - El número de documento puede contener letras, números y guiones
  - Si se usa YY como código de aerolínea, se añade el FOID a todas las aerolíneas del itinerario
  - El documento aparecerá como: SSR FOID YY HK1 PP12345678/P1
  - Si el pasajero ya tenía un FOID, el nuevo reemplazará al anterior
  
  Este comando es importante para añadir información del documento de identidad
  del pasajero, que puede ser requerido por las aerolíneas o para inmigración.
  `;
      
      case 'SSRCODES':
        return `
  CÓDIGOS SSR VÁLIDOS:
  
  CÓDIGOS DE COMIDAS ESPECIALES:
  VGML - Vegetariana (no lácteos)     VLML - Vegetariana (lacto-ovo)
  DBML - Diabética                    FPML - Plato de frutas
  KSML - Kosher                       MOML - Musulmana/Halal
  HNML - Hindú                        SFML - Mariscos
  ORML - Oriental                     SPML - Comida especial
  LCML - Baja en calorías             LFML - Baja en colesterol
  LSML - Baja en sodio (sin sal)      NLML - Sin lactosa
  LPML - Baja en proteínas            CHML - Comida para niños
  PRML - Baja en purina               HMFL - Alto contenido de fibra
  RVML - Vegetariana cruda
  
  SERVICIOS DE MOVILIDAD REDUCIDA:
  WCHR - Silla de ruedas (para rampa)  WCHS - Silla de ruedas (para escaleras)
  WCHC - Silla de ruedas (hasta asiento) WCOB - Silla de ruedas a bordo
  WCMP - Silla manual (solo US)        WCBW - Silla de ruedas
  WCBD - Silla con batería seca       
  
  OTROS SERVICIOS:
  INFT - Infante (sin ocupar asiento)  UMNR - Menor no acompañado
  PETC - Animal en cabina              EXST - Asiento extra
  BSCT - Cuna/moisés para bebé         BULK - Equipaje voluminoso
  CBBG - Equipaje en cabina            DEAF - Sordo (con/sin perro guía)
  FRAG - Equipaje frágil               XBAG - Exceso de equipaje
  SPEQ - Equipo deportivo              SEAT - Asiento pre-reservado
  LING - Servicios lingüísticos        NSST - Asiento de no fumador
  NSSA - No fumador, pasillo           NSSW - No fumador, ventana
  NSSB - No fumador, asiento central   SMST - Fumador
  SMSA - Fumador, pasillo              SMSW - Fumador, ventana
  SMSB - Fumador, asiento central      SLPR - Cama/litera en cabina
  STCR - Pasajero en camilla
  
  LEALTAD/MILLAS:
  FQTV - Acumulación de millas         FQTU - Acumulación y upgrade
  FQTS - Servicio de viajero frecuente FQTR - Canje de millas
  
  ESTADOS/DOCUMENTOS:
  DEPA - Deportado acompañado          DEPU - Deportado sin acompañar
  TWOV - Tránsito sin visa             TKTL - Límite de tiempo de billete
  TKNA - Número de billete (elem. FA)  TKNC - Número de billete (transmisión)
  TKNM - Número de billete (elem. FH)  PSPT - Pasaporte
  CKIN - Info para personal aeropuerto GRPS - Pasajeros viajando juntos
  GRPF - Tarifa de grupo               SEMN - Marinero (tripulación de barco)
  NAME - Nombre diferente              OTHS - Otros servicios no especificados
  MAAS - Asistencia en el aeropuerto   FRAV - Primera disponibilidad
  MEDA - Caso médico                   PCTC - Datos de contacto de emergencia
  COUR - Mensajero comercial          
  `;
      
      case 'SM':
        return `
    SM - Mapa de Asientos (Seat Map)
    
    Formato: SM o SM[SEGMENTO]
    
    Ejemplos:
    SM                    Abre el mapa de asientos para el primer segmento del PNR
    SM2                   Abre el mapa de asientos para el segundo segmento del PNR
    
    Este comando abre una interfaz gráfica para seleccionar asientos de manera
    visual para los pasajeros de su PNR.
    `;
      
      case 'ST':
      return `
    ST - Asignación de Asientos (Seat Assignment)

    Formato: ST/[ASIENTO]/P[PASAJERO]/S[SEGMENTO]

    Ejemplos:
    ST/24L/P2/S1            Asigna el asiento 24L al pasajero 2 para el segmento 1
    ST/15C/P1/S2            Asigna el asiento 15C al pasajero 1 para el segmento 2

    Este comando permite asignar asientos directamente mediante la terminal,
    sin necesidad de usar la interfaz gráfica. Es una alternativa al comando SM.

    El asiento se registra como un SSR RQST en el PNR.
    `;
      
      case 'RM':
        return `
  RM - Comentario General (Remark)
  
  Formato: RM [TEXTO]
  
  Ejemplos:
  RM CONTACTAR AL PASAJERO 24HS ANTES DEL VUELO     Agrega un comentario general al PNR
  RM PRECIO COTIZADO USD 954                        Agrega información sobre precio
  
  Los comentarios RM son visibles para todos los agentes que acceden al PNR.
  Se muestran en el PNR como líneas numeradas, con el prefijo "RM" seguido del texto.
  `;
      
      case 'RC':
        return `
  RC - Comentario Confidencial (Confidential Remark)
  
  Formato: RC [TEXTO]
  
  Ejemplos:
  RC TARIFA NEGOCIADA CON DESCUENTO 25%          Agrega un comentario confidencial
  RC PASAJERO VIP - AUTORIZADO POR GERENCIA      Agrega información interna
  
  Los comentarios RC son visibles solo para los agentes de la misma oficina o agencia.
  En un sistema real, estos comentarios no se comparten con otras agencias.
  Se muestran en el PNR como líneas numeradas, con el prefijo "RC" seguido del texto.
  `;
      
      case 'RIR':
        return `
  RIR - Comentario para Itinerario (Remark for Itinerary/Receipt)
  
  Formato: RIR [TEXTO]
  
  Ejemplos:
  RIR PRESENTARSE 3 HORAS ANTES DEL VUELO       Agrega un comentario que aparecerá en el itinerario
  RIR DOCUMENTO DE IDENTIDAD OBLIGATORIO        Información para el pasajero
  
  Los comentarios RIR se incluyen en el itinerario o boleto impreso.
  Son visibles para el pasajero y contienen información relevante para su viaje.
  Se muestran en el PNR como líneas numeradas, con el prefijo "RIR" seguido del texto.
  `;
      
      default:
        return `No se encontró ayuda para el comando: ${subCommand}`;
    }
  }