import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { getRecords, getProjects } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { parseISO, getWeek, getMonth, getYear, format, startOfWeek, endOfWeek, isValid } from 'date-fns';
import { es, enUS, sv } from 'date-fns/locale';
import { useTranslation } from '../contexts/TranslationContext'; // Corrected import statement
import { FiBarChart2 } from 'react-icons/fi'; // Import FiBarChart2

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const locales = { es, en: enUS, sv };

const Stats = () => {
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const currentLocale = useMemo(() => locales[language] || enUS, [language]);

  const [records, setRecords] = useState([]);
  const [projects, setProjects] = useState({});

  useEffect(() => {
    if (currentUser) {
      getRecords(currentUser.uid, (fetchedRecords) => {
        setRecords(fetchedRecords);
      });
      getProjects(currentUser.uid, (fetchedProjects) => {
        const projectMap = fetchedProjects.reduce((acc, proj) => {
          acc[proj.id] = proj;
          return acc;
        }, {});
        setProjects(projectMap);
      });
    }
  }, [currentUser]);

  const hoursByWeekData = useMemo(() => {
    const weeklyHours = {};
    records.forEach(record => {
      const recordDate = parseISO(record.date);
      if (!isValid(recordDate)) {
        console.warn("Skipping invalid date in hoursByWeekData:", record.date);
        return;
      }
      const weekNumber = getWeek(recordDate, { locale: currentLocale });
      const year = getYear(recordDate);
      const weekKey = `${year}-W${weekNumber}`;

      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0;
      }
      weeklyHours[weekKey] += record.hoursWorked || 0;
    });

    const sortedWeeks = Object.keys(weeklyHours).sort();
    const labels = sortedWeeks.map(key => {
      const [year, weekNum] = key.split('-W');
      const dateInWeek = startOfWeek(new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7), { locale: currentLocale });
      if (!isValid(dateInWeek)) return 'Invalid Week'; // Handle invalid date for label
      return `${format(dateInWeek, 'MMM dd', { locale: currentLocale})} (W${weekNum})`;
    });
    const data = sortedWeeks.map(key => weeklyHours[key]);

    return {
      labels,
      datasets: [
        {
          label: t('stats.hoursByWeek'),
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [records, currentLocale, t]);

  const hoursByProjectData = useMemo(() => {
    const projectHours = {};
    records.forEach(record => {
      const projectName = projects[record.projectId]?.name || 'Unknown Project';
      if (!projectHours[projectName]) {
        projectHours[projectName] = 0;
      }
      projectHours[projectName] += record.hoursWorked || 0;
    });

    const labels = Object.keys(projectHours);
    const data = Object.values(projectHours);
    const backgroundColors = labels.map((_, i) => `hsl(${i * 60}, 70%, 60%)`);

    return {
      labels,
      datasets: [
        {
          label: t('stats.hoursByProject'),
          data: data,
          backgroundColor: backgroundColors,
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    };
  }, [records, projects, t]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + ' ' + t('common.hours');
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('history.week'),
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('common.hours'),
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed.toFixed(2) + ' ' + t('common.hours');
            }
            return label;
          }
        }
      }
    },
  };

  const hasData = records.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-8 bg-white rounded-3xl shadow-xl min-h-[calc(100vh-64px)]"
    >
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
        {t('stats.title')}
      </h1>

      {!hasData ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <FiBarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">{t('stats.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('stats.hoursByWeek')}</h2>
            <div className="h-80">
              <Bar data={hoursByWeekData} options={barChartOptions} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('stats.hoursByProject')}</h2>
            <div className="h-80 flex items-center justify-center">
              <Doughnut data={hoursByProjectData} options={doughnutChartOptions} />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Stats;