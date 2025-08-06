import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TranslationProvider, useTranslation } from './contexts/TranslationContext';
import useToast from './hooks/useToast';

import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TimeEntry from './pages/TimeEntry';
import Projects from './pages/Projects';
import History from './pages/History';
import Stats from './pages/Stats';
import Profile from './pages/Profile';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { setLanguage } = useTranslation();

  if (loading) {
    return null; // LoadingSpinner is handled by AuthProvider
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    showToast(`Idioma cambiado a ${lang.toUpperCase()}`, 'info');
  };

  return (
    <>
      {currentUser && <Navbar onLanguageChange={handleLanguageChange} />}
      <main className={currentUser ? "ml-64 p-8" : ""}>
        <Routes>
          <Route path="/auth" element={currentUser ? <Navigate to="/" /> : <Auth />} />
          <Route
            path="/"
            element={currentUser ? <Dashboard /> : <Navigate to="/auth" />}
          />
          <Route
            path="/time-entry"
            element={currentUser ? <TimeEntry /> : <Navigate to="/auth" />}
          />
          <Route
            path="/projects"
            element={currentUser ? <Projects /> : <Navigate to="/auth" />}
          />
          <Route
            path="/history"
            element={currentUser ? <History /> : <Navigate to="/auth" />}
          />
          <Route
            path="/stats"
            element={currentUser ? <Stats /> : <Navigate to="/auth" />}
          />
          <Route
            path="/profile"
            element={currentUser ? <Profile /> : <Navigate to="/auth" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <ToastContainer />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;