import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/ui/Layout';
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

function App() {
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
