
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Rol } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Rol | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, "Usuarios", fbUser.uid));
          if (snap.exists()) {
            const userData = snap.data();
            setUser({ uid: fbUser.uid, ...userData });
            setRole(userData.rol as Rol);
          } else {
            // Fallback development behavior
            setUser({ uid: fbUser.uid, email: fbUser.email });
            setRole(Rol.CLIENTE);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(Rol.CLIENTE);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, role, loadingAuth };
};
