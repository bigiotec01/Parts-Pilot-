#!/usr/bin/env node

const http = require('http');
const https = require('https');

const API_KEY = 'AIzaSyAWmTOV17ojzGOxi6RSLEzf46zFiPktyjo';
const PROJECT_ID = 'partspilot-ec37a';

const USUARIOS = [
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
  },
  {
    email: 'elrapido@example.com',
    password: 'Taller@123456',
    displayName: 'Pedro Martínez',
    role: 'taller',
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

async function createUser(email, password, displayName) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await httpsRequest(url, options, {
    email,
    password,
    displayName,
    returnSecureToken: true,
  });

  return response.localId;
}

async function main() {
  console.log('🚀 Creando usuarios en Firebase...\n');

  for (const usuario of USUARIOS) {
    try {
      console.log(`📝 Creando usuario: ${usuario.email}`);
      const uid = await createUser(usuario.email, usuario.password, usuario.displayName);
      console.log(`✅ Usuario creado con UID: ${uid}\n`);
    } catch (error) {
      if (error.message.includes('EMAIL_EXISTS')) {
        console.log(`⚠️  El usuario ${usuario.email} ya existe\n`);
      } else {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }
  }

  console.log('✅ Proceso completado\n');
  console.log('📋 Credenciales para probar:');
  USUARIOS.forEach(u => {
    console.log(`   ${u.email} / ${u.password}`);
  });

  console.log('\n⚠️  IMPORTANTE: Los documentos en Firestore se deben crear manualmente.');
  console.log('   Ve a Firestore Console y crea:');
  console.log('   - Colección "admins" con los documentos correspondientes');
  console.log('   - Colección "talleres" con los documentos correspondientes\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
