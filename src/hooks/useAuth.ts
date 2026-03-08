import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const docSnap = await getDoc(doc(db, "Usuarios", fbUser.uid));
        if (docSnap.exists()) {
          setUser({ uid: fbUser.uid, ...docSnap.data() });
          setRole(docSnap.data().rol);
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