import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
              {/* Desktop welcome message and logout */}
              <div className="hidden md:flex items-center space-x-4">
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
        </div>
      </header>

      <div className="flex">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-full max-w-xs bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </a>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Welcome, Admin</span>
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
          </div>
        )}

        {/* Desktop Sidebar */}
        <nav className="hidden md:block w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};