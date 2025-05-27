import axios from "axios";

// Create a base instance of axios with default configuration
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://recapify.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to include JWT in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Handle unauthorized errors (401)
    if (response && response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Log errors in production
    if (process.env.NODE_ENV === "production") {
      console.error("API Error:", {
        status: response?.status,
        url: response?.config?.url,
        method: response?.config?.method,
        error: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
