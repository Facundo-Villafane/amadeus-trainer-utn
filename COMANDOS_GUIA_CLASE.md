# Comandos del Terminal Amadeus - Guía de Clase

## 1. BÚSQUEDA DE VUELOS

### `AN` — Availability Neutral (Disponibilidad)
Muestra vuelos disponibles entre dos aeropuertos.

```
AN15NOVBUEMAD          → Vuelos del 15 Nov, Buenos Aires → Madrid
AN15NOVBUEMAD/AAR      → Filtrando por Aerolíneas Argentinas
AN15NOVBUEMAD/CJ       → Filtrando por clase J
ANBUEMAD               → Sin fecha (usa hoy)
```

### `SN` — Schedule (Horarios)
Igual que AN pero muestra horarios sin disponibilidad de asientos.

```
SN15NOVBUEMAD
SN15NOVBUEMAD/AAR
```

### `TN` — Timetable (Frecuencias)
Muestra con qué frecuencia opera una ruta (sin fecha específica).

```
TNBUEMAD
TNBUEMAD/AAR
```

### Paginación
```
MD  (o M)   → Siguiente página de resultados
U           → Página anterior
```

---

## 2. CODIFICACIÓN / DECODIFICACIÓN

```
DANBUENOSAIRES  → Codifica nombre de ciudad → código IATA
DNAMAD          → Decodifica MAD → nombre de ciudad
DACBUE          → Alternativa para decodificar aeropuerto
DNAAR           → Decodifica código de aerolínea AR
DNE 738         → Decodifica equipo: Boeing 737-800
DNE AIRBUS      → Lista todos los modelos Airbus
```

---

## 3. CREACIÓN DE PNR

Flujo completo de ejemplo:

### Paso 1 — Buscar vuelo y vender asiento: `SS`
```
SS1Y1     → 1 asiento, clase Y, línea 1 del availability
SS2J3     → 2 asientos, clase J, línea 3
```

### Paso 2 — Agregar pasajero: `NM`
```
NM1GARCIA/JUAN MR         → Adulto masculino
NM1PEREZ/ANA MRS          → Adulto femenino
NM1SMITH/JOHN(CHD)        → Niño (CHD)
```

### Paso 3 — Agregar teléfono: `AP`
```
APBUE12345678-M           → Teléfono móvil en Buenos Aires
APMAD98765432-H           → Teléfono hogar en Madrid
```

Tipos: `M` = Móvil, `H` = Hogar, `B` = Trabajo

### Paso 4 — Agregar email: `APE`
```
APE-usuario@ejemplo.com
```

### Paso 5 — Ticketing: `TK`
```
TKOK                      → Emisión inmediata
TKTL15NOV/1600            → Tiempo límite 15 Nov a las 16:00
TKXL16NOV/1200            → Límite de cancelación 16 Nov 12:00
```

### Paso 6 — Recibido de: `RF`
```
RFAGENTE
RFMARIA PEREZ
```

> **Requerido** antes de `ET` o `ER`

### Paso 7 — Cerrar PNR: `ET` o `ER`
```
ET    → Guarda el PNR, genera localizador de 6 caracteres
ER    → Guarda el PNR y muestra el itinerario completo
```

---

## 4. RECUPERAR / CONSULTAR PNR

```
RTABC123    → Recupera el PNR con localizador ABC123
```

---

## 5. ELEMENTOS ESPECIALES

### `SR` — Special Service Request (SSR)
```
SRVGML/P2                                      → Comida vegetariana, pasajero 2
SR CTCE IB HK1-BELEN./PAZ//GMAIL.COM/P2        → Email de contacto
SR CTCM IB HK1-541155550000/P1                 → Teléfono de contacto
```

> Nota: en emails `@` se escribe `//`, `_` se escribe `..`, `-` se escribe `./`

### `SRFOID` — Documento de identidad
```
SRFOID YY HK1-PP12345678/P1    → Pasaporte, pasajero 1
SRFOID IB HK1-NI30123456/P2   → DNI, pasajero 2
```

Tipos: `PP` = Pasaporte, `NI` = DNI

### `OS` — Other Special Information (OSI)
```
OS UX PAX VIP WAGNER /P1       → Info VIP para aerolínea UX, pax 1
OS YY FREQUENT FLYER           → Para todas las aerolíneas del itinerario
```

---

## 6. OBSERVACIONES

```
RM CONTACTAR AL PASAJERO 24HS ANTES DEL VUELO    → Observación general
RC TARIFA NEGOCIADA CON DESCUENTO 25%            → Observación confidencial
RIR PRESENTARSE 3 HORAS ANTES DEL VUELO         → Observación de itinerario
```

---

## 7. MAPA DE ASIENTOS

```
SM            → Abre el selector gráfico de asientos
SM1           → Mapa de texto para el segmento 1
ST            → Asigna asiento aleatorio a todos los pasajeros
ST/A/P1/S1    → Asiento de pasillo (Aisle), pasajero 1, segmento 1
ST/W/P2/S1    → Asiento de ventana (Window), pasajero 2, segmento 1
ST/24A/P1/S1  → Asiento específico 24A, pasajero 1, segmento 1
```

Leyenda del mapa: `*` = Libre, `-` = Ocupado, `R` = Reservado, `^` = Salida de emergencia

---

## 8. ITINERARIO

```
IED                       → Ver itinerario extendido (todos los pasajeros)
IEP                       → Imprimir itinerario extendido
IEP/P1                    → Imprimir solo para el pasajero 1
IEP-EML-user@mail.com     → Enviar por email
IBD                       → Itinerario básico display
IBP                       → Itinerario básico imprimir
```

---

## 9. ELIMINAR / CANCELAR

```
XE3          → Elimina el elemento 3 del PNR
XE3,6        → Elimina los elementos 3 y 6
XE3-6        → Elimina los elementos del 3 al 6
XI           → Cancela el PNR completo (requiere RF después)
```

---

## 10. SPLIT DE PNR

Flujo para separar pasajeros de un mismo PNR:

```
RTABC123     → 1. Cargar el PNR
SP2          → 2. Separar al pasajero 2 (crea PNR asociado)
RFAGENTE     → 3. Firmar el PNR asociado
EF           → 4. Cerrar el asociado y volver al principal
RFAGENTE     → 5. Firmar el PNR principal
ET           → 6. Completar el split (genera 2 localizadores)
```

También: `SP1,3` para separar los pasajeros 1 y 3 a la vez.

### `RRN` — Clonar itinerario
```
RRN      → Copia el itinerario para 1 pasajero nuevo
RRN/3    → Copia para 3 pasajeros nuevos
```

---

## 11. AYUDA EN EL TERMINAL

```
HE           → Muestra todos los comandos disponibles
HEAN         → Ayuda específica del comando AN
HESM         → Ayuda sobre mapa de asientos
HE SSRCODES  → Lista completa de códigos SSR
```

---

## Flujo completo de clase (PNR de ejemplo)

```
AN15NOVBUEMAD       → 1. Busco vuelos Buenos Aires → Madrid
SS1Y1               → 2. Vendo 1 asiento clase Y, línea 1
NM1GARCIA/JUAN MR   → 3. Agrego pasajero
APBUE12345678-M     → 4. Teléfono móvil
APE-juan@mail.com   → 5. Email
TKTL20NOV/1800      → 6. Tiempo límite de ticketing
RFAGENTE            → 7. Recibido de (obligatorio)
ER                  → 8. Guardo y veo el PNR completo
RTABC123            → 9. Recupero por localizador
```

---

## Estados importantes

| Estado | Significado |
|--------|-------------|
| `HK`   | Confirmado (Hold Kept) |
| `DK`   | Solicitado, sin confirmar |
| `TL`   | Tiempo límite de ticketing |
