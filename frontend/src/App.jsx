import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameStateProvider } from './context/GameState';

// Pages
import PlayerPage from './pages/PlayerPage';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected route component for admin
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Vérification..." />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Admin route with secret code
const AdminRoute = () => {
  const { secretCode } = useParams();
  const { isAuthenticated } = useAuth();
  
  // If already authenticated, go to admin panel
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Show login with the secret code
  return <AdminLogin secretCode={secretCode} />;
};

// Root layout component
const RootLayout = () => {
  return (
    <AuthProvider>
      <div className="App">
        <Outlet />
      </div>
    </AuthProvider>
  );
};

// Create router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <GameStateProvider>
            <PlayerPage />
          </GameStateProvider>
        ),
      },
      {
        path: ":secretCode",
        element: <AdminRoute />,
      },
      {
        path: "admin/*",
        element: (
          <ProtectedAdminRoute>
            <AdminPanel />
          </ProtectedAdminRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
