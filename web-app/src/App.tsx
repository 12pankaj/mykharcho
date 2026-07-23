import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import Wallets from './components/Wallets'
import Transactions from './components/Transactions'
import Loans from './components/Loans'
import Plans from './components/Plans';
import Groups from './components/Groups';
import GroupDetails from './components/GroupDetails';
import Reports from './components/Reports';
import MainLayout from './components/MainLayout'
import Upgrade from './components/Upgrade'
import Support from './components/Support'
import AdminDashboard from './components/AdminDashboard'
import AdminLayout from './components/AdminLayout'
import { UserService } from './api/shared/apiService'

const ProtectedLayout = ({ children, role, onLogout }: any) => {
  // If role is admin or agent, use AdminLayout, otherwise default to MainLayout
  // This prevents getting stuck on a loading screen
  if (role === 'admin' || role === 'agent') {
    return <AdminLayout onLogout={onLogout}>{children}</AdminLayout>;
  }
  return <MainLayout onLogout={onLogout}>{children}</MainLayout>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    if (token) {
        UserService.getProfile()
          .then(res => setUserRole(res.data.role))
          .catch(() => {
            setIsAuthenticated(false);
            setUserRole('user');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          });
    } else {
        setUserRole('user');
    }
  }, []);

  const handleAuthSuccess = async (token: string, rememberMe: boolean = true) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    
    try {
      const res = await UserService.getProfile();
      setUserRole(res.data.role);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Failed to fetch profile after login", err);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return null;

  return (
    <BrowserRouter>
      <div className="App bg-[#08172c] min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login onAuthSuccess={handleAuthSuccess} /> : <Navigate to={userRole === 'admin' ? "/admin-portal" : "/dashboard"} />} 
          />
          <Route 
            path="/signup" 
            element={!isAuthenticated ? <Signup onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/forgot-password" 
            element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/reset-password" 
            element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} 
          />

          {/* Protected Routes (Wrapped in MainLayout) */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Dashboard />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/income" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Transactions />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/expenses" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Transactions />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/loans" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Loans />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/plans" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Plans />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/groups" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Groups />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <GroupDetails />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/reports" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Reports />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/settings" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Settings />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/wallets" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Wallets />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/upgrade" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Upgrade />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/support" 
            element={
              isAuthenticated ? (
                <ProtectedLayout role={userRole} onLogout={handleLogout}>
                  <Support />
                </ProtectedLayout>
              ) : <Navigate to="/login" />
            } 
          />
          
          {/* Admin Specific Sub-Routes (Use same AdminDashboard component with tabs) */}
          <Route 
            path="/admin-portal" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="tickets" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="payments" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/tickets" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="tickets" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/plans" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="plans" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/coupons" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="coupons" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              isAuthenticated ? (
                <AdminLayout onLogout={handleLogout}>
                  <AdminDashboard initialTab="users" />
                </AdminLayout>
              ) : <Navigate to="/login" />
            } 
          />

          {/* Root Redirect */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? (userRole === 'admin' ? "/admin-portal" : "/dashboard") : "/login"} />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
