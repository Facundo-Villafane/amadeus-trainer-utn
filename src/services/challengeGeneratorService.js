/**
 * challengeGeneratorService.js
 *
 * Usa Groq para ayudar al profesor a crear un desafío completo desde una idea simple.
 * Genera: título, enunciado narrativo para el alumno, y las reglas de validación
 * estructuradas (validationRules[]) que el motor programático usará para corregir.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

/**
 * Genera el contenido completo de un desafío a partir de una idea del profesor.
 *
 * @param {string} promptIdea - Idea breve (ej. "dos amigas a París, una con silla de ruedas")
 * @returns {Promise<{ title: string, description: string, validationRules: Array }>}
 */
export const generateChallengeContent = async (promptIdea) => {
    if (!GROQ_API_KEY) {
        throw new Error("VITE_GROQ_API_KEY is not configured.");
    }

    const systemPrompt = `
Eres un asistente experto para profesores de turismo que enseñan el uso del GDS Amadeus.
Tu tarea es tomar una idea breve del profesor y expandirla en un desafío completo.

Debes devolver ÚNICAMENTE el siguiente esquema JSON sin ningún texto adicional:

{
  "title": "Título corto y profesional del caso (máx 60 caracteres)",
  "description": "Enunciado narrativo detallado para el alumno. Inventa nombres de pasajeros argentinos, edades si aplica, teléfono de contacto y email ficticios. Escribe como si fueras el cliente o el supervisor de agencia dando instrucciones. Sin markdown, solo texto plano.",
  "validationRules": [
    // Array de reglas. Usa SOLO los tipos listados abajo.
  ]
}

TIPOS DE REGLAS DISPONIBLES (usa solo estos, con exactamente estos nombres de campo):

1. Segmento de vuelo específico:
   { "type": "segment_route", "origin": "EZE", "destination": "CDG", "date": "03MAY", "description": "Vuelo EZE → CDG el 3 de mayo" }
   - origin y destination son códigos IATA de 3 letras en MAYÚSCULAS
   - date es formato Amadeus: "03MAY", "15NOV", etc. (2 dígitos + 3 letras mes en inglés)
   - Omite los campos que no sean relevantes (ej. si no importa la fecha, no pongas "date")

2. Cantidad de segmentos:
   { "type": "segment_count", "min": 2, "max": 4, "description": "Entre 2 y 4 segmentos" }

3. Cantidad de pasajeros:
   { "type": "passenger_count", "min": 2, "max": 2, "description": "Exactamente 2 adultos" }
   - Puedes agregar "passengerType": "ADT" | "CHD" | "INF" para filtrar por tipo

4. Servicio especial SSR:
   { "type": "ssr_exists", "code": "WCHR", "description": "Silla de ruedas (WCHR)" }
   - Códigos comunes: WCHR (silla de ruedas), VGML (comida vegetariana), KSML (kosher),
     BLML (blanda), INFT (infante en brazos), FOID (documento), CTCE (email), CTCM (teléfono),
     PETC (mascota en cabina), AVIH (animal en bodega), MEDA (asistencia médica), UMNR (menor no acompañado)

5. Documento de identidad cargado:
   { "type": "passenger_has_document", "description": "Debe tener documento cargado (FOID)" }
   - Puedes agregar "docType": "PP" (pasaporte) o "NI" (DNI)

6. Teléfono de contacto:
   { "type": "has_contact_phone", "description": "Debe tener teléfono de contacto (AP)" }

7. Email de contacto:
   { "type": "has_contact_email", "description": "Debe tener email de contacto (APE)" }

8. Elemento de ticketing:
   { "type": "has_ticketing", "description": "Debe tener TK (ticketing)" }
   - Puedes agregar "type": "TL" | "OK" | "XL"

9. Observación (remark):
   { "type": "has_remark", "description": "Debe tener al menos una observación (RM)" }

10. Mensaje OSI:
    { "type": "osi_exists", "description": "Debe tener OSI" }
    - Puedes agregar "contains": "VIP" para buscar texto específico

REGLAS IMPORTANTES:
- Siempre incluye "has_contact_phone" y "has_contact_email" a menos que la consigna explícitamente no lo requiera.
- Para "dos amigas a París" el origin sería "EZE" (Buenos Aires Ezeiza) y destination "CDG" (París).
- Si el alumno necesita hacer ida y vuelta, agrega dos reglas segment_route (una por tramo).
- El campo "description" de cada regla debe explicar en español qué se está verificando.
- NO inventes tipos de reglas fuera de los 10 listados.
`;

    const userPrompt = `Idea del profesor: "${promptIdea}"\n\nGenera el JSON estructurado.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.6,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en API (Status: ${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        return {
            title: result.title || '',
            description: result.description || '',
            validationRules: Array.isArray(result.validationRules) ? result.validationRules : []
        };

    } catch (error) {
        console.error("Error generating challenge with AI:", error);
        throw new Error("No se pudo conectar con la IA para generar el desafío.");
    }
};
