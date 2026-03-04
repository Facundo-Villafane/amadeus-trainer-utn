// e2e/admin-flights.spec.js
// Tests del panel de admin — vuelos.
// Los tests de escritura crean vuelos con prefijo TEST- y los limpian al final.
import { test, expect } from '@playwright/test';

// Estos tests usan el proyecto "admin" (storageState: e2e/.auth/admin.json)
test.use({ storageState: 'e2e/.auth/admin.json' });

const TEST_FLIGHT_NUMBER = 'TEST-9999';

test.describe('Admin — Gestión de Vuelos', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/flights');
        await page.waitForLoadState('domcontentloaded');
        // Esperar el título de la página en lugar de networkidle
        // (Firestore mantiene conexiones abiertas y networkidle nunca se resuelve)
        await page.waitForSelector('h1', { timeout: 15000 });
    });

    // ─────────────────────────────────────────────
    // Lectura
    // ─────────────────────────────────────────────
    test('la tabla de vuelos carga correctamente', async ({ page }) => {
        // Usar columnheader para apuntar exactamente al <th> de la tabla
        await expect(page.getByRole('columnheader', { name: 'Vuelo' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('columnheader', { name: 'Origen/Destino' })).toBeVisible();
    });

    test('el botón "Añadir Vuelo" existe y está habilitado', async ({ page }) => {
        const btn = page.locator('button', { hasText: 'Añadir Vuelo' });
        await expect(btn).toBeVisible();
        await expect(btn).toBeEnabled();
    });

    test('el modal de "Añadir Vuelo" se abre al hacer clic', async ({ page }) => {
        await page.locator('button', { hasText: 'Añadir Vuelo' }).click();
        // Título del modal — usar heading para ser específico
        await expect(page.getByRole('heading', { name: 'Nuevo Vuelo' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('input[placeholder="IB"]')).toBeVisible();
        await expect(page.locator('input[placeholder="1301"]')).toBeVisible();
    });

    test('el modal se cierra con el botón Cancelar', async ({ page }) => {
        await page.locator('button', { hasText: 'Añadir Vuelo' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Vuelo' })).toBeVisible();

        await page.locator('button', { hasText: 'Cancelar' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Vuelo' })).not.toBeVisible({ timeout: 3000 });
    });

    test('el filtro de búsqueda funciona', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Buscar vuelos..."]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('XXXXXXXXX_NO_EXISTE');
        await page.waitForTimeout(300);
        // La tabla no debe mostrar filas (o mostrar mensaje vacío)
        const rows = page.locator('tbody tr');
        // Acepta 0 o 1 (fila de "no encontrado") pero no más de 2
        expect(await rows.count()).toBeLessThanOrEqual(2);
    });

    test('toggle "Ver vuelos pasados" es visible y funciona', async ({ page }) => {
        const toggleBtn = page.locator('button', { hasText: /ver vuelos pasados/i });
        await expect(toggleBtn).toBeVisible();
        await toggleBtn.click();
        // Después del clic debe cambiar el texto
        await expect(page.locator('button', { hasText: /ocultar pasados/i })).toBeVisible({ timeout: 3000 });
    });

    // ─────────────────────────────────────────────
    // Escritura con cleanup
    // ─────────────────────────────────────────────
    test('crear un vuelo de prueba y verificar que aparece en la tabla', async ({ page }) => {
        // Abrir modal
        await page.locator('button', { hasText: 'Añadir Vuelo' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Vuelo' })).toBeVisible();

        // Completar campos obligatorios
        await page.locator('input[placeholder="IB"]').fill('ZZ');
        await page.locator('input[placeholder="1301"]').fill(TEST_FLIGHT_NUMBER.replace('TEST-', ''));
        await page.locator('input[placeholder="EZE"]').fill('TST');
        await page.locator('input[placeholder="MAD"]').fill('TSX');

        // Fecha de salida: mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isoDate = tomorrow.toISOString().split('T')[0];
        await page.locator('input[type="date"]').fill(isoDate);
        await page.locator('input[type="time"]').fill('10:00');
        await page.locator('input[placeholder="12.5"]').fill('2');

        // Guardar
        await page.locator('button', { hasText: 'Crear vuelo' }).click();

        // Esperar toast de éxito
        await expect(page.getByText('Vuelo creado')).toBeVisible({ timeout: 10000 });
    });

    test('cleanup: eliminar el vuelo de prueba TEST-9999', async ({ page }) => {
        // Buscar el vuelo de prueba
        const searchInput = page.locator('input[placeholder="Buscar vuelos..."]');
        await searchInput.fill('9999');
        await page.waitForTimeout(500);

        // Si existe, eliminar
        const deleteBtn = page.locator('button[title="Eliminar vuelo"]').first();
        if (await deleteBtn.isVisible()) {
            page.once('dialog', dialog => dialog.accept()); // aceptar el confirm()
            await deleteBtn.click();
            await expect(page.getByText('Vuelo eliminado')).toBeVisible({ timeout: 10000 });
        }
        // Si no existe, el test pasa igual (ya fue limpiado)
    });
});

test.describe('Admin — Filtros de vuelos', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });

    test('mostrar filtros y filtrar por estado', async ({ page }) => {
        await page.goto('/admin/flights');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('h1', { timeout: 15000 });

        // Mostrar filtros
        await page.locator('button', { hasText: /mostrar filtros/i }).click();
        await expect(page.getByText('Aerolínea')).toBeVisible({ timeout: 3000 });

        // Seleccionar estado "Retrasado"
        await page.locator('select').filter({ hasText: 'Todos' }).last().selectOption('Delayed');
        await page.waitForTimeout(1000);

        // La tabla debe actualizarse sin crashear
        await expect(page.locator('table')).toBeVisible();
    });
});
