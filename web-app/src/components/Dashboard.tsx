import React, { useState, useEffect } from 'react';
import { FinanceService, UserService, AdminService } from '../api/shared/apiService';
import { formatCurrency } from '../api/shared/utils';
import { useNavigate } from 'react-router-dom';
import { 
    Wallet, 
    CreditCard, 
    Plus,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Users,
    Activity,
    Shield,
    AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#c1522d', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0, incomeTrend: '+0%', expenseTrend: '+0%', chartData: [] });
    const [adminStats, setAdminStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const profileRes = await UserService.getProfile();
            const currentProfile = profileRes.data;
            setProfile(currentProfile);

            if (currentProfile.role === 'admin' || currentProfile.role === 'agent') {
                const adminRes = await AdminService.getStats();
                setAdminStats(adminRes.data);
            } else {
                const [statsRes, txRes] = await Promise.all([
                    FinanceService.getStats(),
                    FinanceService.getAll(),
                ]);
                setStats(statsRes.data);
                setTransactions(txRes.data);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const expensesByCategory = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, curr) => {
            const cat = curr.category || 'Other';
            acc[cat] = (acc[cat] || 0) + Number(curr.amount);
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            {profile?.role === 'admin' ? 'Admin Intelligence' : 'Financial Hub'}
                        </h2>
                        {profile && profile.role !== 'admin' && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile.current_plan_id === 3 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : profile.current_plan_id === 2 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                {profile.plan_name || 'Free'}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 font-medium text-sm md:text-base mt-2">
                        {profile?.role === 'admin' 
                            ? 'System-wide performance and revenue monitoring.' 
                            : `Monitoring your ${profile?.plan_name || 'Free'} empire in real-time.`}
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={fetchData} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-400 group flex items-center justify-center">
                        <RefreshCw size={22} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    {profile?.role === 'admin' && (
                        <button onClick={() => navigate('/admin-portal')} className="px-6 py-4 bg-orange-700 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 flex items-center gap-2 hover:bg-orange-600 transition-all active:scale-95">
                            <Shield size={20}/> Manage Portal
                        </button>
                    )}
                </div>
            </div>

            {profile?.role === 'admin' && adminStats ? (
                /* Admin Dashboard View */
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard 
                            label="Total Platform Users" 
                            amount={adminStats.stats.totalUsers.toString()} 
                            trend="+12%" 
                            icon={<Users className="text-blue-400"/>} 
                            bg="bg-blue-500/5"
                        />
                        <StatCard 
                            label="Total Revenue" 
                            amount={`₹${adminStats.stats.totalRevenue.toLocaleString()}`} 
                            trend="+24%" 
                            icon={<TrendingUp className="text-orange-500"/>} 
                            bg="bg-orange-600/5"
                        />
                        <StatCard 
                            label="Active Subscriptions" 
                            amount={adminStats.stats.activeSubscriptions.toString()} 
                            trend="+8%" 
                            icon={<Activity className="text-amber-400"/>} 
                            bg="bg-amber-500/5"
                        />
                        <StatCard 
                            label="Pending Tickets" 
                            amount={adminStats.stats.openTickets.toString()} 
                            trend="Urgent" 
                            icon={<AlertCircle className="text-rose-400"/>} 
                            bg="bg-rose-500/5"
                        />
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white">Platform Growth</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Daily Revenue (Last 30 Days)</p>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={adminStats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#fff' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                /* Regular User Dashboard View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <StatCard 
                            label="Available Balance" 
                            amount={formatCurrency(stats.balance, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')} 
                            trend={stats.incomeTrend} 
                            icon={<Wallet className="text-blue-400"/>} 
                            bg="bg-blue-500/5"
                        />
                        <StatCard 
                            label="Monthly Expense" 
                            amount={formatCurrency(stats.expense, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')} 
                            trend={stats.expenseTrend} 
                            icon={<CreditCard className="text-rose-400"/>} 
                            bg="bg-rose-500/5"
                        />
                        <div className="md:col-span-2 bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white">Cash Flow</h3>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Last 30 Days</p>
                                </div>
                                <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div>Income</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-400"></div>Expense</div>
                                </div>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#fff' }} itemStyle={{ fontWeight: 'bold' }} />
                                        <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                        <Area type="monotone" dataKey="Expense" stroke="#fb7185" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Mini List */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-6 md:p-8 flex flex-col shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-white">Recent Movements</h3>
                        </div>
                        <div className="space-y-6 flex-1">
                            {transactions.length > 0 ? transactions.slice(0, 4).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between group cursor-pointer p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'Income' ? 'bg-orange-600/10 text-orange-500' : 'bg-rose-500/10 text-rose-400'} border border-slate-800/50 group-hover:scale-110 transition-transform`}>
                                            {tx.type === 'Income' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate max-w-[120px]">{tx.category || 'Other'}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{new Date(tx.transaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <p className={`text-base font-black tabular-nums tracking-tighter ${tx.type === 'Income' ? 'text-orange-500' : 'text-slate-300'}`}>
                                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN').split('.')[0]}
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <RefreshCw size={20} className="text-slate-600"/>
                                    </div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No recent data</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dashboard Mini Pie Chart */}
                    <div className="md:col-span-3 bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-6 md:p-8 flex flex-col shadow-xl overflow-hidden relative">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-black text-white">Expense Distribution</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">By Category</p>
                            </div>
                            <button onClick={() => navigate('/reports')} className="text-sm font-bold text-[#c1522d] hover:text-white transition-colors">View Report &rarr;</button>
                        </div>
                        {pieData.length > 0 ? (
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#fff' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No expense data found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, amount, trend, icon, bg }: any) => (
    <div className={`p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-slate-800/50 ${bg} hover:border-slate-700 transition-all group relative overflow-hidden shadow-lg`}>
        <div className="flex justify-between items-start mb-6 md:mb-8">
            <div className="p-3 md:p-4 bg-slate-950 rounded-2xl md:rounded-[1.5rem] border border-slate-800 group-hover:scale-110 transition-transform duration-700 shadow-xl">
                {icon}
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${trend.startsWith('+') ? 'bg-orange-600/10 text-orange-500' : 'bg-rose-500/10 text-rose-400'}`}>
                {trend}
            </div>
        </div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2">{label}</p>
        <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tighter">{amount}</h3>
    </div>
);

export default Dashboard;
