import { database } from '../firebaseConfig';
import { ref, onValue, set, update, remove, push } from "firebase/database";
import { v4 as uuidv4 } from 'uuid';

const getRef = (userId, path) => ref(database, `users/${userId}/${path}`);

export const getUserProfile = (userId, callback) => {
  onValue(getRef(userId, 'profile'), snapshot => {
    callback(snapshot.val());
  });
};

export const updateProfile = (userId, profileData) => {
  return update(getRef(userId, 'profile'), profileData);
};

export const getProjects = (userId, callback) => {
  onValue(getRef(userId, 'projects'), snapshot => {
    const projects = [];
    snapshot.forEach(childSnapshot => {
      projects.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(projects);
  });
};

export const addProject = (userId, project) => {
  const newProjectRef = push(getRef(userId, 'projects'));
  return set(newProjectRef, { ...project, id: newProjectRef.key });
};

export const updateProject = (userId, projectId, project) => {
  return update(getRef(userId, `projects/${projectId}`), project);
};

export const deleteProject = (userId, projectId) => {
  return remove(getRef(userId, `projects/${projectId}`));
};

export const getRecords = (userId, callback) => {
  onValue(getRef(userId, 'records'), snapshot => {
    const records = [];
    snapshot.forEach(childSnapshot => {
      records.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(records);
  });
};

export const addRecord = (userId, record) => {
  const newRecordRef = push(getRef(userId, 'records'));
  return set(newRecordRef, { ...record, id: newRecordRef.key });
};

export const updateRecord = (userId, recordId, record) => {
  return update(getRef(userId, `records/${recordId}`), record);
};

export const deleteRecord = (userId, recordId) => {
  return remove(getRef(userId, `records/${recordId}`));
};