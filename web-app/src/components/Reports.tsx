import React, { useState, useEffect } from 'react';
import { FinanceService, UserService } from '../api/shared/apiService';
import { formatCurrency } from '../api/shared/utils';
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';

const COLORS = ['#c1522d', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, txRes, statsRes] = await Promise.all([
                UserService.getProfile(),
                FinanceService.getAll(),
                FinanceService.getStats()
            ]);
            setProfile(profileRes.data);
            setTransactions(txRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Error fetching reports data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Aggregate data for Pie Chart (Expense by Category)
    const expensesByCategory = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, curr) => {
            const cat = curr.category || 'Other';
            acc[cat] = (acc[cat] || 0) + Number(curr.amount);
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort descending

    // Aggregate data for Bar Chart (Income vs Expense by Month)
    // For simplicity, we just use the last 30 days chartData from stats, but we can map it to a bar chart
    const barData = stats?.chartData || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <PieChartIcon className="text-[#c1522d]" size={36} />
                        Analytics & Reports
                    </h2>
                    <p className="text-slate-500 font-medium text-sm md:text-base mt-2">
                        Deep dive into your financial habits and trends.
                    </p>
                </div>
                <button onClick={fetchData} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-400">
                    <RefreshCw size={22} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expense Breakdown */}
                <div className="bg-[#0c3468]/50 border border-[#344c77] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                    <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                        <PieChartIcon className="text-[#c1522d]" />
                        Expense Breakdown
                    </h3>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-8">Where your money goes</p>
                    
                    {pieData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#08172c', borderColor: '#344c77', borderRadius: '1rem', color: '#fff' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No expense data found</p>
                        </div>
                    )}
                </div>

                {/* Income vs Expense Bar Chart */}
                <div className="bg-[#0c3468]/50 border border-[#344c77] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                    <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                        <BarChart3 className="text-blue-500" />
                        Income vs Expense
                    </h3>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-8">Daily Cash Flow</p>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#344c77" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#08172c', borderColor: '#344c77', borderRadius: '1rem', color: '#fff' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expense" fill="#c1522d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overall Trend Area Chart */}
                <div className="bg-[#0c3468]/50 border border-[#344c77] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden lg:col-span-2">
                    <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" />
                        Wealth Trajectory
                    </h3>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-8">Cumulative overview</p>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c1522d" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#c1522d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#344c77" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#08172c', borderColor: '#344c77', borderRadius: '1rem', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="Income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="Expense" stroke="#c1522d" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
