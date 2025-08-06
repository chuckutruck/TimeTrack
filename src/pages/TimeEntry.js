import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiClock, FiCalendar, FiTag, FiEdit3, FiUsers, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { calculateHours, classifyHours, getSuggestedTimes } from '../utils/helpers';
import { addRecord, getProjects } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import useToast from '../hooks/useToast';
import { useTranslation } from '../contexts/TranslationContext';

const TimeEntry = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectId, setProjectId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakTime, setBreakTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [colleagues, setColleagues] = useState('');
  const [taskDescription, setTaskDescription] = useState(''); // New field
  const [hourlyRate, setHourlyRate] = useState(''); // New field
  const [projects, setProjects] = useState([]);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [hourClassification, setHourClassification] = useState({});

  useEffect(() => {
    if (currentUser) {
      const fetchProjects = async () => {
        try {
          getProjects(currentUser.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
            if (fetchedProjects.length > 0 && !projectId) {
              setProjectId(fetchedProjects[0].id);
            }
          });
        } catch (error) {
          console.error(t('timeEntry.errorFetchProjects'), error);
          showToast(t('timeEntry.errorFetchProjects'), 'error');
        }
      };
      fetchProjects();
    }
  }, [currentUser, projectId, showToast, t]);

  useEffect(() => {
    const { suggestedStart, suggestedEnd } = getSuggestedTimes(date);
    setStartTime(suggestedStart);
    setEndTime(suggestedEnd);
  }, [date]);

  useEffect(() => {
    if (startTime && endTime) {
      const calculatedHours = calculateHours(startTime, endTime, breakTime);
      setHoursWorked(calculatedHours);
      const classification = classifyHours(date, startTime, endTime);
      setHourClassification(classification);
    } else {
      setHoursWorked(0);
      setHourClassification({});
    }
  }, [startTime, endTime, breakTime, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !projectId || !startTime || !endTime) {
      showToast(t('common.error'), 'error');
      return;
    }

    const newRecord = {
      date,
      projectId,
      startTime,
      endTime,
      breakTime: parseInt(breakTime),
      notes,
      colleagues,
      taskDescription, // New field
      hourlyRate: parseFloat(hourlyRate) || 0, // New field
      hoursWorked,
      hourClassification,
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    };

    try {
      await addRecord(currentUser.uid, newRecord);
      showToast(t('timeEntry.successAdd'), 'success');
      // Reset form
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setBreakTime(0);
      setNotes('');
      setColleagues('');
      setTaskDescription('');
      setHourlyRate('');
    } catch (error) {
      console.error("Error adding record:", error);
      showToast(t('timeEntry.errorAdd'), 'error');
    }
  };

  const breakTimeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h <= 2; h++) { // Up to 2 hours
      for (let m = 0; m < 60; m += 15) { // Every 15 minutes
        const totalMinutes = h * 60 + m;
        if (totalMinutes === 0) {
          options.push({ value: 0, label: '0 min' });
        } else {
          options.push({ value: totalMinutes, label: `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'min' : ''}`.trim() });
        }
      }
    }
    return options;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-8 bg-white rounded-3xl shadow-xl min-h-[calc(100vh-64px)]"
    >
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
        {t('timeEntry.title')}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-gray-700 font-semibold mb-2">
              <FiCalendar className="inline-block mr-2 text-blue-500" />{t('timeEntry.date')}
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="project" className="block text-gray-700 font-semibold mb-2">
              <FiTag className="inline-block mr-2 text-blue-500" />{t('timeEntry.project')}
            </label>
            {projects.length > 0 ? (
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">{t('timeEntry.selectProject')}</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.code})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-red-500">{t('timeEntry.noProjects')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-gray-700 font-semibold mb-2">
                <FiClock className="inline-block mr-2 text-blue-500" />{t('timeEntry.startTime')}
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-gray-700 font-semibold mb-2">
                <FiClock className="inline-block mr-2 text-blue-500" />{t('timeEntry.endTime')}
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="breakTime" className="block text-gray-700 font-semibold mb-2">
              <FiClock className="inline-block mr-2 text-blue-500" />Rasttid (Time)
            </label>
            <select
              id="breakTime"
              value={breakTime}
              onChange={(e) => setBreakTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {breakTimeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="taskDescription" className="block text-gray-700 font-semibold mb-2">
              <FiBriefcase className="inline-block mr-2 text-blue-500" />Descripción de la Tarea
            </label>
            <textarea
              id="taskDescription"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-gray-700 font-semibold mb-2">
              <FiDollarSign className="inline-block mr-2 text-blue-500" />Tarifa por Hora
            </label>
            <input
              type="number"
              id="hourlyRate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-gray-700 font-semibold mb-2">
              <FiEdit3 className="inline-block mr-2 text-blue-500" />{t('timeEntry.notes')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
          </div>

          <div>
            <label htmlFor="colleagues" className="block text-gray-700 font-semibold mb-2">
              <FiUsers className="inline-block mr-2 text-blue-500" />{t('timeEntry.colleagues')}
            </label>
            <input
              type="text"
              id="colleagues"
              value={colleagues}
              onChange={(e) => setColleagues(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{t('timeEntry.hoursWorked')}: {hoursWorked.toFixed(2)}</h3>
            <h4 className="text-md font-semibold text-gray-700 mb-2">{t('timeEntry.classification')}:</h4>
            <ul className="list-disc list-inside text-gray-600">
              {Object.entries(hourClassification).map(([type, hours]) => (
                <li key={type}>{type}: {hours.toFixed(2)} {t('common.hours')}</li>
              ))}
            </ul>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center"
          >
            <FiPlus className="w-6 h-6 mr-2" />
            {t('timeEntry.addEntry')}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default TimeEntry;