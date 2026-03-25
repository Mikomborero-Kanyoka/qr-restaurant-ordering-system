import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CustomerSignup from './pages/CustomerSignup';
import StaffSignup from './pages/StaffSignup';
import CustomerHistory from './pages/CustomerHistory';
import AdminDashboard from './pages/AdminDashboard';
import BranchDashboard from './pages/BranchDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import CustomerOrder from './pages/CustomerOrder';
import StaffPending from './pages/StaffPending';
import { Sun, Moon, Download } from 'lucide-react';

function isRunningStandalone() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const syncInstalledState = () => {
      setIsInstalled(isRunningStandalone());
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      syncInstalledState();
    };

    syncInstalledState();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncInstalledState);
    } else {
      mediaQuery.addListener(syncInstalledState);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', syncInstalledState);
      } else {
        mediaQuery.removeListener(syncInstalledState);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();

    try {
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setIsInstalled(isRunningStandalone());
    }
  };

  const canInstall = Boolean(installPrompt) && !isInstalled;

  return (
    <div className="min-h-screen transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {canInstall ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-opacity hover:opacity-90"
          >
            <Download size={18} />
            Install
          </button>
        ) : null}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="rounded-full bg-primary p-2 text-accent shadow-lg transition-all hover:opacity-80"
        >
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </div>
      
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<CustomerSignup />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/staff/pending" element={<StaffPending />} />
          <Route path="/history" element={<CustomerHistory />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/branch/:branchId" element={<BranchDashboard />} />
          <Route path="/kitchen/:branchId" element={<KitchenDashboard />} />
          <Route path="/waiter/:branchId" element={<WaiterDashboard />} />
          <Route path="/table/:tableId" element={<CustomerOrder />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
