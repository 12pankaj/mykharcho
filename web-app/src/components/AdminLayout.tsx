import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    CreditCard, 
    LifeBuoy, 
    LogOut,
    Menu,
    X,
    Tag,
    Users,
    Zap,
    ChevronRight,
    Sun,
    Moon
} from 'lucide-react';
import { UserService, SERVER_URL } from '../api/shared/apiService';

interface AdminLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        UserService.getProfile().then(res => setProfile(res.data));
        
        const handleThemeChange = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
        window.dispatchEvent(new Event('themeChanged'));
    };

    const navItems = [
        { icon: <LayoutDashboard size={24}/>, label: 'Command Center', path: '/dashboard' },
        { icon: <CreditCard size={24}/>, label: 'Revenue Hub', path: '/admin/payments' },
        { icon: <LifeBuoy size={24}/>, label: 'Support Desk', path: '/admin/tickets' },
        { icon: <Zap size={24}/>, label: 'Plan Manager', path: '/admin/plans' },
        { icon: <Tag size={24}/>, label: 'Promo Codes', path: '/admin/coupons' },
        { icon: <Users size={24}/>, label: 'User Directory', path: '/admin/users' },
    ];

    const getProfilePic = () => {
        if (profile?.profile_pic) {
            return `${SERVER_URL}${profile.profile_pic}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Admin')}&background=0ea5e9&color=fff&bold=true`;
    };

    return (
        <div className="flex h-screen font-sans overflow-hidden" style={{backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)'}}>
            {/* Admin Sidebar */}
            <aside className={`hidden lg:flex ${isSidebarOpen ? 'w-80' : 'w-24'} border-r transition-all duration-500 ease-in-out flex-col z-50`} style={{backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)'}}>
                <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/admin-portal')}>
                    <img src="/newlogo.png" alt="Logo" className="w-12 h-12 rounded-[1.2rem] shadow-2xl flex-shrink-0 object-cover border-2" style={{borderColor: 'var(--color-primary)', boxShadow: '0 0 16px rgba(var(--color-primary-rgb),0.3)'}}/>
                    {isSidebarOpen && (
                        <div className="animate-in fade-in duration-700">
                            <span className="text-2xl font-black tracking-tighter block leading-none" style={{color: 'var(--color-text-primary)'}}>My<span style={{color: 'var(--color-primary)'}}>Kharcho</span></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{color: 'var(--color-text-secondary)'}}>Admin Portal</span>
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
                                ? 'text-white shadow-xl' 
                                : ''
                            }`}
                            style={location.pathname === item.path 
                                ? {background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', boxShadow: '0 4px 20px rgba(var(--color-primary-rgb),0.35)', color: '#fff'}
                                : {color: 'var(--color-text-secondary)'}}
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

                <div className="p-8 border-t" style={{borderColor: 'var(--color-sidebar-border)', backgroundColor: 'rgba(var(--color-primary-rgb),0.04)'}}>
                    <div className={`flex items-center gap-4 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-12 h-12 rounded-2xl p-0.5 border shadow-xl overflow-hidden shrink-0" style={{backgroundColor: 'var(--color-border)', borderColor: 'var(--color-border)'}}>
                            <img src={getProfilePic()} className="w-full h-full object-cover rounded-xl" alt="admin"/>
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <p className="text-sm font-black truncate" style={{color: 'var(--color-text-primary)'}}>{profile?.full_name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{color: 'var(--color-primary)'}}>Master Admin</p>
                            </div>
                        )}
                        {isSidebarOpen && (
                            <button onClick={onLogout} className="ml-auto p-2 rounded-xl transition-all" style={{color: 'var(--color-text-secondary)'}}>
                                <LogOut size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-24 border-b flex items-center justify-between px-10 backdrop-blur-md z-40" style={{backgroundColor: 'color-mix(in srgb, var(--color-sidebar-bg) 88%, transparent)', borderColor: 'var(--color-sidebar-border)'}}>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-3 border rounded-xl transition-all" style={{backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)'}}
                    >
                        {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
                    </button>

                    <div className="flex items-center gap-6">
                        {/* Theme Toggler */}
                        <button 
                            onClick={toggleTheme}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            className="p-3 rounded-xl transition-all active:scale-90" style={{color: 'var(--color-text-secondary)'}}
                        >
                            {isDarkMode ? <Sun size={20} style={{color: 'var(--color-accent)'}} /> : <Moon size={20} />}
                        </button>

                        <div className="px-4 py-2 border rounded-xl" style={{backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)'}}>
                            <span className="text-[10px] font-black uppercase tracking-widest mr-2" style={{color: 'var(--color-text-secondary)'}}>System Health:</span>
                            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse" style={{color: 'var(--color-primary)'}}>Optimal</span>
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
