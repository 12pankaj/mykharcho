import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../api/shared/apiService';
import { Shield, Mail, Lock, User, Globe, ArrowRight, Gift } from 'lucide-react';

interface SignupProps {
    onAuthSuccess: (token: string) => void;
}

const Signup: React.FC<SignupProps> = ({ onAuthSuccess }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [referredByCode, setReferredByCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log('Attempting signup for:', email);
            const response = await AuthService.signup({ 
                fullName, 
                email, 
                password, 
                currency,
                countryCode: 'IN',
                referredByCode
            });
            console.log('Signup API Response:', response.data);

            if (response.data && response.data.token) {
                onAuthSuccess(response.data.token);
            } else {
                throw new Error('Token not found in response');
            }
        } catch (err: any) {
            console.error('Signup Error Object:', err);
            setError(err.response?.data?.message || err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{backgroundColor: 'var(--color-bg-app)'}}>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] aurora-orb aurora-orb-gold"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] aurora-orb aurora-orb-cyan"></div>

            <div className="relative w-full max-w-[480px]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl mb-4" style={{background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', boxShadow: '0 8px 28px rgba(var(--color-primary-rgb),0.35)'}}>
                        <Shield className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-3xl font-black" style={{color: 'var(--color-text-primary)'}}>Create Account</h1>
                    <p className="font-medium" style={{color: 'var(--color-text-secondary)'}}>Join the next-gen financial revolution</p>
                </div>

                <div className="backdrop-blur-xl border rounded-3xl p-8 shadow-2xl" style={{backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)'}}>
                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                 <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{color: 'var(--color-text-secondary)'}}>Full Name</label>
                                 <div className="relative group">
                                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{color: 'var(--color-text-muted)', zIndex: 10}} />
                                     <input
                                         type="text"
                                         required
                                         placeholder="John Doe"
                                         className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all"
                                         style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)', position: 'relative', zIndex: 1}}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                 <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{color: 'var(--color-text-secondary)'}}>Currency</label>
                                 <div className="relative group">
                                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{color: 'var(--color-text-muted)', zIndex: 10}} />
                                     <select
                                         className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all appearance-none"
                                         style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)', position: 'relative', zIndex: 1}}
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="AED">AED (د.إ)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                             <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{color: 'var(--color-text-secondary)'}}>Email Address</label>
                             <div className="relative group">
                                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{color: 'var(--color-text-muted)', zIndex: 10}} />
                                 <input
                                     type="email"
                                     required
                                     placeholder="john@example.com"
                                     className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all"
                                     style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)', position: 'relative', zIndex: 1}}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                             <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{color: 'var(--color-text-secondary)'}}>Secure Password</label>
                             <div className="relative group">
                                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{color: 'var(--color-text-muted)', zIndex: 10}} />
                                 <input
                                     type="password"
                                     required
                                     placeholder="••••••••"
                                     className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all"
                                     style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)', position: 'relative', zIndex: 1}}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                             <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{color: 'var(--color-text-secondary)'}}>Referral Code (Optional)</label>
                             <div className="relative group">
                                 <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{color: 'var(--color-text-muted)', zIndex: 10}} />
                                 <input
                                     type="text"
                                     placeholder="e.g. PANKAJ"
                                     className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-all uppercase"
                                     style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)', position: 'relative', zIndex: 1}}
                                    value={referredByCode}
                                    onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70 mt-4"
                            style={{background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', boxShadow: '0 6px 20px rgba(var(--color-primary-rgb),0.3)'}}
                        >
                            <span>{loading ? 'Processing...' : 'Create Empire Account'}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-sm font-medium" style={{color: 'var(--color-text-secondary)'}}>Already an emperor? <button onClick={() => navigate('/login')} className="font-bold transition-colors" style={{color: 'var(--color-primary)'}}>Sign In</button></p>
            </div>
        </div>
    );
};

export default Signup;
