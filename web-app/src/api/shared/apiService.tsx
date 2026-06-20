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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AuthService = {
    login: (email: any, password: any) => api.post('/auth/login', { email, password }),
    signup: (userData: any) => api.post('/auth/signup', userData),
    googleLogin: (token: any) => api.post('/auth/google', { token }),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
};

export const FinanceService = {
    getAll: () => api.get('/transactions'),
    add: (data: any) => api.post('/transactions', data),
    delete: (id: any) => api.delete(`/transactions/${id}`),
    update: (id: any, data: any) => api.put(`/transactions/${id}`, data),
    getStats: () => api.get('/stats'),
    parseAi: (data: any) => api.post('/ai/parse', data),
};

export const UserService = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data: any) => api.put('/profile', data),
    uploadProfilePic: (formData: FormData) => api.post('/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const WalletService = {
    getAll: () => api.get('/wallets'),
    create: (data: any) => api.post('/wallets', data),
    update: (id: string | number, data: any) => api.put(`/wallets/${id}`, data),
    delete: (id: string | number) => api.delete(`/wallets/${id}`),
};

export const LoanService = {
    getContracts: () => api.get('/loans'),
    createContract: (data: any) => api.post('/loans', data),
    deleteContract: (id: string | number) => api.delete(`/loans/${id}`),
    updateContract: (id: string | number, data: any) => api.put(`/loans/${id}`, data),
    getInstallments: (contractId: string | number) => api.get(`/loans/${contractId}/installments`),
    addInstallment: (contractId: string | number, data: any) => api.post(`/loans/${contractId}/installments`, data),
    updateInstallment: (id: string | number, data: any) => api.put(`/loans/installments/${id}`, data),
    deleteInstallment: (id: string | number) => api.delete(`/loans/installments/${id}`),
    payInstallment: (id: string | number, data: any) => api.post(`/loans/installments/${id}/pay`, data),
};

export const AutomationService = {
    getAll: () => api.get('/automation'),
    create: (data: any) => api.post('/automation', data),
    delete: (id: string | number) => api.delete(`/automation/${id}`),
    update: (id: string | number, data: any) => api.put(`/automation/${id}`, data),
};

export const PaymentService = {
    createOrder: (planId: number) => api.post('/payments/create-order', { planId }),
    verifyPayment: (data: any) => api.post('/payments/verify', data),
};

export const SupportService = {
    getTickets: () => api.get('/support/tickets'),
    createTicket: (data: any) => api.post('/support/tickets', data),
    getMessages: (ticketId: string | number) => api.get(`/support/tickets/${ticketId}/messages`),
    addMessage: (ticketId: string | number, message: string) => api.post(`/support/tickets/${ticketId}/messages`, { message }),
};

export const AdminService = {
    getStats: () => api.get('/admin/stats'),
    getPayments: () => api.get('/admin/payments'),
    getTickets: () => api.get('/admin/tickets'),
    getAgents: () => api.get('/admin/agents'),
    getUsers: () => api.get('/admin/users'),
    getPlans: () => api.get('/admin/plans'),
    createPlan: (data: any) => api.post('/admin/plans', data),
    assignTicket: (ticketId: number, agentId: number) => api.post('/admin/tickets/assign', { ticketId, agentId }),
    resolveTicket: (ticketId: number) => api.post('/admin/tickets/resolve', { ticketId }),
    updatePlan: (data: any) => api.put('/admin/plans', data),
};

export const GroupService = {
    getGroups: () => api.get('/groups'),
    createGroup: (data: any) => api.post('/groups', data),
    getGroupDetails: (id: string | number) => api.get(`/groups/${id}`),
    addMember: (id: string | number, email: string) => api.post(`/groups/${id}/members`, { email }),
    addExpense: (id: string | number, data: any) => api.post(`/groups/${id}/expenses`, data),
    getSettlements: (id: string | number) => api.get(`/groups/${id}/settlements`),
    settleDebt: (id: string | number, data: any) => api.post(`/groups/${id}/settle`, data)
};

export default api;
