import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Home from './components/ui/Home';
import Configuration from './components/config/Configuration';
import Sensors from './components/sensors/Sensors';
import Tasks from './components/tasks/Tasks';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/config" element={<Configuration />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
