import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiFolder } from 'react-icons/fi';
import Modal from '../components/Modal';
import { getProjects, addProject, updateProject, deleteProject } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import useToast from '../hooks/useToast';
import { useTranslation } from '../contexts/TranslationContext';

const Projects = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // For editing
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    if (currentUser) {
      getProjects(currentUser.uid, (fetchedProjects) => {
        setProjects(fetchedProjects);
      });
    }
  }, [currentUser]);

  const handleAddEditProject = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const projectData = { name: projectName, code: projectCode };

    try {
      if (currentProject) {
        await updateProject(currentUser.uid, currentProject.id, projectData);
        showToast(t('projects.successUpdate'), 'success');
      } else {
        await addProject(currentUser.uid, projectData);
        showToast(t('projects.successAdd'), 'success');
      }
      setIsModalOpen(false);
      setCurrentProject(null);
      setProjectName('');
      setProjectCode('');
    } catch (error) {
      console.error("Error saving project:", error);
      showToast(currentProject ? t('projects.errorUpdate') : t('projects.errorAdd'), 'error');
    }
  };

  const openAddModal = () => {
    setCurrentProject(null);
    setProjectName('');
    setProjectCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectCode(project.code);
    setIsModalOpen(true);
  };

  const openConfirmDeleteModal = (project) => {
    setProjectToDelete(project);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!currentUser || !projectToDelete) return;
    try {
      await deleteProject(currentUser.uid, projectToDelete.id);
      showToast(t('projects.successDelete'), 'success');
      setIsConfirmModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      showToast(t('projects.errorDelete'), 'error');
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
        {t('projects.title')}
      </h1>

      <motion.button
        onClick={openAddModal}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center mb-8"
      >
        <FiPlus className="w-5 h-5 mr-2" />
        {t('projects.addProject')}
      </motion.button>

      {projects.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
          <FiFolder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">{t('projects.noProjects')}</p>
          <p className="text-gray-500">{t('projects.createFirst')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm mb-4">Código: <span className="font-semibold">{project.code}</span></p>
              </div>
              <div className="flex space-x-3 mt-4">
                <motion.button
                  onClick={() => openEditModal(project)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition duration-200 flex items-center justify-center"
                >
                  <FiEdit className="w-4 h-4 mr-2" />{t('common.edit')}
                </motion.button>
                <motion.button
                  onClick={() => openConfirmDeleteModal(project)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition duration-200 flex items-center justify-center"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />{t('common.delete')}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentProject ? t('projects.editProject') : t('projects.addProject')}
      >
        <form onSubmit={handleAddEditProject} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-gray-700 font-semibold mb-2">
              {t('projects.projectName')}
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label htmlFor="projectCode" className="block text-gray-700 font-semibold mb-2">
              {t('projects.projectCode')}
            </label>
            <input
              type="text"
              id="projectCode"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
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
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={t('projects.deleteProject')}
      >
        <p className="text-gray-700 mb-6">
          {t('projects.confirmDelete')}
        </p>
        <div className="flex justify-end space-x-4">
          <motion.button
            onClick={() => setIsConfirmModalOpen(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl font-semibold hover:bg-gray-300 transition duration-200"
          >
            {t('common.cancel')}
          </motion.button>
          <motion.button
            onClick={handleDeleteProject}
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

export default Projects;