import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    LifeBuoy, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Settings,
    Search,
    MessageSquare,
    Send,
    ArrowLeft,
    Plus,
    X,
    Sparkles,
    RefreshCcw
} from 'lucide-react';
import { AdminService, SupportService, PromotionService } from '../api/shared/apiService';
import LiveChatAdmin from './LiveChatAdmin';

const AdminDashboard: React.FC<{ initialTab?: 'tickets' | 'payments' | 'plans' | 'users' | 'live-chat' | 'broadcasts' | 'coupons' | 'promotions' }> = ({ initialTab = 'tickets' }) => {
    const [activeTab, setActiveTab] = useState<'tickets' | 'payments' | 'plans' | 'users' | 'live-chat' | 'broadcasts' | 'coupons' | 'promotions'>(initialTab);
    const [tickets, setTickets] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        let interval: any;
        if (selectedTicket && activeTab === 'tickets') {
            fetchMessages(selectedTicket.id);
            interval = setInterval(() => fetchMessages(selectedTicket.id), 10000);
        }
        return () => clearInterval(interval);
    }, [selectedTicket, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'tickets') {
                const [ticketsRes, agentsRes] = await Promise.all([
                    AdminService.getTickets(),
                    AdminService.getAgents()
                ]);
                setTickets(ticketsRes.data.tickets);
                setAgents(agentsRes.data.agents);
            } else if (activeTab === 'payments') {
                const res = await AdminService.getPayments();
                setPayments(res.data.payments);
            } else if (activeTab === 'users') {
                const res = await AdminService.getUsers();
                setUsers(res.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (ticketId: number) => {
        try {
            const res = await SupportService.getMessages(ticketId);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Failed to fetch messages');
        }
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedTicket) return;
        try {
            await SupportService.addMessage(selectedTicket.id, reply);
            setReply('');
            fetchMessages(selectedTicket.id);
        } catch (err) {
            alert('Failed to send message');
        }
    };

    const handleAssign = async (ticketId: number, agentId: number) => {
        try {
            await AdminService.assignTicket(ticketId, agentId);
            fetchData();
        } catch (err) {
            alert('Assignment failed');
        }
    };

    const handleResolve = async (ticketId: number) => {
        try {
            await AdminService.resolveTicket(ticketId);
            fetchData();
        } catch (err) {
            alert('Resolution failed');
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Admin Command Center</h1>
                <p className="text-slate-500 font-medium">Manage revenue, support cases, and system configuration.</p>
            </header>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                <TabButton 
                    active={activeTab === 'tickets'} 
                    onClick={() => setActiveTab('tickets')}
                    icon={<LifeBuoy size={20}/>}
                    label="Support Desk"
                    count={tickets.length}
                />
                <TabButton 
                    active={activeTab === 'payments'} 
                    onClick={() => setActiveTab('payments')}
                    icon={<CreditCard size={20}/>}
                    label="Revenue Hub"
                    count={payments.length}
                />
                <TabButton 
                    active={activeTab === 'plans'} 
                    onClick={() => setActiveTab('plans')}
                    icon={<Settings size={20}/>}
                    label="System Plans"
                />
                <TabButton 
                    active={activeTab === 'live-chat'} 
                    onClick={() => setActiveTab('live-chat')}
                    icon={<MessageSquare size={20}/>}
                    label="Live Chat"
                />
                <TabButton 
                    active={activeTab === 'broadcasts'} 
                    onClick={() => setActiveTab('broadcasts')}
                    icon={<AlertCircle size={20}/>}
                    label="Broadcasts"
                />
                <TabButton 
                    active={activeTab === 'coupons'} 
                    onClick={() => setActiveTab('coupons')}
                    icon={<CreditCard size={20}/>}
                    label="Promo Codes"
                />
                <TabButton 
                    active={activeTab === 'promotions'} 
                    onClick={() => setActiveTab('promotions')}
                    icon={<Zap size={20}/>}
                    label="Flash Sales"
                />
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                {activeTab === 'tickets' && (
                    <div className="flex flex-col lg:flex-row">
                        <div className={`flex-1 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
                            <TicketsTable 
                                tickets={tickets} 
                                agents={agents} 
                                onAssign={handleAssign}
                                onResolve={handleResolve}
                                onSelect={(t: any) => {
                                    setSelectedTicket(t);
                                    fetchMessages(t.id);
                                }}
                                loading={loading}
                            />
                        </div>
                        {selectedTicket && (
                            <div className="w-full lg:w-[450px] border-l border-slate-800 bg-slate-950/50 flex flex-col h-[600px]">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 text-slate-400 hover:text-white"><ArrowLeft size={20}/></button>
                                        <div>
                                            <h4 className="text-sm font-black text-white">{selectedTicket.subject}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold">User: {selectedTicket.user_name}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => fetchMessages(selectedTicket.id)}
                                        className="p-2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {/* Ticket Description as first message */}
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] bg-slate-800 border border-slate-700 text-slate-300 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                            <div className="text-[8px] font-black uppercase tracking-tighter opacity-60 mb-1">User Initial Query</div>
                                            <div className="text-xs font-medium">{selectedTicket.description}</div>
                                        </div>
                                    </div>

                                    {messages.map((m: any, i: number) => (
                                        <div key={i} className={`flex ${m.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg border ${
                                                m.sender_type === 'user' 
                                                    ? 'bg-slate-800 border-slate-700 text-slate-300 rounded-tl-none' 
                                                    : m.sender_type === 'ai'
                                                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-tr-none'
                                                    : 'bg-orange-700 text-white shadow-lg border-orange-500 rounded-tr-none'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1 opacity-60">
                                                    {m.sender_type === 'ai' && <Sparkles size={8}/>}
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">
                                                        {m.sender_type === 'ai' ? 'AI Assistant' : m.sender_type === 'user' ? 'User' : 'You (Support)'}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-medium">{m.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                                    <div className="flex gap-3">
                                        <input 
                                            className="flex-1 bg-slate-800 border-none rounded-xl text-xs font-bold text-white p-4 outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Write a reply..."
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                        />
                                        <button onClick={handleReply} className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all"><Send size={20}/></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'payments' && (
                    <PaymentsTable payments={payments} loading={loading} />
                )}
                {activeTab === 'users' && <UserManagement users={users} />}
                {activeTab === 'plans' && <PlanManagement />}
                {activeTab === 'coupons' && <CouponManagement />}
                {activeTab === 'promotions' && <PromotionManagement />}
                {activeTab === 'live-chat' && (
                    <LiveChatAdmin />
                )}
                {activeTab === 'broadcasts' && (
                    <BroadcastManagement />
                )}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
    >
        {icon}
        {label}
        {count !== undefined && (
            <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] ${active ? 'bg-white/20' : 'bg-slate-800'}`}>
                {count}
            </span>
        )}
    </button>
);

const TicketsTable = ({ tickets, agents, onAssign, onResolve, onSelect, loading }: any) => {
    if (loading) return <LoadingState />;
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-800/20">
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Case Details</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority / Status</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Agent</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                    {tickets.map((ticket: any) => (
                        <tr key={ticket.id} onClick={() => onSelect(ticket)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                            <td className="p-6">
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-sm mb-1">{ticket.subject}</span>
                                    <span className="text-slate-500 text-xs font-bold">From: {ticket.user_name}</span>
                                    <p className="text-slate-400 text-[11px] mt-2 line-clamp-1 italic">\"{ticket.description}\"</p>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex flex-col gap-2">
                                    <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        ticket.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-500' :
                                        ticket.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                                        ticket.priority === 'Normal' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-slate-500/10 text-slate-400'
                                    }`}>
                                        {ticket.priority || 'Normal'}
                                    </span>
                                    <span className={`inline-flex w-fit px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mt-2 ${
                                        ticket.status === 'Open' ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20' : 
                                        ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-mono mt-2">#{String(ticket.id).substring(0,8)}</div>
                                </div>
                            </td>
                            <td className="p-6">
                                <select 
                                    className="bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-300 p-2 outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={ticket.assigned_to || ''}
                                    onChange={(e) => onAssign(ticket.id, e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {agents.map((agent: any) => (
                                        <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-6 text-right">
                                {ticket.status !== 'Resolved' ? (
                                    <button 
                                        onClick={() => onResolve(ticket.id)}
                                        className="p-2 text-orange-500 hover:bg-orange-600/10 rounded-xl transition-all"
                                        title="Mark Resolved"
                                    >
                                        <CheckCircle2 size={20}/>
                                    </button>
                                ) : (
                                    <CheckCircle2 size={20} className="text-slate-600 ml-auto"/>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UsersTable = ({ users, loading }: any) => {
    const [search, setSearch] = useState('');
    if (loading) return <LoadingState />;

    const filteredUsers = users.filter((u: any) => 
        u.full_name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );
    
    return (
        <div className="flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-800/20">
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Info</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {filteredUsers.map((u: any) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-blue-400 border border-slate-700 uppercase">
                                            {u.full_name.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-black text-sm">{u.full_name}</span>
                                            <span className="text-slate-500 text-[11px] font-bold">{u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        u.role === 'admin' ? 'bg-orange-600/10 text-orange-600' :
                                        u.role === 'agent' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-slate-500/10 text-slate-400'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black ${u.is_premium ? 'text-blue-400' : 'text-slate-500'}`}>
                                            {u.plan_name || 'Free Tier'}
                                        </span>
                                        {u.is_premium && <span className="text-[10px] text-blue-500/50 font-black uppercase tracking-widest">Active</span>}
                                    </div>
                                </td>
                                <td className="p-6 text-right text-slate-500 text-[11px] font-bold">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PaymentsTable = ({ payments, loading }: any) => {
    if (loading) return <LoadingState />;
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-800/20">
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscriber</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction ID</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                    {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-6">
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-sm">{p.user_name}</span>
                                    <span className="text-slate-500 text-[11px] font-bold">{p.user_email}</span>
                                </div>
                            </td>
                            <td className="p-6 text-slate-400 font-mono text-xs">{p.payment_id}</td>
                            <td className="p-6">
                                <span className="text-white font-black text-sm">₹{parseFloat(p.amount).toLocaleString()}</span>
                            </td>
                            <td className="p-6 text-slate-500 text-xs font-bold">
                                {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-6 text-right">
                                <span className="px-2 py-1 rounded-lg bg-orange-600/10 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                                    Completed
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const LoadingState = () => (
    <div className="p-20 text-center">
        <Clock size={32} className="text-blue-500 mx-auto mb-4 animate-pulse"/>
        <p className="text-slate-500 font-bold">Fetching latest data...</p>
    </div>
);

const PlanManagement = () => {
    const [plans, setPlans] = React.useState<any[]>([]);
    const [showCreate, setShowCreate] = React.useState(false);
    const [newPlan, setNewPlan] = React.useState({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        price_3_year: 0,
        max_wallets: 5,
        max_rules: 5
    });

    const fetchPlans = async () => {
        try {
            const res = await AdminService.getPlans();
            setPlans(res.data.plans);
        } catch (err) {
            console.error('Failed to fetch plans');
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleCreate = async () => {
        try {
            await AdminService.createPlan(newPlan);
            setShowCreate(false);
            setNewPlan({ name: '', price_monthly: 0, max_wallets: 0, max_rules: 0 });
            fetchPlans();
        } catch (err) {
            alert('Failed to create plan');
        }
    };

    const handleUpdate = async (id: string, field: string, value: any) => {
        const updatedPlans = plans.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPlans(updatedPlans);
        try {
            await AdminService.updatePlan(updatedPlans.find(p => p.id === id));
        } catch (err) {
            alert('Failed to update plan');
        }
    };

    return (
        <div className="p-10 space-y-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-black text-white">System Subscription Tiers</h3>
                    <p className="text-slate-500 text-sm font-medium">Control pricing and account limits for all users.</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                >
                    <Plus size={20}/> New Plan
                </button>
            </div>

            {showCreate && (
                <div className="bg-slate-950 border border-blue-500/30 rounded-[2rem] p-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-lg font-black text-white">Create New Tier</h4>
                        <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Plan Name</label>
                            <input 
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="e.g. Ultra"
                                value={newPlan.name}
                                onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Price Monthly(₹)</label>
                            <input 
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newPlan.price_monthly}
                                onChange={(e) => setNewPlan({...newPlan, price_monthly: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Price Yearly(₹)</label>
                            <input 
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newPlan.price_yearly}
                                onChange={(e) => setNewPlan({...newPlan, price_yearly: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Price 3 Years(₹)</label>
                            <input 
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newPlan.price_3_year}
                                onChange={(e) => setNewPlan({...newPlan, price_3_year: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Max Wallets</label>
                            <input 
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newPlan.max_wallets}
                                onChange={(e) => setNewPlan({...newPlan, max_wallets: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Max Rules</label>
                            <input 
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newPlan.max_rules}
                                onChange={(e) => setNewPlan({...newPlan, max_rules: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    <button onClick={handleCreate} className="w-full py-4 bg-orange-700 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-600 transition-all">
                        Initialize Plan
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-slate-950 border border-slate-800 rounded-[2rem] p-8 hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black text-white">{plan.name}</h4>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg">ID: {plan.id.substring(0,8)}</span>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">1 Month</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={plan.price_monthly} 
                                            onChange={(e) => handleUpdate(plan.id, 'price_monthly', parseInt(e.target.value))}
                                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full text-white font-black focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">1 Year</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={plan.price_yearly || 0} 
                                            onChange={(e) => handleUpdate(plan.id, 'price_yearly', parseInt(e.target.value))}
                                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full text-white font-black focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">3 Years</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            value={plan.price_3_year || 0} 
                                            onChange={(e) => handleUpdate(plan.id, 'price_3_year', parseInt(e.target.value))}
                                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full text-white font-black focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Max Wallets</label>
                                    <input 
                                        type="number" 
                                        value={plan.max_wallets} 
                                        onChange={(e) => handleUpdate(plan.id, 'max_wallets', parseInt(e.target.value))}
                                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full text-white font-black"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Max Rules</label>
                                    <input 
                                        type="number" 
                                        value={plan.max_rules} 
                                        onChange={(e) => handleUpdate(plan.id, 'max_rules', parseInt(e.target.value))}
                                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full text-white font-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-3xl flex items-center gap-4">
                <AlertCircle className="text-blue-400" size={24}/>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Changes to plan prices will apply to new subscribers only. Existing active subscriptions will retain their original pricing until renewal.
                </p>
            </div>
        </div>
    );
};

const BroadcastManagement = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async () => {
        if (!title.trim() || !message.trim()) return alert('Please fill in both title and message');
        setLoading(true);
        try {
            await AdminService.broadcastNotification({ title, message });
            alert('Broadcast sent successfully to all users!');
            setTitle('');
            setMessage('');
        } catch (err) {
            alert('Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-black text-white">System Broadcasts</h3>
                    <p className="text-slate-500 text-sm font-medium">Send real-time alerts or promotional messages to all users.</p>
                </div>
            </div>

            <div className="bg-slate-950 border border-blue-500/30 rounded-[2rem] p-8 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Notification Title</label>
                        <input 
                            className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="e.g. Server Maintenance"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Notification Message</label>
                        <textarea 
                            className="bg-slate-950 border border-slate-800 rounded-xl p-4 w-full text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px]"
                            placeholder="Enter the broadcast message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleBroadcast} 
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-4 bg-orange-700 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : <><Send size={20}/> Send Broadcast</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CouponManagement = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: 0, discount_amount: 0, max_uses: 0, valid_until: '', applicable_plans: 'all' });

    const fetchCoupons = async () => {
        try {
            const res = await AdminService.getCoupons();
            setCoupons(res.data.coupons || []);
        } catch (err) {
            console.error('Failed to fetch coupons', err);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async () => {
        try {
            await AdminService.createCoupon(newCoupon);
            setShowCreate(false);
            fetchCoupons();
        } catch (err) {
            alert('Failed to create coupon');
        }
    };

    const handleDelete = async (id: number) => {
        if(!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await AdminService.deleteCoupon(id);
            fetchCoupons();
        } catch (err) {
            alert('Failed to delete coupon');
        }
    };

    return (
        <div className="p-10 space-y-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-black text-white">Promo Codes & Offers</h3>
                    <p className="text-slate-500 text-sm font-medium">Create and manage discount codes for checkout.</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-500 transition-all">
                    <Plus size={20}/> New Coupon
                </button>
            </div>

            {showCreate && (
                <div className="bg-slate-950 border border-blue-500/30 rounded-[2rem] p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Code</label>
                            <input className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} placeholder="e.g. DIWALI50"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">% Discount</label>
                            <input type="number" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.discount_percentage} onChange={e => setNewCoupon({...newCoupon, discount_percentage: parseInt(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Flat Discount (₹)</label>
                            <input type="number" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.discount_amount} onChange={e => setNewCoupon({...newCoupon, discount_amount: parseInt(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Applicable Term</label>
                            <select className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.applicable_plans} onChange={e => setNewCoupon({...newCoupon, applicable_plans: e.target.value})}>
                                <option value="all">All Durations</option>
                                <option value="monthly">Monthly Only</option>
                                <option value="yearly">Yearly Only</option>
                                <option value="3_year">3-Year Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Max Uses (0 = unlimited)</label>
                            <input type="number" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.max_uses} onChange={e => setNewCoupon({...newCoupon, max_uses: parseInt(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Valid Until</label>
                            <input type="date" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newCoupon.valid_until} onChange={e => setNewCoupon({...newCoupon, valid_until: e.target.value})}/>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleCreate} className="px-8 py-4 bg-orange-700 text-white rounded-xl font-black">Create Coupon</button>
                        <button onClick={() => setShowCreate(false)} className="px-8 py-4 bg-slate-800 text-slate-300 rounded-xl font-black">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 relative">
                        <button onClick={() => handleDelete(coupon.id)} className="absolute top-6 right-6 text-slate-600 hover:text-red-500"><X size={20}/></button>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-4 py-2 bg-green-500/10 text-green-400 font-black tracking-widest border border-green-500/20 rounded-xl text-lg">{coupon.code}</span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-400 font-bold">
                            <p>Discount: {coupon.discount_percentage > 0 ? `${coupon.discount_percentage}% OFF` : `₹${coupon.discount_amount} OFF`}</p>
                            <p>Applicable: {coupon.applicable_plans}</p>
                            <p>Uses: {coupon.uses} / {coupon.max_uses === 0 ? '∞' : coupon.max_uses}</p>
                            <p>Expires: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'Never'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newPromo, setNewPromo] = useState({ title: '', discount_percentage: 0, end_date: '', is_active: true });

    const fetchPromotions = async () => {
        try {
            const res = await PromotionService.getAll();
            setPromotions(res.data.promotions || []);
        } catch (err) {
            console.error('Failed to fetch promotions', err);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleCreate = async () => {
        if (!newPromo.title.trim() || !newPromo.end_date) {
            return alert('Title and end date are required');
        }
        try {
            await PromotionService.create(newPromo);
            setShowCreate(false);
            setNewPromo({ title: '', discount_percentage: 0, end_date: '', is_active: true });
            fetchPromotions();
        } catch (err) {
            alert('Failed to create promotion');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await PromotionService.delete(id);
            fetchPromotions();
        } catch (err) {
            alert('Failed to delete promotion');
        }
    };

    return (
        <div className="p-10 space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-black text-white">Flash Sales & Banners</h3>
                    <p className="text-slate-500 text-sm font-medium">Create time-limited discounts and header alert banners.</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-500 transition-all">
                    <Plus size={20}/> New Promotion
                </button>
            </div>

            {showCreate && (
                <div className="bg-slate-950 border border-blue-500/30 rounded-[2rem] p-8 mb-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Banner Title</label>
                            <input className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newPromo.title} onChange={e => setNewPromo({...newPromo, title: e.target.value})} placeholder="e.g. FATHER'S DAY FLASH SALE"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">% Discount</label>
                            <input type="number" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newPromo.discount_percentage} onChange={e => setNewPromo({...newPromo, discount_percentage: parseInt(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Ends On</label>
                            <input type="datetime-local" className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full text-white font-bold" value={newPromo.end_date} onChange={e => setNewPromo({...newPromo, end_date: e.target.value})}/>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleCreate} className="px-8 py-4 bg-orange-700 text-white rounded-xl font-black">Create Promotion</button>
                        <button onClick={() => setShowCreate(false)} className="px-8 py-4 bg-slate-800 text-slate-300 rounded-xl font-black">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map(promo => (
                    <div key={promo.id} className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 relative">
                        <button onClick={() => handleDelete(promo.id)} className="absolute top-6 right-6 text-slate-600 hover:text-red-500"><X size={20}/></button>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-4 py-2 bg-orange-500/10 text-orange-400 font-black tracking-widest border border-orange-500/20 rounded-xl text-base">{promo.title}</span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-400 font-bold">
                            <p>Discount: {promo.discount_percentage}% OFF</p>
                            <p>Ends: {new Date(promo.end_date).toLocaleString()}</p>
                            <p>Status: <span className={new Date(promo.end_date) > new Date() && promo.is_active ? 'text-green-500' : 'text-red-500'}>{new Date(promo.end_date) > new Date() && promo.is_active ? 'Active' : 'Expired'}</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
