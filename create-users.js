// Script para crear usuarios en Firebase usando una REST API simplificada
// Ejecuta: npm install axios
// Luego:   node create-users.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = 'AIzaSyDo_LvXSW-nT4KJ3d5z_fzqKk2yZ8Kq-pA'; // Reemplaza con tu API Key
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

async function createUser(email, password, displayName) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error desconocido');
    }

    return data.localId;
  } catch (error) {
    throw error;
  }
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

  console.log('✅ Proceso completado');
  console.log('\n📋 Credenciales para probar:');
  USUARIOS.forEach(u => {
    console.log(`  ${u.email} / ${u.password}`);
  });

  console.log('\n⚠️  NOTA: Ahora debes crear los documentos en Firestore manualmente.');
  console.log('   - Para admin: ir a Firestore → + Iniciar colección "admins"');
  console.log('   - Para talleres: ir a Firestore → + Iniciar colección "talleres"');
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
