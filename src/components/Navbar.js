import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiFolder, FiList, FiBarChart2, FiUser, FiLogOut, FiGlobe } from 'react-icons/fi';
import { signOut } from '../utils/auth';
import { useTranslation } from '../contexts/TranslationContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ onLanguageChange }) => {
  const location = useLocation();
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();

  const navItems = [
    { name: t('navbar.timeEntry'), icon: FiClock, path: '/time-entry' },
    { name: t('navbar.projects'), icon: FiFolder, path: '/projects' },
    { name: t('navbar.history'), icon: FiList, path: '/history' },
    { name: t('navbar.stats'), icon: FiBarChart2, path: '/stats' },
    { name: t('navbar.profile'), icon: FiUser, path: '/profile' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg p-4 rounded-r-3xl flex flex-col justify-between h-screen fixed left-0 top-0 z-50 w-64"
    >
      <div>
        <div className="text-center mb-10 mt-4">
          <h1 className="text-3xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
            Tidbok
          </h1>
          {currentUser && (
            <p className="text-sm text-gray-500 mt-1">
              {t('navbar.welcome')}, {currentUser.email.split('@')[0]}
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.03, backgroundColor: '#f0f4f8' }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 font-semibold shadow-md'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </motion.div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="pb-6">
        <div className="flex items-center justify-center mb-4">
          <FiGlobe className="w-5 h-5 text-gray-600 mr-2" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="sv">Svenska</option>
          </select>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.03, backgroundColor: '#fee2e2' }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center p-3 rounded-xl text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition-all duration-200 shadow-md"
        >
          <FiLogOut className="w-5 h-5 mr-3" />
          <span>{t('navbar.logout')}</span>
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;