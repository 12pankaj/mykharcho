import React, { useState, useEffect, useRef } from 'react';
import { UserService, SERVER_URL } from '../api/shared/apiService';
import { 
    Camera, 
    Image as ImageIcon, 
    Check,
    Save,
    User as UserIcon,
    Shield,
    Globe,
    RefreshCw,
    Gift
} from 'lucide-react';

const DUMMY_AVATARS = [
    { id: 'm1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm2', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f2', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm3', url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f3', url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&h=250&q=80' },
];

const Settings: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({ fullName: '', currency: '', countryCode: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCopy = () => {
        if (profile?.referral_code) {
            navigator.clipboard.writeText(profile.referral_code);
            setCopied(true);
            showNotification('Referral code copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await UserService.getProfile();
                setProfile(res.data);
                setFormData({
                    fullName: res.data.full_name || '',
                    currency: res.data.preferred_currency || 'INR',
                    countryCode: res.data.country_code || 'IN'
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, profilePic: profile?.profile_pic };
            const res = await UserService.updateProfile(payload);
            setProfile(res.data);
            showNotification('Settings updated successfully!');
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            showNotification('Update failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append('image', file);
        try {
            const res = await UserService.uploadProfilePic(data);
            setProfile({ ...profile, profile_pic: res.data.imageUrl });
            showNotification('Profile picture uploaded!');
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            showNotification('Upload failed', 'error');
        }
    };

    const selectDummyAvatar = async (url: string) => {
        try {
            // Update immediately in UI
            setProfile({ ...profile, profile_pic: url });
            
            // Save to backend
            const payload = { ...formData, profilePic: url };
            await UserService.updateProfile(payload);
            
            showNotification('Avatar saved!');
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            showNotification('Selection failed', 'error');
        }
    };

    const getProfilePic = () => {
        if (!profile?.profile_pic) return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=2563eb&color=fff&size=256&font-size=0.4&bold=true`;
        if (profile.profile_pic.startsWith('http')) return profile.profile_pic;
        return `${SERVER_URL}${profile.profile_pic}`;
    };

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
            {/* Custom Toast Notification */}
            {notification && (
                <div className={`fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-bold tracking-wide ${notification.type === 'success' ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                    {notification.type === 'success' ? <Check size={20}/> : <Shield size={20}/>}
                    {notification.msg}
                </div>
            )}
            <header>
                <h1 className="text-4xl font-black text-white tracking-tight">System Settings</h1>
                <p className="text-slate-500 font-medium">Manage your empire profile and preferences.</p>
            </header>

            <div className="bg-slate-950/50 border border-slate-800 rounded-[3rem] p-10 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
                
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 relative z-10">
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-[3rem] bg-slate-800 p-1 border-4 border-blue-500/20 overflow-hidden shadow-2xl">
                                <img src={getProfilePic()} className="w-full h-full object-cover" alt="avatar"/>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 bg-blue-600 p-3 rounded-2xl text-white shadow-2xl hover:bg-blue-500 transition-all hover:scale-110 active:scale-95"
                            >
                                <Camera size={20}/>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update Profile Photo</p>
                    </div>

                    <div className="flex-1 space-y-10">
                        <section>
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <ImageIcon size={20} className="text-blue-500"/>
                                Instant Avatars
                            </h3>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                                {DUMMY_AVATARS.map(avatar => (
                                    <button 
                                        key={avatar.id}
                                        onClick={() => selectDummyAvatar(avatar.url)}
                                        className={`relative w-full aspect-square rounded-2xl bg-slate-800/50 border-2 transition-all overflow-hidden hover:scale-110 active:scale-95 ${profile?.profile_pic === avatar.url ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                                    >
                                        <img src={avatar.url} className="w-full h-full object-cover" alt="avatar"/>
                                        {profile?.profile_pic === avatar.url && (
                                            <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                                <Check size={16} className="text-white" strokeWidth={4}/>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <form onSubmit={handleUpdate} className="space-y-8 pt-8 border-t border-slate-800/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <UserIcon size={14}/> Full Name
                                    </label>
                                    <input 
                                        type="text"
                                        value={formData.fullName} 
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Globe size={14}/> Primary Currency
                                    </label>
                                    <select 
                                        value={formData.currency} 
                                        onChange={e => setFormData({...formData, currency: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none"
                                    >
                                        <option value="INR">INR - Indian Rupee</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="AED">AED - UAE Dirham</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Shield size={14}/> Security Email
                                    </label>
                                    <input 
                                        readOnly 
                                        value={profile?.email || ''} 
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-slate-500 outline-none cursor-not-allowed font-medium" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Globe size={14}/> Country Code
                                    </label>
                                    <input 
                                        type="text"
                                        value={formData.countryCode} 
                                        onChange={e => setFormData({...formData, countryCode: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-500/40 active:scale-[0.98] flex items-center gap-3">
                                    {loading ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                                    Synchronize Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Referral Card */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-[3rem] p-10 overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Gift className="text-orange-500 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Give a Month, Get a Month</h2>
                            <p className="text-slate-500 font-medium text-sm">Invite friends to MyKharcho. They get a 20% discount on purchase, and you get 30 days of Pro for free!</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4 border-t border-slate-800/50">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Your Unique Referral Code</label>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-xl tracking-wider select-all flex items-center justify-between">
                                    <span>{profile?.referral_code || '------'}</span>
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold px-6 rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Direct Sharing Link</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const shareText = `Hey! Manage your expenses smarter with MyKharcho. Sign up using my link to get a 20% discount: https://app.mykharcho.in/signup?ref=${profile?.referral_code}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-2xl shadow-green-500/20 active:scale-[0.98] text-center"
                                >
                                    Share on WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        const link = `https://app.mykharcho.in/signup?ref=${profile?.referral_code}`;
                                        navigator.clipboard.writeText(link);
                                        showNotification('Referral link copied!');
                                    }}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-black py-4 px-6 rounded-2xl transition-all active:scale-[0.98] text-center"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
