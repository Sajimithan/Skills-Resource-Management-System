import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ThemeProvider } from './components/ThemeContext';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="personnel" element={<Personnel />} />
            <Route path="skills" element={<Skills />} />
            <Route path="projects" element={<Projects />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
