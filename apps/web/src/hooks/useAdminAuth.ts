import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // TODO: Check admin permissions via custom claims or API
        setUser(firebaseUser);
      } else {
        navigate('/admin/login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  return { user, loading };
};