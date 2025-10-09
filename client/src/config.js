// Single place to point the client at your server.
// Example values:
//   same-origin dev proxy: API_BASE_URL = "";          (use Vite proxy)
//   Flask/FastAPI on 5000: API_BASE_URL = "http://localhost:5000";
//   Express on 3001:       API_BASE_URL = "http://localhost:3001";

export const API_BASE_URL = ""; // set to "" if you use Vite proxy; otherwise http://host:port

export const ENDPOINTS = {
  login:   "/api/auth/login",
  register:"/api/auth/register",
};
