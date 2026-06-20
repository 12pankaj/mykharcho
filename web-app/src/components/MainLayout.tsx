import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserService } from '../api/shared/apiService';
import { 
    LayoutDashboard, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Wallet, 
    Users, 
    Settings as SettingsIcon, 
    LogOut,
    ChevronRight,
    Crown,
    LifeBuoy,
    Menu,
    X,
    ShieldCheck,
    PieChart
} from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await UserService.getProfile();
                setProfile(res.data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();

        // Listen for profile updates from child components (e.g., Settings)
        window.addEventListener('profileUpdated', fetchProfile);
        return () => window.removeEventListener('profileUpdated', fetchProfile);
    }, []);

    // Auto close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const getProfilePic = () => {
        if (!profile?.profile_pic) return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=2563eb&color=fff&size=256&font-size=0.4&bold=true`;
        if (profile.profile_pic.startsWith('http')) return profile.profile_pic;
        return `http://72.60.222.102:5010${profile.profile_pic}`;
    };

    const navItems = [
        { icon: <LayoutDashboard size={24}/>, label: 'Overview', path: '/dashboard' },
        { icon: <ArrowDownLeft size={24}/>, label: 'Income', path: '/income' },
        { icon: <ArrowUpRight size={24}/>, label: 'Expenses', path: '/expenses' },
        { icon: <Users size={24}/>, label: 'Loans', path: '/loans' },
        { icon: <Wallet size={24}/>, label: 'Wallets', path: '/wallets' },
        { icon: <Users size={24}/>, label: 'Groups & Splits', path: '/groups' },
        { icon: <PieChart size={24}/>, label: 'Reports', path: '/reports' },
        { icon: <LifeBuoy size={24}/>, label: 'Support', path: '/support' },
        { icon: <Crown size={24} className="text-amber-400"/>, label: 'Upgrade to PRO', path: '/upgrade' },
        { icon: <SettingsIcon size={24}/>, label: 'Settings', path: '/settings' },
    ];

    // Add Admin portal if user is admin or agent
    if (profile?.role === 'admin' || profile?.role === 'agent') {
        navItems.push({ icon: <ShieldCheck size={24} className="text-orange-500"/>, label: 'Admin Portal', path: '/admin-portal' });
    }

    return (
        <div className="flex h-screen bg-[#0c3468] text-slate-300 font-sans selection:bg-[#c1522d]/30 overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className={`hidden lg:flex ${isSidebarOpen ? 'w-80' : 'w-24'} border-r border-slate-800/50 bg-[#0c3468] transition-all duration-500 ease-in-out flex-col z-50`}>
                <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <img src="/newlogo.png" alt="Logo" className="w-12 h-12 rounded-[1.2rem] shadow-2xl flex-shrink-0 object-cover border-2 border-[#c1522d]"/>
                    {isSidebarOpen && (
                        <div className="animate-in fade-in duration-700">
                            <span className="text-2xl font-black text-white tracking-tighter block leading-none">My<span className="text-[#c1522d]">Kharcho</span></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial OS</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-5 py-8 space-y-3">
                    {navItems.map((item) => (
                        <button 
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
                        >
                            <div className={`${location.pathname === item.path ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'}`}>{item.icon}</div>
                            {isSidebarOpen && <span className="font-black text-sm tracking-tight">{item.label}</span>}
                            {location.pathname === item.path && isSidebarOpen && <ChevronRight className="ml-auto opacity-50" size={18}/>}
                        </button>
                    ))}
                </nav>

            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <aside className="w-[280px] h-full border-r border-slate-800/50 bg-[#0c3468] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src="/newlogo.png" alt="Logo" className="w-12 h-12 rounded-[1.2rem] shadow-2xl flex-shrink-0 object-cover border-2 border-[#c1522d]"/>
                                <div>
                                    <span className="text-2xl font-black text-white tracking-tighter block leading-none">My<span className="text-[#c1522d]">Kharcho</span></span>
                                </div>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500"><X size={24}/></button>
                        </div>

                        <nav className="flex-1 px-5 py-4 space-y-3 overflow-y-auto custom-scrollbar">
                            {navItems.map((item) => (
                                <button 
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
                                >
                                    <div>{item.icon}</div>
                                    <span className="font-black text-sm tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Topbar */}
                <header className="h-20 md:h-24 border-b border-slate-800/50 flex items-center justify-between px-4 md:px-6 lg:px-10 bg-[#0c3468]/80 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2.5 md:p-3 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-all">
                            <Menu size={24}/>
                        </button>
                        
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center gap-2">
                            <img src="/newlogo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg flex-shrink-0 object-cover border border-[#c1522d]"/>
                            <span className="text-lg font-black text-white tracking-tighter leading-none">My<span className="text-[#c1522d]">Kharcho</span></span>
                        </div>

                    </div>

                    <div className="flex items-center gap-4 lg:gap-6">
                        {/* Premium Badge */}
                        {profile?.is_premium && (
                            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm animate-pulse ${profile.current_plan_id === 3 ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-blue-500/10 border-blue-500/50 text-blue-500'}`}>
                                <Crown size={12} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{profile.current_plan_id === 3 ? 'Elite' : 'Pro'}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div onClick={() => navigate('/settings')} className="flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 px-3 py-2.5 rounded-2xl transition-all group border border-transparent hover:border-slate-800">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{profile?.full_name || 'Loading...'}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mt-0.5">{profile?.preferred_currency} Account</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 p-0.5 border border-slate-700 shadow-xl group-hover:border-blue-500/50 transition-all overflow-hidden relative">
                                    <img src={getProfilePic()} className="w-full h-full object-cover" alt="avatar"/>
                                    {profile?.is_premium && <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-slate-800 rounded-full ${profile.current_plan_id === 3 ? 'bg-amber-500' : 'bg-blue-500'}`}></div>}
                                </div>
                            </div>
                            
                            {/* Quick Logout Button */}
                            <button 
                                onClick={onLogout}
                                title="Sign Out"
                                className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                            >
                                <LogOut size={22} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
