import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. ¿Es admin?
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists()) {
            setUser({ role: 'admin', uid: firebaseUser.uid });
            setPerfil(adminDoc.data());
            setCargando(false);
            return;
          }

          // 2. ¿Es cuenta principal de taller?
          const tallerDoc = await getDoc(doc(db, 'talleres', firebaseUser.uid));
          if (tallerDoc.exists()) {
            setUser({ role: 'taller', uid: firebaseUser.uid, tallerId: firebaseUser.uid });
            setPerfil(tallerDoc.data());
            setCargando(false);
            return;
          }

          // 3. ¿Es sub-usuario de un taller?
          const subUserDoc = await getDoc(doc(db, 'tallerUsuarios', firebaseUser.uid));
          if (subUserDoc.exists()) {
            const subData = subUserDoc.data();
            const tallerId = subData.tallerId;
            // Carga el perfil del taller principal
            const mainTallerDoc = await getDoc(doc(db, 'talleres', tallerId));
            setUser({ role: 'taller', uid: firebaseUser.uid, tallerId });
            setPerfil(mainTallerDoc.exists() ? mainTallerDoc.data() : subData);
            setCargando(false);
            return;
          }

          // Sin perfil asignado
          setError('Tu cuenta no tiene perfil asignado. Contacta al administrador.');
          await signOut(auth);
        } catch (e) {
          if (e.code === 'permission-denied') {
            setError('Error de permisos en la base de datos. Verifica las reglas de Firestore.');
          } else {
            setError('Error al cargar el perfil: ' + e.message);
          }
          await signOut(auth);
        }
      } else {
        setUser(null);
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (e.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError('Error al iniciar sesión: ' + e.message);
      }
    }
  };

  const logout = () => signOut(auth);

  return { user, perfil, cargando, error, login, logout, setError };
}
