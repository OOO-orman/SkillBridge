import { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useNotifications = (userData) => {
  const [unreadApps, setUnreadApps] = useState(0);

  useEffect(() => {
    if (!auth.currentUser || !userData) return;

    let q;
    if (userData.role === 'company') {
      // Компании: считаем новые заявки (статус pending)
      q = query(
        collection(db, "applications"),
        where("companyId", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );
    } else if (userData.role === 'student') {
      // Студенту: считаем одобренные заявки (статус accepted)
      q = query(
        collection(db, "applications"),
        where("studentId", "==", auth.currentUser.uid),
        where("status", "==", "accepted")
      );
    }

    if (q) {
      const unsubscribe = onSnapshot(q, (snap) => {
        setUnreadApps(snap.size);
      });
      return () => unsubscribe();
    }
  }, [userData]);

  return { unreadApps };
};