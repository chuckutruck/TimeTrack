import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Toast from '../components/Toast';

const useToast = () => {
  const [toastQueue, setToastQueue] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToastQueue((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((toast) => toast.id !== id));
    }, duration + 500); // Give a little extra time for exit animation
  }, []);

  const ToastContainer = () => {
    return ReactDOM.createPortal(
      <div className="fixed bottom-0 right-0 p-4 space-y-3 z-50">
        {toastQueue.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} />
        ))}
      </div>,
      document.body
    );
  };

  return { showToast, ToastContainer };
};

export default useToast;