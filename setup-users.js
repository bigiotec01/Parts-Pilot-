import admin from 'firebase-admin';

// Usar credenciales del CLI de Firebase (ya autenticado)
process.env.FIREBASE_AUTH_EMULATOR_HOST = '';  // Asegurar que usa producción

admin.initializeApp({
  projectId: 'partspilot-ec37a',
});

const auth = admin.auth();
const db = admin.firestore();

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

async function createUsers() {
  console.log('🚀 Creando usuarios en Firebase...\n');

  for (const usuario of USUARIOS) {
    try {
      console.log(`📝 Creando usuario: ${usuario.email}`);
      
      // Crear usuario en Authentication
      const userRecord = await auth.createUser({
        email: usuario.email,
        password: usuario.password,
        displayName: usuario.displayName,
      });

      const uid = userRecord.uid;
      console.log(`✅ Usuario autenticación creado: ${uid}`);

      // Crear documento en Firestore según el rol
      if (usuario.role === 'admin') {
        await db.collection('admins').doc(uid).set({
          email: usuario.email,
          nombre: usuario.displayName,
          role: 'admin',
          createdAt: new Date(),
        });
        console.log(`✅ Admin creado en Firestore\n`);
      } else if (usuario.role === 'taller') {
        await db.collection('talleres').doc(uid).set({
          uid: uid,
          email: usuario.email,
          nombre: usuario.displayName,
          contacto: usuario.displayName,
          telefono: '555-000-0000',
          email_contact: usuario.email,
          createdAt: new Date(),
        });
        console.log(`✅ Taller creado en Firestore\n`);
      }
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  El usuario ${usuario.email} ya existe\n`);
      } else {
        console.error(`❌ Error al crear ${usuario.email}: ${error.message}\n`);
      }
    }
  }

  console.log('✅ Proceso completado\n');
  console.log('📋 Credenciales para probar:');
  USUARIOS.forEach(u => {
    console.log(`   ${u.email} / ${u.password}`);
  });
  console.log('');

  process.exit(0);
}

createUsers().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
