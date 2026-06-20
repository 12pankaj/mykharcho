import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    CreditCard, 
    LifeBuoy, 
    Settings as SettingsIcon,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Users,
    Zap,
    ChevronRight
} from 'lucide-react';
import { UserService } from '../api/shared/apiService';

interface AdminLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        UserService.getProfile().then(res => setProfile(res.data));
    }, []);

    const navItems = [
        { icon: <LayoutDashboard size={24}/>, label: 'Command Center', path: '/dashboard' },
        { icon: <CreditCard size={24}/>, label: 'Revenue Hub', path: '/admin/payments' },
        { icon: <LifeBuoy size={24}/>, label: 'Support Desk', path: '/admin/tickets' },
        { icon: <Zap size={24}/>, label: 'Plan Manager', path: '/admin/plans' },
        { icon: <Users size={24}/>, label: 'User Directory', path: '/admin/users' },
    ];

    const getProfilePic = () => {
        if (profile?.profile_pic) {
            return `http://72.60.222.102:5010${profile.profile_pic}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Admin')}&background=0ea5e9&color=fff&bold=true`;
    };

    return (
        <div className="flex h-screen bg-[#0c3468] text-slate-300 font-sans selection:bg-[#c1522d]/30 overflow-hidden">
            {/* Admin Sidebar */}
            <aside className={`hidden lg:flex ${isSidebarOpen ? 'w-80' : 'w-24'} border-r border-slate-800/50 bg-[#0c3468] transition-all duration-500 ease-in-out flex-col z-50`}>
                <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/admin-portal')}>
                    <img src="/newlogo.png" alt="Logo" className="w-12 h-12 rounded-[1.2rem] shadow-2xl flex-shrink-0 object-cover border-2 border-[#c1522d]"/>
                    {isSidebarOpen && (
                        <div className="animate-in fade-in duration-700">
                            <span className="text-2xl font-black text-white tracking-tighter block leading-none">My<span className="text-[#c1522d]">Kharcho</span></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admin Portal</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-5 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                                location.pathname === item.path 
                                ? 'bg-[#c1522d] text-white shadow-xl shadow-[#c1522d]/20' 
                                : 'text-slate-500 hover:bg-[#082a52] hover:text-slate-300'
                            }`}
                        >
                            <div className={`${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                                {item.icon}
                            </div>
                            {isSidebarOpen && <span className="font-black text-sm tracking-wide">{item.label}</span>}
                            {isSidebarOpen && location.pathname === item.path && (
                                <ChevronRight className="ml-auto opacity-50" size={16} />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-8 border-t border-slate-800/50 bg-[#082a52]/30">
                    <div className={`flex items-center gap-4 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-12 h-12 rounded-2xl bg-[#0c3468] p-0.5 border border-slate-800 shadow-xl overflow-hidden shrink-0">
                            <img src={getProfilePic()} className="w-full h-full object-cover" alt="admin"/>
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="text-sm font-black text-white truncate">{profile?.full_name}</p>
                                <p className="text-[10px] text-[#c1522d] font-bold uppercase tracking-widest">Master Admin</p>
                            </div>
                        )}
                        {isSidebarOpen && (
                            <button onClick={onLogout} className="ml-auto p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                                <LogOut size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-600/5 via-transparent to-transparent">
                {/* Header */}
                <header className="h-24 border-b border-slate-800/50 flex items-center justify-between px-10 bg-[#0c3468]/20 backdrop-blur-md z-40">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-3 bg-[#0c3468] border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400"
                    >
                        {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">System Health:</span>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Optimal</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
