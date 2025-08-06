import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiDownload, FiEdit, FiTrash2, FiCalendar, FiInfo } from 'react-icons/fi';
import { getRecords, getProjects, deleteRecord, updateRecord } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import useToast from '../hooks/useToast';
import Modal from '../components/Modal';
import { format, parseISO, getWeek, getMonth, getYear, startOfWeek, endOfWeek, isValid } from 'date-fns';
import { es, enUS, sv } from 'date-fns/locale';
import { exportToPdf, calculateHours } from '../utils/helpers';
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

  useEffect(() => {
    if (!currentUser) return;
    getRecords(currentUser.uid).then(setRecords);
    getProjects(currentUser.uid).then(setProjects);
  }, [currentUser]);

  const classifyHours = (dateString, startTime, endTime) => {
    const start = new Date(`${dateString}T${startTime}`);
    let end = new Date(`${dateString}T${endTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const result = {
      "Sueldo base": 0,
      "OB 1": 0,
      "OB 2": 0,
      "OB 3": 0,
      "OB 4": 0,
    };

    const minutesDiff = Math.floor((end - start) / (1000 * 60));

    for (let i = 0; i < minutesDiff; i++) {
      const current = new Date(start.getTime() + i * 60000);
      const hour = current.getHours();
      const day = current.getDay(); // 0=Sunday

      if (day === 0) {
        result["OB 4"] += 1;
      } else if (day === 6 && hour >= 13) {
        result["OB 3"] += 1;
      } else if (hour >= 22 || hour < 6) {
        result["OB 2"] += 1;
      } else if (hour >= 18) {
        result["OB 1"] += 1;
      } else {
        result["Sueldo base"] += 1;
      }
    }

    Object.keys(result).forEach(key => {
      result[key] = +(result[key] / 60).toFixed(2);
    });

    return result;
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = parseISO(record.date);
      const year = getYear(date);
      const month = getMonth(date);
      const week = getWeek(date, { weekStartsOn: 1 });

      return (filterYear === 'all' || year.toString() === filterYear) &&
             (filterMonth === 'all' || month.toString() === filterMonth) &&
             (filterWeek === 'all' || week.toString() === filterWeek);
    });
  }, [records, filterYear, filterMonth, filterWeek]);

  const totalHours = useMemo(() => {
    return filteredRecords.reduce((acc, rec) => acc + (rec.totalHours || 0), 0).toFixed(2);
  }, [filteredRecords]);

  const hourSummary = useMemo(() => {
    const summary = {
      "Sueldo base": 0,
      "OB 1": 0,
      "OB 2": 0,
      "OB 3": 0,
      "OB 4": 0,
    };

    filteredRecords.forEach((rec) => {
      if (rec.hourClassification) {
        Object.entries(rec.hourClassification).forEach(([key, value]) => {
          summary[key] += value;
        });
      }
    });

    Object.keys(summary).forEach(key => {
      summary[key] = summary[key].toFixed(2);
    });

    return summary;
  }, [filteredRecords]);

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setEditForm({
      ...record,
      hourlyRate: record.hourlyRate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    const updated = { ...editForm };

    const start = new Date(`${updated.date}T${updated.startTime}`);
    let end = new Date(`${updated.date}T${updated.endTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const totalMinutes = Math.floor((end - start) / 60000) - (Number(updated.breakTime) || 0);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

    const hourClassification = classifyHours(updated.date, updated.startTime, updated.endTime);

    updated.totalHours = totalHours;
    updated.hourClassification = hourClassification;
    updated.hourlyRate = parseFloat(updated.hourlyRate || 0);

    await updateRecord(currentUser.uid, currentRecord.id, updated);
    setIsEditModalOpen(false);
    showToast('Registro actualizado', 'success');
    getRecords(currentUser.uid).then(setRecords);
  };

  const handleDelete = async () => {
    await deleteRecord(currentUser.uid, currentRecord.id);
    showToast('Registro eliminado', 'success');
    setIsConfirmDeleteModalOpen(false);
    getRecords(currentUser.uid).then(setRecords);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">{t('history.title')}</h1>

      <div className="flex gap-4 mb-4">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border px-2 py-1">
          <option value="all">{t('history.allYears')}</option>
          {[...new Set(records.map(r => getYear(parseISO(r.date))))].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border px-2 py-1">
          <option value="all">{t('history.allMonths')}</option>
          {[...Array(12).keys()].map(m => (
            <option key={m} value={m}>{format(new Date(2020, m, 1), 'MMMM', { locale: locales[language] })}</option>
          ))}
        </select>
        <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="border px-2 py-1">
          <option value="all">{t('history.allWeeks')}</option>
          {[...new Set(records.map(r => getWeek(parseISO(r.date), { weekStartsOn: 1 })))].map(w => (
            <option key={w} value={w}>Semana {w}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <p><strong>Total horas:</strong> {totalHours}</p>
        <h2 className="font-semibold mt-2">Desglose:</h2>
        <ul className="list-disc pl-6">
          {Object.entries(hourSummary).map(([type, value]) => (
            <li key={type}>{type}: {value} horas</li>
          ))}
        </ul>
      </div>

      {/* Aquí puedes incluir tu tabla o vista de registros */}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h2>Editar Registro</h2>
        <input value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} type="date" />
        <input value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} type="time" />
        <input value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} type="time" />
        <input value={editForm.breakTime} onChange={(e) => setEditForm({ ...editForm, breakTime: e.target.value })} type="number" placeholder="Pausa (min)" />
        <input value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} type="number" placeholder="Tarifa por hora" />
        <button onClick={handleSave}>Guardar</button>
      </Modal>
    </div>
  );
};

export default History;
