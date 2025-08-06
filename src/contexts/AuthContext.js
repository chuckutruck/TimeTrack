import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { getDatabase, ref, onValue } from "firebase/database"; // Import getDatabase, ref, onValue
import LoadingSpinner from '../components/LoadingSpinner';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Online');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    const db = getDatabase(); // Get database instance
    const connectedRef = ref(db, '.info/connected'); // Use ref for database path
    onValue(connectedRef, snap => { // Use onValue for listening to changes
      if (snap.val() === true) {
        setConnectionStatus('Online');
      } else {
        setConnectionStatus('Sin conexión');
      }
    });

    return () => {
      unsubscribeAuth();
      // No need to explicitly detach onValue listener for .info/connected,
      // as it's a global listener and typically managed by Firebase SDK itself.
      // If you had specific data listeners, you'd use off(connectedRef)
    };
  }, []);

  const value = {
    currentUser,
    loading,
    connectionStatus
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};