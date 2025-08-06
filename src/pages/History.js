import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiDownload, FiEdit, FiTrash2, FiCalendar, FiInfo } from 'react-icons/fi';
import { getRecords, getProjects, deleteRecord, updateRecord } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import useToast from '../hooks/useToast';
import Modal from '../components/Modal';
import { format, parseISO, getWeek, getMonth, getYear, startOfWeek, endOfWeek, isValid } from 'date-fns';
import { es, enUS, sv } from 'date-fns/locale';
import { exportToPdf, calculateHours, classifyHours } from '../utils/helpers';
import { useTranslation } from '../contexts/TranslationContext';

const locales = { es, en: enUS, sv };

const History = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useTranslation();

  const [records, setRecords] = useState([]);
  const [projects, setProjects] = useState({});
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '', projectId: '', startTime: '', endTime: '', breakTime: 0, notes: '', colleagues: '', taskDescription: '', hourlyRate: ''
  });
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const currentLocale = useMemo(() => locales[language] || enUS, [language]);

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

  const availableYears = useMemo(() => {
    const years = new Set(records.map(rec => getYear(parseISO(rec.date))));
    return ['all', ...Array.from(years).sort((a, b) => b - a)];
  }, [records]);

  const availableMonths = useMemo(() => {
    if (filterYear === 'all') return ['all'];
    const months = new Set(records
      .filter(rec => getYear(parseISO(rec.date)) === parseInt(filterYear))
      .map(rec => getMonth(parseISO(rec.date))));
    return ['all', ...Array.from(months).sort((a, b) => a - b)];
  }, [records, filterYear]);

  const availableWeeks = useMemo(() => {
    if (filterYear === 'all' || filterMonth === 'all') return ['all'];
    const weeks = new Set(records
      .filter(rec => getYear(parseISO(rec.date)) === parseInt(filterYear) && getMonth(parseISO(rec.date)) === parseInt(filterMonth))
      .map(rec => getWeek(parseISO(rec.date), { locale: currentLocale })));
    return ['all', ...Array.from(weeks).sort((a, b) => a - b)];
  }, [records, filterYear, filterMonth, currentLocale]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = parseISO(record.date);
      if (!isValid(recordDate)) return false; // Filter out invalid dates
      const yearMatch = filterYear === 'all' || getYear(recordDate) === parseInt(filterYear);
      const monthMatch = filterMonth === 'all' || getMonth(recordDate) === parseInt(filterMonth);
      const weekMatch = filterWeek === 'all' || getWeek(recordDate, { locale: currentLocale }) === parseInt(filterWeek);
      return yearMatch && monthMatch && weekMatch;
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [records, filterYear, filterMonth, filterWeek, currentLocale]);

  const groupedRecords = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(record => {
      const recordDate = parseISO(record.date);
      if (!isValid(recordDate)) {
        console.warn("Skipping invalid date in groupedRecords:", record.date);
        return;
      }
      const weekStart = format(startOfWeek(recordDate, { locale: currentLocale }), 'yyyy-MM-dd');
      if (!groups[weekStart]) {
        groups[weekStart] = [];
      }
      groups[weekStart].push(record);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => parseISO(dateB).getTime() - parseISO(dateA).getTime());
  }, [filteredRecords, currentLocale]);

  const totalHours = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
  }, [filteredRecords]);

  const getDayName = (dateString) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, 'EEEE', { locale: currentLocale });
  };

  const openEditModal = (record) => {
    setCurrentRecord(record);
    setEditForm({
      date: record.date,
      projectId: record.projectId,
      startTime: record.startTime,
      endTime: record.endTime,
      breakTime: record.breakTime,
      notes: record.notes,
      colleagues: record.colleagues,
      taskDescription: record.taskDescription || '', // New field
      hourlyRate: record.hourlyRate || '', // New field
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentRecord) return;

    const updatedHoursWorked = calculateHours(editForm.startTime, editForm.endTime, editForm.breakTime);
    const updatedClassification = classifyHours(editForm.date, editForm.startTime, editForm.endTime);

    const updatedRecord = {
      ...editForm,
      hoursWorked: updatedHoursWorked,
      hourClassification: updatedClassification,
      hourlyRate: parseFloat(editForm.hourlyRate) || 0,
    };

    try {
      await updateRecord(currentUser.uid, currentRecord.id, updatedRecord);
      showToast(t('common.successUpdate'), 'success');
      setIsEditModalOpen(false);
      setCurrentRecord(null);
    } catch (error) {
      console.error("Error updating record:", error);
      showToast(t('common.errorUpdate'), 'error');
    }
  };

  const openConfirmDeleteModal = (record) => {
    setRecordToDelete(record);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteRecord = async () => {
    if (!currentUser || !recordToDelete) return;
    try {
      await deleteRecord(currentUser.uid, recordToDelete.id);
      showToast(t('history.successDelete'), 'success');
      setIsConfirmDeleteModalOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast(t('history.errorDelete'), 'error');
    }
  };

  const handleExportPdf = () => {
    const content = document.getElementById('history-content-to-export');
    if (content) {
      exportToPdf('history-content-to-export', `Tidbok_History_${filterYear}_${filterMonth}_${filterWeek}`, language);
      showToast(t('common.successExport'), 'info');
    } else {
      showToast(t('common.errorExport'), 'error');
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
        {t('history.title')}
      </h1>

      <div className="flex flex-wrap gap-4 mb-8 items-end">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filterYear" className="block text-gray-700 font-semibold mb-2">
            <FiFilter className="inline-block mr-2 text-blue-500" />{t('history.year')}
          </label>
          <select
            id="filterYear"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterMonth('all'); setFilterWeek('all'); }}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year === 'all' ? t('history.all') : year}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filterMonth" className="block text-gray-700 font-semibold mb-2">
            <FiFilter className="inline-block mr-2 text-blue-500" />{t('history.month')}
          </label>
          <select
            id="filterMonth"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setFilterWeek('all'); }}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {month === 'all' ? t('history.all') : format(new Date(2000, month, 1), 'MMMM', { locale: currentLocale })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filterWeek" className="block text-gray-700 font-semibold mb-2">
            <FiFilter className="inline-block mr-2 text-blue-500" />{t('history.week')}
          </label>
          <select
            id="filterWeek"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {availableWeeks.map(week => (
              <option key={week} value={week}>{week === 'all' ? t('history.all') : `Semana ${week}`}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 ml-auto">
          <motion.button
            onClick={handleExportPdf}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-red-500 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:bg-red-600 transition duration-200 flex items-center"
          >
            <FiDownload className="w-5 h-5 mr-2" />PDF
          </motion.button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{t('history.totalHours')}: {totalHours.toFixed(2)}</h3>
        {filterMonth !== 'all' && filterYear !== 'all' && (
          <p className="text-gray-700">{t('history.monthlySummary')}: {totalHours.toFixed(2)}</p>
        )}
        {filterWeek !== 'all' && filterMonth !== 'all' && filterYear !== 'all' && (
          <p className="text-gray-700">{t('history.weeklySummary')}: {totalHours.toFixed(2)}</p>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">{t('history.noRecords')}</p>
        </div>
      ) : (
        <div id="history-content-to-export">
          {Object.entries(groupedRecords).map(([weekStart, weekRecords]) => {
            const parsedWeekStart = parseISO(weekStart);
            if (!isValid(parsedWeekStart)) {
              console.warn("Skipping rendering for invalid weekStart:", weekStart);
              return null; // Skip rendering this group if weekStart is invalid
            }
            return (
              <div key={weekStart} className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  {t('history.weeklySummary')}: {format(parsedWeekStart, 'dd MMMM yyyy', { locale: currentLocale })} - {format(endOfWeek(parsedWeekStart, { locale: currentLocale }), 'dd MMMM yyyy', { locale: currentLocale })}
                  <span className="ml-4 text-blue-600">
                    ({weekRecords.reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0).toFixed(2)} {t('common.hours')})
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow-md">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tl-xl">
                          {t('history.date')}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {t('history.project')}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Tarifa/Hora
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {t('history.hours')}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Rasttid (min)
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {t('history.notes')}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Compañeros
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Clasificación
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider rounded-tr-xl">
                          {t('history.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekRecords.map((record, index) => {
                        const recordDate = parseISO(record.date);
                        if (!isValid(recordDate)) {
                          console.warn("Skipping rendering for invalid record date:", record.date);
                          return null; // Skip rendering this record if its date is invalid
                        }
                        return (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-800">
                              {format(recordDate, 'yy-MM-dd', { locale: currentLocale })} ({getDayName(record.date)})
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {projects[record.projectId]?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.taskDescription || '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.hourlyRate ? `$${record.hourlyRate.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.hoursWorked?.toFixed(2) || '0.00'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.breakTime || '0'} min
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.notes || '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              {record.colleagues || '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-800 text-sm">
                              {record.hourClassification && Object.entries(record.hourClassification).map(([type, hours]) => (
                                <div key={type}>{type}: {hours.toFixed(2)} {t('common.hours')}</div>
                              ))}
                            </td>
                            <td className="py-3 px-4 flex space-x-2">
                              <motion.button
                                onClick={() => openEditModal(record)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FiEdit className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => openConfirmDeleteModal(record)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </motion.button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('common.edit')}
      >
        <form onSubmit={handleUpdateRecord} className="space-y-4">
          <div>
            <label htmlFor="editDate" className="block text-gray-700 font-semibold mb-2">{t('history.date')}</label>
            <input type="date" id="editDate" name="date" value={editForm.date} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div>
            <label htmlFor="editProject" className="block text-gray-700 font-semibold mb-2">{t('history.project')}</label>
            <select id="editProject" name="projectId" value={editForm.projectId} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" required>
              {Object.values(projects).map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name} ({proj.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editTaskDescription" className="block text-gray-700 font-semibold mb-2">Descripción de la Tarea</label>
            <textarea id="editTaskDescription" name="taskDescription" value={editForm.taskDescription} onChange={handleEditFormChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
          </div>
          <div>
            <label htmlFor="editHourlyRate" className="block text-gray-700 font-semibold mb-2">Tarifa por Hora</label>
            <input type="number" id="editHourlyRate" name="hourlyRate" value={editForm.hourlyRate} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" min="0" step="0.01" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="editStartTime" className="block text-gray-700 font-semibold mb-2">{t('timeEntry.startTime')}</label>
              <input type="time" id="editStartTime" name="startTime" value={editForm.startTime} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label htmlFor="editEndTime" className="block text-gray-700 font-semibold mb-2">{t('timeEntry.endTime')}</label>
              <input type="time" id="editEndTime" name="endTime" value={editForm.endTime} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
          </div>
          <div>
            <label htmlFor="editBreakTime" className="block text-gray-700 font-semibold mb-2">Rasttid (Time)</label>
            <select
              id="editBreakTime"
              name="breakTime"
              value={editForm.breakTime}
              onChange={handleEditFormChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {breakTimeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editNotes" className="block text-gray-700 font-semibold mb-2">{t('timeEntry.notes')}</label>
            <textarea id="editNotes" name="notes" value={editForm.notes} onChange={handleEditFormChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
          </div>
          <div>
            <label htmlFor="editColleagues" className="block text-gray-700 font-semibold mb-2">Compañeros</label>
            <input type="text" id="editColleagues" name="colleagues" value={editForm.colleagues} onChange={handleEditFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition duration-300"
          >
            {t('common.save')}
          </motion.button>
        </form>
      </Modal>

      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        title={t('history.delete')}
      >
        <p className="text-gray-700 mb-6">
          {t('history.confirmDelete')}
        </p>
        <div className="flex justify-end space-x-4">
          <motion.button
            onClick={() => setIsConfirmDeleteModalOpen(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl font-semibold hover:bg-gray-300 transition duration-200"
          >
            {t('common.cancel')}
          </motion.button>
          <motion.button
            onClick={handleDeleteRecord}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-red-600 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:bg-red-700 transition duration-200"
          >
            {t('common.confirm')}
          </motion.button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default History;