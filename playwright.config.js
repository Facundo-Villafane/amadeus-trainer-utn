// playwright.config.js
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.playwright sobreescribiendo cualquier valor previo del proceso
const envPath = path.resolve(process.cwd(), '.env.playwright');
const result = dotenv.config({ path: envPath, override: true });
console.log('[E2E] .env.playwright:', result.error ? result.error.message : `OK — EMAIL=${process.env.TEST_USER_EMAIL}`);

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: 1,
    reporter: [['html', { open: 'never' }], ['list']],

    use: {
        baseURL: 'http://localhost:5173',
        // Guardar estado de autenticación entre tests del mismo archivo
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    // Proyectos: solo Chromium para el CI, liviano
    projects: [
        {
            name: 'setup',
            testMatch: '**/auth.setup.js',
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Reutilizar el estado de sesión guardado por auth.setup
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },
        {
            name: 'admin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/admin.json',
            },
            dependencies: ['setup'],
        },
    ],

    // Levantar el servidor de desarrollo automáticamente antes de los tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60000,
    },
});
