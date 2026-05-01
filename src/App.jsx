import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/ui/Layout';
import { getConfig, CONFIG_UPDATED_EVENT } from './services/api';
import Home from './components/ui/Home';
import Configuration from './components/config/Configuration';
import Sensors from './components/sensors/Sensors';
import Tasks from './components/tasks/Tasks';
import Login from './components/auth/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// This component will be the parent of all protected routes
const ProtectedLayout = () => (
  <ProtectedRoute>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

function applyFaviconFromConfig() {
  const { faviconDataUrl } = getConfig();
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (faviconDataUrl) {
    link.href = faviconDataUrl;
    link.removeAttribute('type');
  } else {
    link.href = '/vite.svg';
    link.type = 'image/svg+xml';
  }
}

function App() {
  useEffect(() => {
    applyFaviconFromConfig();
    window.addEventListener(CONFIG_UPDATED_EVENT, applyFaviconFromConfig);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, applyFaviconFromConfig);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/config" element={<Configuration />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
