import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService, setAuthToken } from '../api/apiService';

interface AuthContextType {
    user: any;
    token: string | null;
    isLoading: boolean;
    signIn: (token: string, user: any) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                const storedUser = await AsyncStorage.getItem('user');
                
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setAuthToken(storedToken); // Inject into Axios synchronously
                    setUser(JSON.parse(storedUser));
                    
                    // Optionally fetch fresh profile data in background
                    UserService.getProfile()
                        .then(res => {
                            setUser(res.data);
                            AsyncStorage.setItem('user', JSON.stringify(res.data));
                        })
                        .catch(err => {
                            console.log('Could not refresh profile', err);
                            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                                AsyncStorage.removeItem('token');
                                AsyncStorage.removeItem('user');
                                setToken(null);
                                setAuthToken(null);
                                setUser(null);
                            }
                        });
                }
            } catch (e) {
                console.error('Failed to load auth state', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    const signIn = async (newToken: string, newUser: any) => {
        try {
            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            setToken(newToken);
            setAuthToken(newToken);
            setUser(newUser);
        } catch (e) {
            console.error('Error during sign in', e);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setAuthToken(null);
            setUser(null);
        } catch (e) {
            console.error('Error during sign out', e);
        }
    };

    const updateUser = (updatedUser: any) => {
        setUser(updatedUser);
        AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
