import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillsPage } from './pages/SkillsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { RequestsPage } from './pages/RequestsPage';
import { SessionsPage } from './pages/SessionsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { AdminPage } from './pages/AdminPage';
import { MessagesPage } from './pages/MessagesPage';
import { CommunityPage } from './pages/CommunityPage';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const { tx } = useLanguage();
  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#3D2317] border-t-[#EE7838]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#8C7A70]">
              {tx('Memuat workspace SkillLoop...', 'Loading SkillLoop workspace...')}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  const { tx } = useLanguage();
  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#3D2317] border-t-[#EE7838]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#8C7A70]">
              {tx('Memuat workspace SkillLoop...', 'Loading SkillLoop workspace...')}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      {user ? <DashboardPage /> : <LandingPage />}
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/landing"
            element={
              <AppShell>
                <LandingPage />
              </AppShell>
            }
          />
          <Route
            path="/login"
            element={
              <AppShell>
                <AuthPage mode="login" />
              </AppShell>
            }
          />
          <Route
            path="/register"
            element={
              <AppShell>
                <AuthPage mode="register" />
              </AppShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <SkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches/:userId"
            element={
              <ProtectedRoute>
                <MatchDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
