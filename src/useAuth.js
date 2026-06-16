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
        // Buscar perfil en Firestore (admin o taller)
        const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (adminDoc.exists()) {
          setUser({ role: 'admin', uid: firebaseUser.uid });
          setPerfil(adminDoc.data());
        } else {
          const tallerDoc = await getDoc(doc(db, 'talleres', firebaseUser.uid));
          if (tallerDoc.exists()) {
            setUser({ role: 'taller', uid: firebaseUser.uid, tallerId: firebaseUser.uid });
            setPerfil(tallerDoc.data());
          }
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
      setError('Usuario o contraseña incorrectos.');
    }
  };

  const logout = () => signOut(auth);

  return { user, perfil, cargando, error, login, logout, setError };
}
