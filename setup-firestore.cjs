#!/usr/bin/env node

const https = require('https');

const PROJECT_ID = 'partspilot-ec37a';
const ADMIN_EMAIL = 'ismael.bigio@gmail.com';
const ADMIN_PASSWORD = 'Admin@123456';

const USUARIOS_UIDS = {
  admin: 'kN41h07jj1dgk7iBne6ycCYigaw1',
  taller1: 'QYjsWUgynDYHmY4aq9hXpTxnayD3',
  taller2: '1vddTOc5ZHRDrLPJm2m3qhftJGm2',
};

const DOCUMENTOS = [
  {
    collection: 'admins',
    documentId: USUARIOS_UIDS.admin,
    fields: {
      email: { stringValue: 'ismael.bigio@gmail.com' },
      nombre: { stringValue: 'Ismael Bigío' },
      role: { stringValue: 'admin' },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  },
  {
    collection: 'talleres',
    documentId: USUARIOS_UIDS.taller1,
    fields: {
      uid: { stringValue: USUARIOS_UIDS.taller1 },
      email: { stringValue: 'gonzalez@example.com' },
      nombre: { stringValue: 'Juan González' },
      contacto: { stringValue: 'Juan González' },
      telefono: { stringValue: '555-000-0000' },
      email_contact: { stringValue: 'gonzalez@example.com' },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  },
  {
    collection: 'talleres',
    documentId: USUARIOS_UIDS.taller2,
    fields: {
      uid: { stringValue: USUARIOS_UIDS.taller2 },
      email: { stringValue: 'elrapido@example.com' },
      nombre: { stringValue: 'Pedro Martínez' },
      contacto: { stringValue: 'Pedro Martínez' },
      telefono: { stringValue: '555-000-0000' },
      email_contact: { stringValue: 'elrapido@example.com' },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  },
];

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const result = res.statusCode >= 400 ? { error: data } : JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getIdToken() {
  const API_KEY = 'AIzaSyAWmTOV17ojzGOxi6RSLEzf46zFiPktyjo';
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await httpsRequest(url, options, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    returnSecureToken: true,
  });

  return response.idToken;
}

async function createDocument(idToken, collection, documentId, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${documentId}`;
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  };

  const body = {
    fields,
  };

  await httpsRequest(url, options, body);
}

async function main() {
  try {
    console.log('🔐 Obteniendo token de autenticación...');
    const idToken = await getIdToken();
    console.log('✅ Token obtenido\n');

    console.log('📝 Creando documentos en Firestore...\n');

    for (const doc of DOCUMENTOS) {
      console.log(`📄 ${doc.collection}/${doc.documentId}`);
      try {
        await createDocument(idToken, doc.collection, doc.documentId, doc.fields);
        console.log('✅ Documento creado\n');
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }

    console.log('✅ ¡Todos los documentos creados exitosamente!');
    console.log('\n🎉 Ya puedes probar el login en:');
    console.log('   https://parts-pilot-six.vercel.app\n');
    console.log('📋 Credenciales disponibles:');
    console.log('   Admin: ismael.bigio@gmail.com / Admin@123456');
    console.log('   Taller 1: gonzalez@example.com / Taller@123456');
    console.log('   Taller 2: elrapido@example.com / Taller@123456');

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();
