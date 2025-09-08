import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import Home from './components/ui/Home';
import Templates from './components/templates/Templates';
import ExcelUpload from './components/excel/ExcelUpload';
import Mapping from './components/mapping/Mapping';
import Preview from './components/preview/Preview';
import useAppStore from './stores/useAppStore';

function App() {
  const { loadTemplatesFromApi } = useAppStore();

  useEffect(() => {
    console.log('🚀 App initialized, attempting to load templates...');
    loadTemplatesFromApi().catch(console.error);
  }, [loadTemplatesFromApi]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/upload" element={<ExcelUpload />} />
          <Route path="/mapping" element={<Mapping />} />
          <Route path="/preview" element={<Preview />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
