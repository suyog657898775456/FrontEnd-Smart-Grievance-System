import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const API = axios.create({
  baseURL: `${BASE_URL}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;