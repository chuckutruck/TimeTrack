import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiFolder, FiList, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser, connectionStatus } = useAuth();

  const quickActions = [
    { name: t('dashboard.addTimeEntry'), icon: FiClock, path: '/time-entry' },
    { name: t('dashboard.manageProjects'), icon: FiFolder, path: '/projects' },
    { name: t('dashboard.viewHistory'), icon: FiList, path: '/history' },
    { name: t('dashboard.viewStats'), icon: FiBarChart2, path: '/stats' },
  ];

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'Online':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Sincronizando...':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Sin conexión':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-8 bg-white rounded-3xl shadow-xl min-h-[calc(100vh-64px)]"
    >
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
        {t('dashboard.title')}
      </h1>

      <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
        <div>
          <p className="text-lg text-gray-700 font-medium mb-2">
            {t('dashboard.welcomeMessage')}
          </p>
          <p className="text-gray-600">
            {t('dashboard.getStarted')}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold text-sm border ${getConnectionStatusColor(connectionStatus)}`}>
          {t('dashboard.connectionStatus')}: {connectionStatus}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-5">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Link to={action.path} key={index}>
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col items-center text-center cursor-pointer"
            >
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <action.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{action.name}</h3>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;