import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navigation = [
  { name: 'Providers', href: '/admin/providers', icon: '👥' },
  { name: 'Requests', href: '/admin/requests', icon: '📋' },
  { name: 'Reports', href: '/admin/reports', icon: '📊' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, Admin
              </span>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <div className="p-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};