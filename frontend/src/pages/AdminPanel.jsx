import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Puzzle, 
  Calendar, 
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Admin components
import AdminDashboard from '../components/admin/AdminDashboard';
import CreateCrosswordGame from '../components/admin/CreateCrosswordGame';
import ManagePuzzles from '../components/admin/ManagePuzzles';
import Button from '../components/common/Button';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showCreatePuzzle, setShowCreatePuzzle] = React.useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
  };

  const navigation = [
    { name: 'Tableau de bord', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Créer un puzzle', to: '/admin/create', icon: Puzzle },
    { name: 'Gérer les puzzles', to: '/admin/manage', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-primary-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) => `
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 w-5 h-5 transition-colors duration-200
                      ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}
                    `}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Routes>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            {/* <Route path="create" element={<CreatePuzzle />} />
            <Route path="manage" element={<ManagePuzzles />} />
            <Route path="settings" element={<Settings />} /> */}
            
            {/* Temporary placeholders for unimplemented routes */}
            <Route path="create" element={
              <CreateCrosswordGame onBack={() => window.history.back()} />
            } />
            
            <Route path="manage" element={<ManagePuzzles />} />
            
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
