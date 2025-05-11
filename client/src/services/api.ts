import axios from "axios";

// Create an axios instance
const api = axios.create({
  baseURL: "http://localhost:3000", // Update with your API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
