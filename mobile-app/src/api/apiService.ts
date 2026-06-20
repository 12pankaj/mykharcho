import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL pointing to the production backend
const API_BASE_URL = 'https://api.mykharcho.in/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Sync variable to store token for interceptor
let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    currentToken = token;
};

// Interceptor to add JWT token to requests synchronously
api.interceptors.request.use((config) => {
    // Use .set() for modern AxiosHeaders compatibility
    if (currentToken) {
        config.headers.set('Authorization', `Bearer ${currentToken.trim()}`);
    }

    // Bypass DevTunnels warning page
    config.headers.set('x-ms-devtunnel-skip', 'true');
    config.headers.set('ngrok-skip-browser-warning', 'true');

    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url} | HasToken: ${!!currentToken}`);
    return config;
}, (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
}, (error) => {
    console.error('[API RESPONSE ERROR]', error.response?.status, error.message, error.response?.data);
    return Promise.reject(error);
});

export const AuthService = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    signup: (userData: any) => api.post('/auth/signup', userData),
    googleLogin: (token: string) => api.post('/auth/google', { token }),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

export const DashboardService = {
    getStats: () => api.get('/stats'),
};

export const TransactionService = {
    getAll: () => api.get('/transactions'),
    add: (data: any) => api.post('/transactions', data),
    delete: (id: string | number) => api.delete(`/transactions/${id}`),
    update: (id: string | number, data: any) => api.put(`/transactions/${id}`, data),
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
    payInstallment: (id: string | number, amount: number, walletId: number) => api.post(`/loans/installments/${id}/pay`, { paidAmount: amount, walletId }),
    sendReminder: (id: string | number) => api.post(`/loans/installments/${id}/remind`)
};

export const UserService = {
    getProfile: () => api.get('/profile'),
    updateProfile: (data: any) => api.put('/profile', data),
    uploadProfilePic: async (data: FormData) => {
        const response = await fetch(`${API_BASE_URL}/profile/upload`, {
            method: 'POST',
            body: data,
            headers: {
                'Authorization': `Bearer ${currentToken?.trim()}`,
                'x-ms-devtunnel-skip': 'true',
                'ngrok-skip-browser-warning': 'true'
            }
        });
        if (!response.ok) throw new Error('Upload failed');
        return { data: await response.json() };
    },
    savePushToken: (pushToken: string) => api.post('/profile/push-token', { pushToken }),
};

export const WalletService = {
    getAll: () => api.get('/wallets'),
    create: (data: any) => api.post('/wallets', data),
    update: (id: string | number, data: any) => api.put(`/wallets/${id}`, data),
    delete: (id: string | number) => api.delete(`/wallets/${id}`),
};

export const AdminService = {
    getStats: () => api.get('/admin/stats'),
    getTickets: () => api.get('/admin/tickets'),
    getPayments: () => api.get('/admin/payments'),
    getPlans: () => api.get('/admin/plans'),
    getUsers: () => api.get('/admin/users'),
    createPlan: (data: any) => api.post('/admin/plans', data),
    updatePlan: (data: any) => api.put('/admin/plans', data),
    assignTicket: (ticketId: number, agentId: number) => api.post('/admin/tickets/assign', { ticketId, agentId }),
    resolveTicket: (ticketId: number) => api.post('/admin/tickets/resolve', { ticketId }),
};

export const SupportService = {
    getTickets: () => api.get('/support/tickets'),
    createTicket: (data: any) => api.post('/support/tickets', data),
    getMessages: (ticketId: string | number) => api.get(`/support/tickets/${ticketId}/messages`),
    addMessage: (ticketId: string | number, message: string) => api.post(`/support/tickets/${ticketId}/messages`, { message }),
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

export const AutomationService = {
    getAll: () => api.get('/automation'),
    create: (data: any) => api.post('/automation', data),
    delete: (id: string | number) => api.delete(`/automation/${id}`),
    update: (id: string | number, data: any) => api.put(`/automation/${id}`, data),
};

export const NotificationService = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: string | number) => api.put(`/notifications/${id}/read`),
};

export const PaymentService = {
    createOrder: (planId: number) => api.post('/payments/create-order', { planId }),
    verifyPayment: (data: any) => api.post('/payments/verify', data),
};

export const AIService = {
    parseTransaction: (payload: any) => api.post('/ai/parse', payload),
};

// Default export object for legacy screen imports
const apiService = {
    getStats: () => api.get('/stats'),
    getTransactions: () => api.get('/transactions'),
    getWallets: () => api.get('/wallets'),
    getProfile: () => api.get('/profile'),
    getLoanContracts: () => api.get('/loans'),
    getAutomationRules: () => api.get('/automation'),
    getTickets: () => api.get('/support/tickets'),
    createTicket: (data: any) => api.post('/support/tickets', data),
    getAdminStats: () => api.get('/admin/stats'),
    getAdminUsers: () => api.get('/admin/users'),
    getPlans: () => api.get('/public/plans'),
    updatePushToken: (token: string) => api.post('/profile/push-token', { pushToken: token })
};

export default apiService;
