// Agregar más casos según sea necesario// src/utils/commandParser/commands/help.js
// Función para generar texto de ayuda general
export function generateHelpText() {
  return `
  COMANDOS DISPONIBLES:
  
  AYUDA:
  HE                      Despliega este mensaje de ayuda
  HE[COMANDO]             Ayuda específica sobre un comando (ej: HEAN, HEST)
  
  CODIFICACIÓN/DECODIFICACIÓN:
  DAN[CIUDAD]             Codificar nombre de ciudad/aeropuerto → código IATA
  DNA[CÓDIGO]             Decodificar código IATA → nombre de ciudad/aeropuerto
  DAL[AEROLÍNEA]          Codificar nombre de aerolínea → código IATA
  DNE[CÓDIGO/MODELO]      Decodificar código IATA de equipo/avión → detalles
  
  DISPONIBILIDAD:
  AN[FECHA][ORIGEN][DESTINO]         Disponibilidad de vuelos
  SN[FECHA][ORIGEN][DESTINO]         Horarios de vuelos
  TN[FECHA][ORIGEN][DESTINO]         Frecuencias de vuelos
  
  PAGINACIÓN:
  MD o M                  Mostrar más resultados (página siguiente)
  U                       Volver a la página anterior
  
  PNR:
  SS[CANT][CLASE][LÍNEA]             Seleccionar segmento de vuelo
  NM[CANT][APELLIDO]/[NOMBRE]        Agregar nombre de pasajero
  AP [TELÉFONO]                      Agregar teléfono de contacto
  APE-[CORREO]                       Agregar correo electrónico de contacto
  OS [AEROLÍNEA] [MENSAJE]           Agregar información especial (OSI)
  SR[CÓDIGO]/P[#]                    Solicitud de servicio especial (SSR)
  SRFOID[AERO]HK1-[TIPO][#]/P[#]    Agregar documento de identidad (FOID)
  SM                                 Mapa de asientos gráfico (modal)
  SM[N]                              Mapa de asientos críptico del segmento N en terminal
  ST                                 Asignar asiento aleatorio a todos los pax (seg 1)
  ST/A/P[N]/S[N]                     Asignar asiento de pasillo
  ST/W/P[N]/S[N]                     Asignar asiento de ventana
  ST/[ASIENTO]/P[N]/S[N]             Asignar asiento específico (ej: ST/24A/P1/S1)
  RM [TEXTO]                         Comentario general
  RC [TEXTO]                         Comentario confidencial
  RIR [TEXTO]                        Comentario para itinerario
  RF[NOMBRE]                         Recibido de (obligatorio antes de ET)
  TK[OPCIONES]                       Emisión de billetes (time limit)
  ET                                 Finalizar transacción
  ER                                 Finalizar y recuperar PNR
  RT[LOCALIZADOR]                    Recuperar PNR guardado
  RRN[CANT]                          Clonar itinerario de un PNR guardado
  SP[N]                              Dividir PNR (separar pasajero N)
  EF                                 Cerrar y archivar PNR asociado (en división)
  IED / IBD                          Desplegar itinerario (Extendido / Básico)
  IEP / IBP                          Imprimir itinerario
  IEP-EML-[MAIL]                     Enviar itinerario por email
  XE[ELEMENTO(S)]                    Borrar elemento(s) del PNR
  XI                                 Cancelar PNR (requiere confirmación con RF)
  
  Para más detalles: HE seguido del comando. Ej: HEAN  HEST  HESM  HEXE
  Para lista de códigos SSR: HE SSRCODES
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
  DACMAD                Decodifica el código MAD (Madrid)
  `;

    case 'DAN':
      return `
  DAN - Codificación de Ciudad o Aeropuerto

  Formato: DAN[NOMBRE]

  Ejemplos:
  DANBUENOSAIRES        Busca el código IATA de Buenos Aires
  DANEZEIZA             Busca el código IATA del aeropuerto de Ezeiza
  DANMADRID             Busca el código IATA de Madrid

  Acepta búsqueda parcial: DANBUENOS devuelve resultados con "BUENOS" en el nombre.
  `;

    case 'DNA':
      return `
  DNA - Decodificación de Código IATA (Ciudad / Aeropuerto)

  Formato: DNA[CÓDIGO]

  Equivalente a DAC. Decodifica un código IATA a su nombre completo.

  Ejemplos:
  DNABUE                Buenos Aires — Ministro Pistarini (EZE) + Jorge Newbery (AEP)
  DNAEZE                Aeropuerto Internacional Ministro Pistarini, Argentina
  DNAMAD                Madrid — Adolfo Suárez Barajas (MAD)
  `;

    case 'DAL':
      return `
  DAL - Codificación de Aerolínea

  Formato: DAL[NOMBRE]

  Ejemplos:
  DALAEROLINEAS         Codifica Aerolíneas Argentinas (AR)
  DALIBERIA             Codifica Iberia (IB)
  DALLATAM              Codifica LATAM Airlines (LA)

  Acepta búsqueda parcial de nombre.
  `;

    case 'DNE':
      return `
  DNE - Decodificar Tipo de Avión (Equipo)
  
  Formato: DNE [CÓDIGO O MARCA/MODELO]
  
  Decodifica el código IATA de 3 letras de un equipo, o busca por fabricante y modelo.
  
  Ejemplos:
  DNE 738               Muestra datos del Boeing 737-800
  DNE 320               Decodifica el Airbus A320
  DNE AIRBUS            Despliega un listado de modelos de Airbus disponibles
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

  Formato 1 (SSR estándar):
    SR[CÓDIGO]/P[PASAJERO]
    Ejemplo: SRVGML/P2    Comida vegetariana para pax 2

  Formato 2 (Contacto del pasajero):
    SR CTCE [AERO] HK1-[EMAIL_CODIFICADO]/P[PASAJERO]
    SR CTCM [AERO] HK1-[TELÉFONO]/P[PASAJERO]

  Ejemplos CTCE/CTCM:
    SR CTCE IB HK1-BELEN./PAZ//GMAIL.COM/P2
    SR CTCM IB HK1-541155550000/P1

  Notas:
  - El segmento S[N] es opcional en el formato simple, obligatorio en CTCE/CTCM
  - Use HE SSRCODES para ver la lista completa de códigos SSR válidos
  - Use HE CTCE para detalles del encoding de email
  `;

    case 'CTCE':
      return `
  SR CTCE - Email de contacto del pasajero

  Formato: SR CTCE [AEROLINEA] HK1-[EMAIL_CODIFICADO]/P[N]

  Encoding del email (se escribe tal cual en la terminal):
    @  se codifica como  //
    _  se codifica como  ..
    -  se codifica como  ./

  Ejemplos:
    belen.paz@gmail.com    →  SR CTCE IB HK1-BELEN./PAZ//GMAIL.COM/P1
    john_doe@yahoo.com     →  SR CTCE IB HK1-JOHN..DOE//YAHOO.COM/P2
    maria-garcia@iberia.es →  SR CTCE IB HK1-MARIA./GARCIA//IBERIA.ES/P1

  Usar YY como aerolínea si son varias aerolíneas en el itinerario.
  Solo un CTCE por pasajero (el nuevo reemplaza al anterior).
  `;

    case 'CTCM':
      return `
  SR CTCM - Teléfono de contacto del pasajero

  Formato: SR CTCM [AEROLINEA] HK1-[TELEFONO]/P[N]

  El teléfono es solo dígitos, sin + ni espacios.
  Se usa el código de país seguido del número.

  Ejemplos:
    SR CTCM IB HK1-541155550000/P1   (Argentina: 54 + 11 + número)
    SR CTCM YY HK1-3411234567/P2     (España: 34 + número)

  Usar YY como aerolínea si son varias aerolíneas en el itinerario.
  Solo un CTCM por pasajero (el nuevo reemplaza al anterior).
  `;

    case 'RRN':
      return `
  RRN - Duplicar / Clonar Itinerario

  Este comando crea un nuevo PNR copiando únicamente los segmentos de vuelo
  (itinerario) del PNR actualmente cargado en pantalla. Todos los demás datos
  (pasajeros, contactos, asientos) se omiten. El PNR original queda ignorado.

  Formatos:
  RRN             Clona el itinerario solicitando 1 lugar (1 pasajero)
  RRN/[CANT]      Clona el itinerario solicitando [CANT] lugares

  Ejemplos:
  RRN          → Crea una copia del vuelo para 1 pasajero y lo deja en estado DK
  RRN/3        → Crea una copia del vuelo solicitando espacio para 3 pasajeros

  Notas:
  - Solo se puede usar luego de recuperar un PNR con RT o habiéndolo guardado.
  - El nuevo PNR pasa a ser tu reserva activa.
  - Deberás cargar nuevamente los nombres (NM), contactos (AP), firmar (RF)
    y reservar (ER/ET) para generar el nuevo localizador.
  `;

    case 'SP':
      return `
  SP - Split PNR (División de Reserva)

  Este comando sirve para separar uno o más pasajeros de un PNR existente y
  crear un PNR nuevo (Asociado) solo para ellos.

  Flujo completo de división:
  1. RT[LOCALIZADOR]     → Abrir el PNR original (Parent)
  2. SP[#PAX]            → Dividir. Ej: SP2 o SP1,3
                           (La terminal mostrará -ASSOCIATE PNR-)
  3. RF[FIRMA]           → Firmar el PNR asociado
  4. EF                  → Cerrar el asociado y volver al original
                           (La terminal mostrará -PARENT PNR-)
  5. RF[FIRMA]           → Firmar el PNR original
  6. ET                  → Finalizar la transacción. Se generará el nuevo
                           localizador para el PNR asociado.

  Notas:
  - Solo se puede dividir un PNR previamente guardado.
  - No podés separar a todos los pasajeros (siempre debe quedar al menos uno en el Parent).
  `;

    case 'IE':
    case 'IB':
    case 'IED':
    case 'IBD':
    case 'IEP':
    case 'IBP':
      return `
  IE / IB - Generación de Itinerarios

  Despliega, imprime o envía por correo el itinerario del PNR.
  Los itinerarios pueden ser Extendidos (IE) o Básicos (IB).

  Variantes de Despliegue (Display):
  IED            Despliega en pantalla Itin. Extendido para todos
  IBD            Despliega en pantalla Itin. Básico para todos

  Variantes de Impresión (Print):
  IEP            Imprime Itin. Extendido para todos
  IBP            Imprime Itin. Básico para todos
  IEP/P1         Imprime Itin. Extendido solo para Pax 1
  IEPJ           Imprime Itin. Extendido (formato Journal/Todos)

  Variantes de Correo (Email):
  IEP-EMLA                  Envía itinerario a todos los correos cargados (AP/CTCE)
  IEP-EML-mail@mail.com     Envía itinerario al correo especificado directamente
  IEPJ-EMLA                 Envía a todos los correos en formato conjunto

  Filtro de idioma (ejemplo simulado):
  IEP/LPEN       Imprime en inglés (Language Print EN)
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

  Formato:
    SM         →  Abre el selector gráfico de asientos (modal visual)
    SM[N]      →  Muestra el mapa críptico del segmento N en la terminal

  Ejemplos:
    SM         Abre el modal gráfico para seleccionar asientos del PNR
    SM1        Muestra el mapa críptico del segmento 1 en texto
    SM2        Muestra el mapa críptico del segmento 2 en texto

  Leyenda del mapa críptico:
    *   Disponible
    -   Ocupado
    R   Reservado por la aerolínea
    ^   Fila de salida de emergencia (disponible)
    i   Restricción de infante

  Nota: el número indica el segmento del PNR. Si el PNR tiene 1 segmento,
  SM2 devolverá un error. Luego de ver el mapa críptico, puede usar ST
  para asignar asientos específicos.
  `;

    case 'ST':
      return `
  ST - Asignación de Asiento (Seat Assignment)

  Formatos:
    ST                      Asigna asiento aleatorio a todos los pax (segmento 1)
    ST/A/P[N]/S[N]          Asiento de pasillo (Aisle)
    ST/W/P[N]/S[N]          Asiento de ventana (Window)
    ST/[ASIENTO]/P[N]/S[N]  Asiento específico

  Ejemplos:
    ST                      Aleatorio para todos los pasajeros
    ST/A/P1/S1              Pasillo para el pasajero 1, segmento 1
    ST/W/P2/S1              Ventana para el pasajero 2, segmento 1
    ST/24A/P1/S1            Asiento 24A, pasajero 1, segmento 1
    ST/12C/P2/S2            Asiento 12C, pasajero 2, segmento 2

  El segmento (S[N]) es siempre obligatorio en los formatos con barra.
  El asiento se registra como SSR RQST en el PNR.
  Alternativa visual: SM (abre el selector gráfico).
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