// Script simple para crear usuarios en Firebase usando REST API
// Requiere: Firebase API Key (pública, no la clave de servicio)

const API_KEY = 'AIzaSyA...'; // Reemplaza con tu API Key
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.localId; // UID del usuario
}

async function main() {
  console.log('🚀 Creando usuarios en Firebase...\n');

  for (const usuario of USUARIOS) {
    try {
      console.log(`📝 Creando usuario: ${usuario.email}`);
      const uid = await createUser(usuario.email, usuario.password, usuario.displayName);
      console.log(`✅ Usuario creado con UID: ${uid}\n`);
    } catch (error) {
      console.error(`❌ Error:`, error.message, '\n');
    }
  }

  console.log('✅ Proceso completado');
  console.log('\n📋 Credenciales para probar:');
  USUARIOS.forEach(u => {
    console.log(`  ${u.email} / ${u.password}`);
  });
}

main();
