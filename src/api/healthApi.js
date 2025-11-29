import axios from "axios";

const BASE = "http://localhost:5000";

export const getHealth = (userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/health`, { params: { userId } });
};

export const addHealthData = (record, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.post(`${BASE}/health`, { ...record, userId });
};

export const deleteHealthData = (id, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.delete(`${BASE}/health/${id}`, { params: { userId } });
};

export const updateHealthData = (id, payload, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.put(`${BASE}/health/${id}`, { ...payload, userId });
};

// healthGoals is global (not user-specific based on db.json structure)
export const getHealthGoals = () => axios.get(`${BASE}/healthGoals`);
export const updateHealthGoals = (goals) => {
  if (goals.id) return axios.put(`${BASE}/healthGoals/${goals.id}`, goals);
  return axios.put(`${BASE}/healthGoals`, goals);
};