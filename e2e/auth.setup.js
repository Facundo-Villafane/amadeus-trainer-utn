// e2e/auth.setup.js
// Guarda el estado de sesión de Firebase en disco para reutilizarlo en los tests.
// Se ejecuta una sola vez antes de todos los tests (proyecto "setup").
import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_AUTH_FILE = path.join(__dirname, '.auth/user.json');
const ADMIN_AUTH_FILE = path.join(__dirname, '.auth/admin.json');

// Helper: hace login con email/password apuntando directo a /login
async function loginWithEmail(page, email, password) {
    // /login directamente — "/" puede redirigir a /home sin mostrar el form
    await page.goto('/login');
    await page.waitForSelector('#email-address', { timeout: 15000 });

    await page.fill('#email-address', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // Firebase Auth es async — esperar redirección
    await page.waitForURL(/\/(home|dashboard)/, { timeout: 20000 });
}

// ─── Usuario normal ────────────────────────────────────────────────
setup('autenticar usuario normal', async ({ page }) => {
    await loginWithEmail(
        page,
        process.env.TEST_USER_EMAIL || '',
        process.env.TEST_USER_PASS || ''
    );
    await page.context().storageState({ path: USER_AUTH_FILE });
    console.log('✅ Sesión de usuario guardada en', USER_AUTH_FILE);
});

// ─── Admin ─────────────────────────────────────────────────────────
setup('autenticar admin', async ({ page }) => {
    await loginWithEmail(
        page,
        process.env.TEST_ADMIN_EMAIL || '',
        process.env.TEST_ADMIN_PASS || ''
    );
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    console.log('✅ Sesión de admin guardada en', ADMIN_AUTH_FILE);
});
