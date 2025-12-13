import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401 || 
        (error.response?.status === 400 && error.response?.data?.error?.includes('token'))) {
      console.log('Token expired or invalid, redirecting to login...');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Rediriger vers la page de connexion admin
      if (window.location.pathname.includes('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};

// Admin API
export const adminAPI = {
  // Puzzle management
  createPuzzle: (puzzleData) => api.post('/admin/puzzle', puzzleData),
  getPuzzle: (id) => api.get(`/admin/puzzle/${id}`),
  getPuzzlesByDate: (date) => api.get('/admin/puzzle', { params: { date } }),
  getAllPuzzles: () => api.get('/admin/puzzles'),
  updatePuzzle: (id, puzzleData) => api.put(`/admin/puzzle/${id}`, puzzleData),
  deletePuzzle: (id) => api.delete(`/admin/puzzle/${id}`),
  
  // Statistics
  getStats: () => api.get('/admin/stats'),
};

// Player API
export const playerAPI = {
  getTodaysPuzzles: () => api.get('/player/today'),
  getPuzzlesByDate: (date) => api.get(`/player/date/${date}`),
  getAllPuzzleDates: () => api.get('/player/dates'),
  submitSolution: (id, solutionData) => api.post(`/player/submit/${id}`, solutionData),
};

export default api;
