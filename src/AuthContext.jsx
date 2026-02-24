import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            // Считаем ранг на лету
            const exp = data.experience || 0;
            let rank = "Bronze Student";
            if (exp > 500) rank = "Silver Student";
            if (exp > 1500) rank = "Gold Elite";
            setUserData({ ...data, rank, id: u.uid });
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);