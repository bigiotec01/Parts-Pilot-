#!/usr/bin/env node

const https = require('https');

const API_KEY = 'AIzaSyAWmTOV17ojzGOxi6RSLEzf46zFiPktyjo';

// Datos de los usuarios recién creados
const USUARIOS_DATA = [
  {
    email: 'ismael.bigio@gmail.com',
    password: 'Admin@123456',
    displayName: 'Ismael Bigío',
    role: 'admin',
  },
  {
    email: 'gonzalez@example.com',
    password: 'Taller@123456',
    displayName: 'Juan González',
    role: 'taller',
    uid: 'QYjsWUgynDYHmY4aq9hXpTxnayD3', // Del output anterior
  },
  {
    email: 'elrapido@example.com',
    password: 'Taller@123456',
    displayName: 'Pedro Martínez',
    role: 'taller',
    uid: '1vddTOc5ZHRDrLPJm2m3qhftJGm2', // Del output anterior
  },
];

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(result.error?.message || data));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function signInUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await httpsRequest(url, options, {
    email,
    password,
    returnSecureToken: true,
  });

  return {
    uid: response.localId,
    email: response.email,
  };
}

async function main() {
  console.log('🔓 Obteniendo UID del usuario admin...\n');

  try {
    const adminUser = await signInUser('ismael.bigio@gmail.com', 'Admin@123456');
    console.log(`✅ Admin UID: ${adminUser.uid}\n`);

    // Actualizar el array con el UID correcto
    USUARIOS_DATA[0].uid = adminUser.uid;

    console.log('📊 Resumen de usuarios para Firestore:\n');
    USUARIOS_DATA.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`UID: ${u.uid}`);
      console.log(`Role: ${u.role}`);
      console.log('---');
    });

    console.log('\n✅ SIGUIENTE PASO: Crear documentos en Firestore\n');
    console.log('Colección "admins":');
    console.log(`  Documento ID: ${USUARIOS_DATA[0].uid}`);
    console.log(`  {`);
    console.log(`    "email": "${USUARIOS_DATA[0].email}",`);
    console.log(`    "nombre": "${USUARIOS_DATA[0].displayName}",`);
    console.log(`    "role": "admin"`);
    console.log(`  }\n`);

    console.log('Colección "talleres":');
    for (let i = 1; i < USUARIOS_DATA.length; i++) {
      const u = USUARIOS_DATA[i];
      console.log(`  Documento ID: ${u.uid}`);
      console.log(`  {`);
      console.log(`    "email": "${u.email}",`);
      console.log(`    "nombre": "${u.displayName}",`);
      console.log(`    "contacto": "${u.displayName}",`);
      console.log(`    "telefono": "555-000-0000",`);
      console.log(`    "uid": "${u.uid}"`);
      console.log(`  }\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
