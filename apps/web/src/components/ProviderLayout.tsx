import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProviderLayout: React.FC = () => {
  const token = localStorage.getItem('provider_token');
  if (!token) {
    return <Navigate to="/provider/login" replace />;
  }
  return <Outlet />;
};

export default ProviderLayout;