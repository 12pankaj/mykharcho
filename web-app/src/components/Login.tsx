import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../api/shared/apiService';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
    onAuthSuccess: (token: string, rememberMe?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoading(true);
                const res = await AuthService.googleLogin(tokenResponse.access_token);
                if (res.data && res.data.token) {
                    onAuthSuccess(res.data.token, rememberMe);
                }
            } catch (err: any) {
                setError('Google Login failed.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google Login failed.'),
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log('Attempting login with:', email);
            const response = await AuthService.login(email, password);
            console.log('Login API Response:', response.data);

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            if (response.data && response.data.token) {
                onAuthSuccess(response.data.token, rememberMe);
            } else {
                throw new Error('Token not found in response');
            }
        } catch (err: any) {
            console.error('Login Error Object:', err);
            setError(err.response?.data?.message || err.message || 'Login failed. Check your coordinates.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="relative w-full max-w-[440px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <img
                        src="/newlogo.png"
                        alt="MyKharcho Logo"
                        className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-orange-500/40 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300 border-2 border-orange-500/20"
                    />
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                        My<span className="text-blue-500">Kharcho</span>
                    </h1>
                    <p className="text-slate-400 font-medium">The Next-Gen Financial Empire</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Secure Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500/40"
                                />
                                <span className="text-xs text-slate-400 font-medium">Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-2"
                        >
                            <span>{loading ? 'Authenticating...' : 'Enter Dashboard'}</span>
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <span className="relative px-4 bg-[#0f172a] text-xs font-bold text-slate-500 tracking-widest uppercase">Elite Access</span>
                        </div>

                        <button
                            onClick={() => loginWithGoogle()}
                            className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-3 hover:bg-slate-100 transition-colors active:scale-[0.98]"
                        >
                            <img className="h-5 w-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg" alt="Google" />
                            <span>Continue with Google</span>
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-500 text-sm font-medium">
                    New to the empire? <button onClick={() => navigate('/signup')} className="text-orange-500 hover:text-orange-300 transition-colors font-bold">Initiate Access</button>
                </p>
            </div>
        </div>
    );
};

export default Login;
