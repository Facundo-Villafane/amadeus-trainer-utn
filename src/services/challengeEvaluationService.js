/**
 * challengeEvaluationService.js
 *
 * Pipeline de evaluación en dos etapas:
 * 1. Motor determinístico (challengeValidationEngine) verifica cada regla contra el PNR → pass/fail
 * 2. Groq recibe SOLO el reporte de resultados y lo convierte en feedback legible para el alumno
 *
 * La IA nunca decide si algo pasó o falló — solo humaniza el reporte.
 */

import { evaluateRules } from './challengeValidationEngine';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

/**
 * Evalúa la entrega de un alumno.
 *
 * @param {Object} challenge - El challenge con su array validationRules[].
 * @param {Object} pnrData   - Snapshot del PNR guardado en Firestore.
 * @returns {Promise<{ isPass: boolean, feedback: string }>}
 */
export const evaluateChallengeSubmission = async (challenge, pnrData) => {
    // ── Etapa 1: validación programática ──────────────────────────────────────
    const rules = challenge.validationRules || [];

    if (rules.length === 0) {
        return {
            isPass: true,
            feedback: 'Este desafío no tiene reglas de validación configuradas. Consultá a tu docente.'
        };
    }

    const report = evaluateRules(pnrData, rules);

    // ── Etapa 2: humanizar con Groq ───────────────────────────────────────────
    if (!GROQ_API_KEY) {
        // Sin API key, devolvemos feedback básico generado localmente
        return buildFallbackFeedback(report);
    }

    const systemPrompt = `
Eres un asistente educativo en un simulador del GDS Amadeus.
Se te entrega un reporte objetivo con las reglas que el alumno aprobó y las que no cumplió.
Tu única tarea es redactar un feedback claro, constructivo y motivador en español, dirigido directamente al alumno (segunda persona).

Normas estrictas:
- NO inventes reglas ni resultados adicionales a los que se te dan.
- NO menciones campos técnicos del PNR que no aparezcan en el reporte.
- Si el alumno aprobó todo, felicitalo y menciona brevemente qué hizo bien.
- Si falló algo, explicá claramente qué faltó y cómo debería haberlo hecho en Amadeus.
- Devuelve SOLO el JSON: { "feedback": "texto aquí" }
`;

    const passedList = report.passed.map(r => `✅ ${r.description}`).join('\n');
    const failedList = report.failed.map(r => `❌ ${r.description}`).join('\n');

    const userPrompt = `
Resultado de la evaluación automática:
Veredicto: ${report.isPass ? 'APROBADO' : 'DESAPROBADO'}

Reglas aprobadas:
${passedList || '(ninguna)'}

Reglas no cumplidas:
${failedList || '(ninguna)'}

Redacta el feedback para el alumno.
`;

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
                temperature: 0.4,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', errorText);
            return buildFallbackFeedback(report);
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);

        if (typeof parsed.feedback !== 'string') {
            return buildFallbackFeedback(report);
        }

        return {
            isPass: report.isPass,
            feedback: parsed.feedback
        };

    } catch (error) {
        console.error("Error humanizando feedback con Groq:", error);
        return buildFallbackFeedback(report);
    }
};

/**
 * Feedback básico generado localmente cuando Groq no está disponible.
 * Siempre refleja el resultado real del motor de validación.
 */
function buildFallbackFeedback(report) {
    const lines = [];

    if (report.isPass) {
        lines.push('¡Excelente trabajo! Cumpliste todos los requisitos del desafío.');
    } else {
        lines.push('Tu reserva no cumplió todos los requisitos. Revisá los siguientes puntos:');
    }

    if (report.passed.length > 0) {
        lines.push('\nRequisitos cumplidos:');
        report.passed.forEach(r => lines.push(`  ✅ ${r.description}`));
    }

    if (report.failed.length > 0) {
        lines.push('\nRequisitos no cumplidos:');
        report.failed.forEach(r => lines.push(`  ❌ ${r.description}`));
    }

    return {
        isPass: report.isPass,
        feedback: lines.join('\n')
    };
}
