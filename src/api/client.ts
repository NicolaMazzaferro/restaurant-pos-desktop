import axios from "axios";

export const api = axios.create({
  baseURL: "http://46.101.120.77:8081/api",
  headers: { "Content-Type": "application/json" },
});

// Intercettore per allegare il token JWT ad ogni richiesta
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
