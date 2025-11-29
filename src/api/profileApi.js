import axios from "axios";

const BASE = "http://localhost:5000";

export const getProfile = (userId) => {
  if (!userId) throw new Error("userId is required");
  // Get profile from profiles array filtered by userId
  return axios.get(`${BASE}/profiles`, { params: { userId } });
};

export const updateProfile = (profile, userId) => {
  if (!userId) throw new Error("userId is required");
  // Check if profile exists
  return axios.get(`${BASE}/profiles`, { params: { userId } })
    .then(res => {
      const profiles = Array.isArray(res.data) ? res.data : [];
      const existing = profiles.find(p => p.userId === userId);
      if (existing) {
        // Update existing profile - preserve limits if not provided
        const updateData = { ...existing, ...profile, userId };
        // Preserve limits if they exist and weren't provided in profile
        if (existing.weeklyLimit !== undefined && profile.weeklyLimit === undefined) {
          updateData.weeklyLimit = existing.weeklyLimit;
        }
        if (existing.monthlyLimit !== undefined && profile.monthlyLimit === undefined) {
          updateData.monthlyLimit = existing.monthlyLimit;
        }
        return axios.put(`${BASE}/profiles/${existing.id}`, updateData);
      } else {
        // Create new profile
        return axios.post(`${BASE}/profiles`, { ...profile, userId });
      }
    });
};

export const createProfile = (profile, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.post(`${BASE}/profiles`, { ...profile, userId });
};
