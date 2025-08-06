import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';

const Toast = ({ message, type, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  let icon;
  let bgColor;
  let textColor;

  switch (type) {
    case 'success':
      icon = <FiCheckCircle className="w-6 h-6" />;
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      break;
    case 'error':
      icon = <FiXCircle className="w-6 h-6" />;
      bgColor = 'bg-red-500';
      textColor = 'text-white';
      break;
    case 'info':
    default:
      icon = <FiInfo className="w-6 h-6" />;
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      break;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${bgColor} ${textColor} z-50`}
        >
          {icon}
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;