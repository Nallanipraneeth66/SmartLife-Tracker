import axios from "axios";
const BASE = "http://localhost:5000";

export const getTasks = (userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/tasks`, { params: { userId } });
};

export const getTask = (id, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/tasks/${id}`, { params: { userId } });
};

export const addTask = (task, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.post(`${BASE}/tasks`, { ...task, userId });
};

export const updateTask = (id, task, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.put(`${BASE}/tasks/${id}`, { ...task, userId });
};

export const deleteTask = (id, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.delete(`${BASE}/tasks/${id}`, { params: { userId } });
};

export const getTasksByDate = (date, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/tasks`, { params: { "timeSpent.date": date, userId } });
};

export const getHabits = (userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/tasks`, { params: { isHabit: true, userId } });
};


