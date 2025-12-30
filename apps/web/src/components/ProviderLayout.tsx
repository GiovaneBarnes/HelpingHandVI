import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { firebaseAuth } from '../services/firebaseAuth';

const ProviderLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial token
    const token = localStorage.getItem('provider_token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      return;
    }

    // Listen for Firebase auth state changes to refresh token
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        // Update the stored token with fresh one
        localStorage.setItem('provider_token', user.idToken);
        setIsAuthenticated(true);
      } else {
        // User signed out
        localStorage.removeItem('provider_token');
        setIsAuthenticated(false);
      }
    });

    return unsubscribe;
  }, []);

  if (isAuthenticated === null) {
    // Still checking auth state
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/provider/login" replace />;
  }

  return <Outlet />;
};

export default ProviderLayout;