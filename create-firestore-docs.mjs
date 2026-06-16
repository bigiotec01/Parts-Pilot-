#!/usr/bin/env node

import admin from 'firebase-admin';

// Inicializar con projectId únicamente
// Las credenciales se obtienen de la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
// o del cache del firebase CLI

let app;
try {
  const cert = require('./serviceAccountKey.json');
  app = admin.initializeApp({
    credential: admin.credential.cert(cert),
    projectId: 'partspilot-ec37a',
  });
} catch (e) {
  // Si no existe serviceAccountKey, intentar con credenciales por defecto
  try {
    app = admin.initializeApp({
      projectId: 'partspilot-ec37a',
    });
  } catch (e2) {
    console.error('❌ No se pueden cargar credenciales de Firebase');
    console.error('Necesitas: serviceAccountKey.json o GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
  }
}

const db = admin.firestore();

const DATOS = [
  {
    collection: 'admins',
    id: 'kN41h07jj1dgk7iBne6ycCYigaw1',
    data: {
      email: 'ismael.bigio@gmail.com',
      nombre: 'Ismael Bigío',
      role: 'admin',
      createdAt: new Date(),
    },
  },
  {
    collection: 'talleres',
    id: 'QYjsWUgynDYHmY4aq9hXpTxnayD3',
    data: {
      uid: 'QYjsWUgynDYHmY4aq9hXpTxnayD3',
      email: 'gonzalez@example.com',
      nombre: 'Juan González',
      contacto: 'Juan González',
      telefono: '555-000-0000',
      email_contact: 'gonzalez@example.com',
      createdAt: new Date(),
    },
  },
  {
    collection: 'talleres',
    id: '1vddTOc5ZHRDrLPJm2m3qhftJGm2',
    data: {
      uid: '1vddTOc5ZHRDrLPJm2m3qhftJGm2',
      email: 'elrapido@example.com',
      nombre: 'Pedro Martínez',
      contacto: 'Pedro Martínez',
      telefono: '555-000-0000',
      email_contact: 'elrapido@example.com',
      createdAt: new Date(),
    },
  },
];

async function createDocuments() {
  console.log('📝 Creando documentos en Firestore...\n');

  for (const item of DATOS) {
    try {
      console.log(`📄 Creando: ${item.collection}/${item.id}`);
      await db.collection(item.collection).doc(item.id).set(item.data);
      console.log(`✅ Documento creado\n`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Todos los documentos creados');
  process.exit(0);
}

createDocuments().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
