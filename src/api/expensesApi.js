import axios from "axios";

const BASE = "http://localhost:5000";

export const getExpenses = (userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/expenses`, { params: { userId } });
};

export const getExpensesByDate = (date, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/expenses`, { params: { date, userId } });
};

export const addExpense = (expense, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.post(`${BASE}/expenses`, { ...expense, userId });
};

export const updateExpense = (id, expense, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.put(`${BASE}/expenses/${id}`, { ...expense, userId });
};

export const deleteExpense = (id, userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.delete(`${BASE}/expenses/${id}`, { params: { userId } });
};

// expensesMeta is global (not user-specific based on db.json structure)
export const getExpensesMeta = () => axios.get(`${BASE}/expensesMeta`);
export const updateExpensesMeta = (meta) =>
  axios.put(`${BASE}/expensesMeta`, meta);

// User-specific expense limits
export const getUserLimits = (userId) => {
  if (!userId) throw new Error("userId is required");
  return axios.get(`${BASE}/expenseLimits`, { params: { userId } }).catch((err) => {
    // If collection doesn't exist (404), return empty array
    if (err.response?.status === 404) {
      return { data: [] };
    }
    throw err;
  });
};

export const updateUserLimits = async (userId, limits) => {
  if (!userId) throw new Error("userId is required");
  
  // Clean up the limits object - remove undefined values and keep null as is
  const cleanLimits = {};
  if (limits.weeklyLimit !== undefined) {
    cleanLimits.weeklyLimit = limits.weeklyLimit;
  }
  if (limits.monthlyLimit !== undefined) {
    cleanLimits.monthlyLimit = limits.monthlyLimit;
  }
  
  try {
    // First try to get existing limits for this user
    let res;
    try {
      res = await axios.get(`${BASE}/expenseLimits`, { params: { userId } });
    } catch (getErr) {
      // If collection doesn't exist (404), create new entry
      if (getErr.response?.status === 404) {
        const newEntry = { ...cleanLimits, userId };
        return await axios.post(`${BASE}/expenseLimits`, newEntry);
      }
      throw getErr;
    }
    
    const existing = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
    const userLimit = existing.find((l) => l.userId === userId);
    
    if (userLimit && userLimit.id) {
      // Update existing - use PATCH to only update specified fields
      const updateData = { ...cleanLimits, userId };
      return await axios.patch(`${BASE}/expenseLimits/${userLimit.id}`, updateData);
    } else {
      // Create new
      const newEntry = { ...cleanLimits, userId };
      return await axios.post(`${BASE}/expenseLimits`, newEntry);
    }
  } catch (err) {
    console.error("Failed to update expense limits:", err);
    console.error("Error response:", err.response?.data);
    console.error("Error status:", err.response?.status);
    console.error("Request URL:", err.config?.url);
    throw err;
  }
};


