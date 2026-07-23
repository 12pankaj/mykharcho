import React, { useState, useEffect } from 'react';
import { FinanceService, UserService, AdminService, PromotionService } from '../api/shared/apiService';
import { formatCurrency } from '../api/shared/utils';
import { useNavigate } from 'react-router-dom';
import { 
    Wallet, 
    CreditCard, 
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Users,
    Activity,
    Shield,
    AlertCircle,
    Zap
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

    const [activePromotion, setActivePromotion] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [claimingTrial, setClaimingTrial] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, promoRes] = await Promise.all([
                UserService.getProfile(),
                PromotionService.getActive()
            ]);
            const currentProfile = profileRes.data;
            setProfile(currentProfile);
            setActivePromotion(promoRes.data.promotion);

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

    // Countdown Timer for Promotion Banner
    useEffect(() => {
        if (!activePromotion?.end_date) return;
        
        const updateTimer = () => {
            const end = new Date(activePromotion.end_date).getTime();
            const now = new Date().getTime();
            const diff = end - now;
            
            if (diff <= 0) {
                setTimeLeft('Expired');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activePromotion]);

    // Trial Modal Auto-trigger check
    useEffect(() => {
        if (
            profile && 
            profile.role !== 'admin' && 
            profile.current_streak >= 7 && 
            !profile.has_claimed_trial && 
            (profile.current_plan_id === '197f1815-141b-492f-bd2a-398ba6dc53d9' || profile.plan_name === 'Free')
        ) {
            setShowTrialModal(true);
        } else {
            if (localStorage.getItem('trialUnlocked') === 'true' && profile && !profile.has_claimed_trial) {
                setShowTrialModal(true);
            } else {
                setShowTrialModal(false);
            }
        }
    }, [profile]);

    const expensesByCategory = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, curr) => {
            const cat = curr.category || 'Other';
            acc[cat] = (acc[cat] || 0) + Number(curr.amount);
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value);

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Active Promotion Banner */}
            {activePromotion && timeLeft !== 'Expired' && (
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 border border-orange-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden animate-pulse">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                            <Zap className="text-white w-8 h-8 animate-bounce" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{activePromotion.title}</h3>
                            <p className="text-white/80 font-bold text-xs uppercase tracking-widest mt-1">Get {activePromotion.discount_percentage}% OFF on all upgrades!</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2 relative z-10">
                        <span className="text-xs font-black text-orange-200 uppercase tracking-widest">Flash Sale Ends In</span>
                        <div className="bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-3 text-white font-black text-xl md:text-2xl tracking-tighter tabular-nums shadow-lg">
                            {timeLeft || '--h --m --s'}
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            {profile?.role === 'admin' ? 'Admin Intelligence' : 'Financial Hub'}
                        </h2>
                        {profile && profile.role !== 'admin' && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile.current_plan_id === 'c83f759c-03c6-4bbd-b015-1ec0dce6b514' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : profile.current_plan_id === '7896e517-555e-433c-b2e3-2068b9a23450' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                {profile.plan_name || 'Free'}
                            </span>
                        )}
                        {profile && profile.role !== 'admin' && profile.current_streak > 0 && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse flex items-center gap-1">
                                🔥 {profile.current_streak} Day Streak
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#decbaf" vertical={false} />
                                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#FFE7B3', borderRadius: '1rem', color: '#1F2937' }} />
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
                                        <CartesianGrid strokeDasharray="3 3" stroke="#decbaf" vertical={false} />
                                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#FFE7B3', borderRadius: '1rem', color: '#1F2937' }} itemStyle={{ fontWeight: 'bold', color: '#1F2937' }} />
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
                                            {pieData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#FFE7B3', borderRadius: '1rem', color: '#1F2937' }}
                                            itemStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                                            formatter={(value: any) => `₹${value.toLocaleString()}`}
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
            {/* 7-Day Streak Congratulations Modal */}
            {showTrialModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-905 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-lg w-full relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[80px]"></div>

                        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-tr from-orange-600 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce animate-pulse">
                                <span className="text-4xl flex items-center justify-center h-full w-full">🔥</span>
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">7-Day Streak Achieved!</h2>
                                <p className="text-slate-400 font-medium mt-2">You logged your expenses for 7 consecutive days. Incredible discipline!</p>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 w-full space-y-3">
                                <div className="text-xs font-black text-orange-500 uppercase tracking-widest">Your Reward Unlocked</div>
                                <h3 className="text-2xl font-black text-white">3-Day FREE Elite Trial</h3>
                                <p className="text-slate-500 text-xs font-medium">Gain access to unlimited wallets, advanced automation rules, EMI schedules, and PDF exports instantly.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                                <button
                                    onClick={async () => {
                                        setClaimingTrial(true);
                                        try {
                                            await UserService.claimTrial();
                                            localStorage.removeItem('trialUnlocked');
                                            await fetchData();
                                            setShowTrialModal(false);
                                        } catch (err: any) {
                                            alert(err.response?.data?.error || 'Failed to claim trial');
                                        } finally {
                                            setClaimingTrial(false);
                                        }
                                    }}
                                    disabled={claimingTrial}
                                    className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-orange-400 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-2xl shadow-orange-500/30 active:scale-[0.98]"
                                >
                                    {claimingTrial ? 'Activating Elite...' : 'Claim 3-Day Free Elite'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTrialModal(false);
                                        localStorage.removeItem('trialUnlocked');
                                    }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
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
