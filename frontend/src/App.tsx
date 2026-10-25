import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentListPage } from './pages/DocumentListPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { UploadPage } from './pages/UploadPage';
import { SharedWithMePage } from './pages/SharedWithMePage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { Layout } from './components/Layout';
import './App.css';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected App Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentListPage /></ProtectedRoute>} />
          <Route path="/documents/shared" element={<ProtectedRoute><SharedWithMePage /></ProtectedRoute>} />
          <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetailPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePageWrapped /></ProtectedRoute>} />

          {/* Admin Restricted Routes */}
          <Route path="/permissions" element={<ProtectedRoute requiredRole="ADMIN"><PermissionsPage /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute requiredRole="ADMIN"><ActivityLogPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Wrapper for ProfilePage to include Layout
const ProfilePageWrapped: React.FC = () => (
  <Layout>
    <ProfilePage />
  </Layout>
);

export default App;
