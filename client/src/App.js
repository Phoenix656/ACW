import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DocumentForm from './pages/DocumentForm';
import UploadComponent from './pages/UploadComponent';
import MasterView from './pages/MasterView';
import NotificationsList from './pages/NotificationsList';

// Simple protected route component
function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/documents/new"
          element={
            <Protected>
              <DocumentForm />
            </Protected>
          }
        />
        <Route
          path="/documents/:id/upload"
          element={
            <Protected>
              <UploadComponent />
            </Protected>
          }
        />
        <Route
          path="/master"
          element={
            <Protected role="master">
              <MasterView />
            </Protected>
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected>
              <NotificationsList />
            </Protected>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
