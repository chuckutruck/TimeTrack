import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiMail, FiSave } from 'react-icons/fi';
import { getUserProfile, updateProfile } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import useToast from '../hooks/useToast';
import { generateAvatar } from '../utils/helpers';
import { useTranslation } from '../contexts/TranslationContext';

const Profile = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid, (profile) => {
        if (profile) {
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setPhone(profile.phone || '');
          setAvatar(profile.avatar || generateAvatar(profile.firstName, profile.lastName));
        } else {
          // If no profile exists, generate default avatar
          setAvatar(generateAvatar('', ''));
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    setAvatar(generateAvatar(firstName, lastName));
  }, [firstName, lastName]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const profileData = {
      firstName,
      lastName,
      phone,
      avatar: generateAvatar(firstName, lastName) // Always regenerate on update
    };

    try {
      await updateProfile(currentUser.uid, profileData);
      showToast(t('profile.successUpdate'), 'success');
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(t('profile.errorUpdate'), 'error');
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
        {t('profile.title')}
      </h1>

      <form onSubmit={handleUpdateProfile} className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
            {avatar}
          </div>
          <p className="text-gray-600 text-sm">{t('profile.avatar')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="firstName" className="block text-gray-700 font-semibold mb-2">
              <FiUser className="inline-block mr-2 text-blue-500" />{t('profile.firstName')}
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-gray-700 font-semibold mb-2">
              <FiUser className="inline-block mr-2 text-blue-500" />{t('profile.lastName')}
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
            <FiPhone className="inline-block mr-2 text-blue-500" />{t('profile.phone')}
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-8">
          <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
            <FiMail className="inline-block mr-2 text-blue-500" />Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={currentUser?.email || ''}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
            disabled
          />
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center"
        >
          <FiSave className="w-6 h-6 mr-2" />
          {t('profile.updateProfile')}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default Profile;