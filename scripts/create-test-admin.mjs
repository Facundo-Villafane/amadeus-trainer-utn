// scripts/create-test-admin.mjs
// Script de una sola ejecución para crear la cuenta de admin de tests.
// Uso: node scripts/create-test-admin.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ─── Configuración de Firebase ───────────────────────────────────────────────
// Copiá estos valores desde src/services/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyBaZk1933AVf2fNWWddMe1GDIyRqPx1PeU",
    authDomain: "amadeus-trainer.firebaseapp.com",
    projectId: "amadeus-trainer",
    storageBucket: "amadeus-trainer.firebasestorage.app",
    messagingSenderId: "195690360678",
    appId: "1:195690360678:web:c74ffcab03ed6f7cef22a7"
};

// ─── Credenciales de la cuenta de test ──────────────────────────────────────
const TEST_EMAIL = 'test-admin@amadeus-trainer.local';
const TEST_PASSWORD = 'TestAdmin2026!';  // Podés cambiarla

// ────────────────────────────────────────────────────────────────────────────
async function main() {
    if (!firebaseConfig.apiKey) {
        console.error('❌ Completá firebaseConfig en este script primero.');
        process.exit(1);
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let uid;

    // 1. Crear usuario o iniciar sesión si ya existe
    try {
        console.log(`Creando usuario ${TEST_EMAIL}...`);
        const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        uid = cred.user.uid;
        console.log(`✅ Usuario creado. UID: ${uid}`);
    } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
            console.log('ℹ Usuario ya existe. Iniciando sesión para obtener UID...');
            const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            uid = cred.user.uid;
            console.log(`✅ UID: ${uid}`);
        } else {
            console.error('❌ Error al crear usuario:', err.message);
            process.exit(1);
        }
    }

    // 2. Crear/actualizar documento en Firestore con rol admin
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);

    await setDoc(userRef, {
        ...(existing.exists() ? existing.data() : {}),
        email: TEST_EMAIL,
        role: 'admin',
        displayName: 'Test Admin (Playwright)',
        isTestAccount: true,
    }, { merge: true });

    console.log('✅ Documento en Firestore creado/actualizado con role: admin');
    console.log('\n─────────────────────────────────────────────');
    console.log('Ahora creá el archivo .env.playwright con:');
    console.log(`TEST_ADMIN_EMAIL=${TEST_EMAIL}`);
    console.log(`TEST_ADMIN_PASS=${TEST_PASSWORD}`);
    console.log('─────────────────────────────────────────────');

    process.exit(0);
}

main().catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
});
