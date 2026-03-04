// e2e/terminal.spec.js
// Tests de la terminal Amadeus — solo lectura, no modifican datos.
import { test, expect } from '@playwright/test';

test.describe('Terminal — comandos AN/SN/TN', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        // Esperar a que la terminal esté lista
        await page.waitForSelector('[placeholder="Ingrese un comando..."]', { timeout: 15000 });
    });

    // ─── Helper para enviar un comando y obtener la última línea de salida ───
    async function sendCommand(page, cmd) {
        // Contenedor del historial: tiene overflow-auto + font-mono (el input NO tiene overflow-auto)
        const history = page.locator('.overflow-auto.font-mono');
        const linesBefore = await history.locator('> *').count();

        await page.fill('[placeholder="Ingrese un comando..."]', cmd);
        await page.keyboard.press('Enter');

        // Esperar: 1 línea de eco del comando + 1 línea de respuesta = +2
        // expect() auto-reintenta con intervalo — más robusto que waitForTimeout
        await expect(history.locator('> *')).toHaveCount(linesBefore + 2, { timeout: 10000 });

        // Última línea = respuesta del comando
        return history.locator('> *').last().textContent();
    }

    test('HELP muestra los comandos disponibles', async ({ page }) => {
        const output = await sendCommand(page, 'HE');
        expect(output).toContain('AN');
    });

    test('AN sin vuelos para una ruta inexistente muestra "No se encontraron"', async ({ page }) => {
        // Ruta que muy probablemente no existe
        const output = await sendCommand(page, 'AN15MARZZZBBB');
        expect(output).toMatch(/no se encontraron|no\s+flight|error/i);
    });

    test('AN con ruta válida muestra tabla o mensaje informativo', async ({ page }) => {
        // Buscar BUE → MAD para hoy o mañana (ajustar según datos cargados)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = months[tomorrow.getMonth()];

        const cmd = `AN${day}${month}BUEMAD`;
        const output = await sendCommand(page, cmd);
        // Acepta tanto "vuelos encontrados" como "no encontrados" — lo importante
        // es que no haya un error de JS no manejado
        expect(output).toBeTruthy();
        expect(output).not.toMatch(/TypeError|undefined is not/i);
    });

    test('SN funciona sin crashear', async ({ page }) => {
        const output = await sendCommand(page, 'SN15MARBUEMAD');
        expect(output).toBeTruthy();
        expect(output).not.toMatch(/TypeError|undefined is not/i);
    });

    test('comando inválido muestra mensaje de error legible', async ({ page }) => {
        const output = await sendCommand(page, 'XXXXXXXXXX');
        expect(output).toBeTruthy();
        // No debe mostrar stack trace ni "undefined"
        expect(output).not.toContain('undefined');
        expect(output).not.toContain('TypeError');
    });

    test('navegación por historial con flecha arriba', async ({ page }) => {
        const input = page.locator('[placeholder="Ingrese un comando..."]');

        await input.fill('HE');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Flecha arriba debe recuperar el último comando
        await input.focus();
        await page.keyboard.press('ArrowUp');
        const value = await input.inputValue();
        expect(value).toBe('HE');
    });
});
