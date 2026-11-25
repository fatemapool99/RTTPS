import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Passenger Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PassengerDashboard from './pages/PassengerDashboard';
import TrainSearchPage from './pages/TrainSearchPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminTrainManagement from './pages/AdminTrainManagement';
import AdminScheduleManagement from './pages/AdminScheduleManagement';
import AdminReportsPage from './pages/AdminReportsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Passenger Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/search" element={<TrainSearchPage />} />
                <Route path="/tracking/:trainNumber" element={<LiveTrackingPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Protected Passenger Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <PassengerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/trains" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminTrainManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/schedules" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminScheduleManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/reports" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
