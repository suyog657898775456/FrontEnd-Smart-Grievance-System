import axios from "axios";

// Backend URL from Vite environment variable
const BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const API = axios.create({
  baseURL: `${BASE_URL}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // optional, useful for Render free tier
});

// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Optional: handle global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Backend not reachable or network error");
    }

    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default API;
