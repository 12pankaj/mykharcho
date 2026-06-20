import axios from 'axios';

// Base URL can be configured via environment variables in web/mobile projects
const API_BASE_URL = 'http://localhost:5010/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use((config) => {
    // Note: In React Native, you'd use AsyncStorage. In Web, localStorage.
    // We'll handle the token retrieval logic in the specific platform's implementation
    // but the shared service defines the structure.
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AuthService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    signup: (userData) => api.post('/auth/signup', userData),
    googleLogin: (token) => api.post('/auth/google', { token }),
};

export const TransactionService = {
    getAll: () => api.get('/transactions'),
    add: (data) => api.post('/transactions', data),
    delete: (id) => api.delete(`/transactions/${id}`),
};

export const LoanService = {
    getContracts: () => api.get('/loans'),
    getInstallments: (contractId) => api.get(`/loans/${contractId}/installments`),
    payInstallment: (id, amount) => api.put(`/installments/${id}`, { amount }),
};

export default api;
