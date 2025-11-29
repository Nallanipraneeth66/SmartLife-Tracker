import axios from "axios";

/**
 * @typedef {{ name: string; email: string; password: string }} SignupData
 */

const BASE = "http://localhost:5000/users";

/**
 * @param {SignupData} data
 * @returns {import("axios").AxiosPromise}
 */
export const signupUser = (data) => axios.post(BASE, data);

/**
 * @param {string} email
 * @returns {import("axios").AxiosPromise}
 */
export const getUserByEmail = (email) => axios.get(`${BASE}?email=${email}`);


