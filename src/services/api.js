//import axios from "axios";

//const API = axios.create({
//baseURL: "http://127.0.0.1:8000/api/",
//});

// Attach token automatically
//API.interceptors.request.use((config) => {
//const token = localStorage.getItem("access");
//console.log("----------------------------------------")
//console.log(token)

//if (token) {
// config.headers.Authorization = `Bearer ${token}`;
// }

//return config;
//});

//export default API;

import axios from "axios";

// Use environment variable for backend URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Create axios instance
const API = axios.create({
  baseURL: `${BASE_URL}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds (Render free tier can be slow)
});
 
// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("access");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Token access error:", error);
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Handle response errors globally
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network error (backend down, CORS, etc.)
    if (!error.response) {
      console.error("Network error or backend not reachable");
      alert("Cannot connect to server. Please try again.");
      return Promise.reject(error);
    }

    // Unauthorized → token expired
    if (error.response.status === 401) {
      console.warn("Unauthorized. Token may be expired.");

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      // redirect to login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Server error
    if (error.response.status >= 500) {
      console.error("Server error:", error.response.data);
      alert("Server error. Please try again later.");
    }

    return Promise.reject(error);
  },
);

export default API;
