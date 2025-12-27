import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProviderDetail } from './pages/ProviderDetail';
import { Join } from './pages/Join';
import { Dashboard } from './pages/Dashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminProviders } from './pages/AdminProviders';
import { AdminReports } from './pages/AdminReports';
import { AdminSettings } from './pages/AdminSettings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/provider/:id" element={<ProviderDetail />} />
      <Route path="/join" element={<Join />} />
      <Route path="/dashboard/:providerId" element={<Dashboard />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/providers" element={<AdminProviders />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Routes>
  );
}

export default App