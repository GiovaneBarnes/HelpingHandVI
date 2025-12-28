import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProviderDetail } from './pages/ProviderDetail';
import { Join } from './pages/Join';
import { Dashboard } from './pages/Dashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminProviders } from './pages/AdminProviders';
import { AdminReports } from './pages/AdminReports';
import { AdminSettings } from './pages/AdminSettings';
import { AdminRequests } from './pages/AdminRequests';
import ProviderLayout from './components/ProviderLayout';
import ProviderLogin from './pages/provider/ProviderLogin';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ForgotPassword from './pages/provider/ForgotPassword';
import ResetPassword from './pages/provider/ResetPassword';

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
      <Route path="/admin/requests" element={<AdminRequests />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/provider/login" element={<ProviderLogin />} />
      <Route path="/provider/forgot-password" element={<ForgotPassword />} />
      <Route path="/provider/reset-password" element={<ResetPassword />} />
      <Route path="/provider" element={<ProviderLayout />}>
        <Route index element={<Navigate to="/provider/dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
      </Route>
    </Routes>
  );
}

export default App