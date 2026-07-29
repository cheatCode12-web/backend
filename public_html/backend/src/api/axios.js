const axios = require('axios');

const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? undefined // Use relative URLs in production (same domain)
    : 'http://localhost:5000/api',
});

// Optionally attach token to every request automatically
API.interceptors.request.use((req) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

module.exports = API;
