import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FinanceService, WalletService, AutomationService, UserService } from '../api/shared/apiService';
import { formatCurrency, exportToCSV, exportToExcel, exportToPDF } from '../api/shared/utils';
import { 
    ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, Check, Shield, Trash2, Repeat, Calendar, Download, Zap, Camera, Loader2
} from 'lucide-react';

const Transactions: React.FC = () => {
    const location = useLocation();
    const isIncomeView = location.pathname === '/income';
    
    const [transactions, setTransactions] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'History' | 'Automation'>('History');
    const [isAddTxOpen, setIsAddTxOpen] = useState(false);
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    // AI States
    const [aiText, setAiText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    // Form & Filter States
    const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '', walletId: '' });
    const [txForm, setTxForm] = useState({ walletId: '', amount: 0, type: isIncomeView ? 'Income' : 'Expense', category: '', notes: '', transaction_date: new Date().toISOString().split('T')[0] });
    const [ruleForm, setRuleForm] = useState({ walletId: '', name: '', amount: 0, type: isIncomeView ? 'Income' : 'Expense', category: '', frequency: 'Monthly', nextRunDate: '' });

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [txRes, rulesRes, walletsRes, profileRes] = await Promise.all([
                FinanceService.getAll(),
                AutomationService.getAll(),
                WalletService.getAll(),
                UserService.getProfile()
            ]);
            
            // Filter by current view type
            const filteredTx = txRes.data.filter((t: any) => t.type === (isIncomeView ? 'Income' : 'Expense'));
            const filteredRules = rulesRes.data.filter((r: any) => r.type === (isIncomeView ? 'Income' : 'Expense'));
            
            setTransactions(filteredTx);
            setRules(filteredRules);
            setWallets(walletsRes.data);
            setProfile(profileRes.data);
            
            if (walletsRes.data.length > 0) {
                setTxForm(prev => ({ ...prev, walletId: walletsRes.data[0].id }));
                setRuleForm(prev => ({ ...prev, walletId: walletsRes.data[0].id }));
            }
        } catch (err) {
            showNotification('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTxForm(prev => ({ ...prev, type: isIncomeView ? 'Income' : 'Expense' }));
        setRuleForm(prev => ({ ...prev, type: isIncomeView ? 'Income' : 'Expense' }));
        setFilters({ startDate: '', endDate: '', category: '', walletId: '' });
        loadData();
    }, [isIncomeView]);

    const uniqueCategories = Array.from(new Set(transactions.map(tx => tx.category).filter(Boolean)));
    
    const filteredTransactions = transactions.filter(tx => {
        if (filters.startDate && new Date(tx.transaction_date) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(tx.transaction_date) > new Date(filters.endDate + 'T23:59:59')) return false;
        if (filters.category && tx.category !== filters.category) return false;
        if (filters.walletId && tx.wallet_id !== parseInt(filters.walletId)) return false;
        return true;
    });

    const handleAddTx = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTx) {
                await FinanceService.update(editingTx.id, txForm);
                showNotification('Transaction updated!');
            } else {
                const res = await FinanceService.add(txForm);
                showNotification('Transaction added successfully!');
                if (res.data && res.data.trialUnlocked) {
                    localStorage.setItem('trialUnlocked', 'true');
                    showNotification('🔥 7-Day Streak! Free Elite Trial Unlocked!', 'success');
                }
            }
            setIsAddTxOpen(false);
            setEditingTx(null);
            setTxForm(prev => ({ ...prev, amount: 0, category: '', notes: '', transaction_date: new Date().toISOString().split('T')[0] }));
            loadData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to process transaction', 'error');
        }
    };

    const handleDeleteTx = async (id: string) => {
        if (!window.confirm('Delete this transaction? Wallet balance will be reversed.')) return;
        try {
            await FinanceService.delete(id);
            showNotification('Transaction deleted');
            loadData();
        } catch (err: any) {
            showNotification('Failed to delete', 'error');
        }
    };

    const handleAiParse = async (payload: { text?: string, imageBase64?: string }) => {
        setIsParsing(true);
        try {
            const res = await FinanceService.parseAi(payload);
            if (res.data.success) {
                const parsed = res.data.data;
                
                // Try to find matching wallet if AI returned a walletName
                let matchedWalletId = undefined;
                if (parsed.walletName) {
                    const searchName = parsed.walletName.toLowerCase();
                    const matchedWallet = wallets.find(w => 
                        w.name.toLowerCase().includes(searchName) || searchName.includes(w.name.toLowerCase())
                    );
                    if (matchedWallet) {
                        matchedWalletId = matchedWallet.id;
                    }
                }

                setTxForm(prev => ({
                    ...prev,
                    amount: parsed.amount || 0,
                    category: parsed.category || '',
                    notes: parsed.description || '',
                    transaction_date: parsed.date || new Date().toISOString().split('T')[0],
                    type: parsed.type === 'Income' ? 'Income' : 'Expense',
                    ...(matchedWalletId ? { walletId: matchedWalletId } : {})
                }));
                showNotification('AI parsed successfully!');
                setAiText('');
            } else {
                showNotification(res.data.message || 'Parsing failed', 'error');
            }
        } catch (err: any) {
            showNotification('Could not parse transaction', 'error');
        } finally {
            setIsParsing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleAiParse({ imageBase64: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRule) {
                await AutomationService.update(editingRule.id, ruleForm);
                showNotification('Automation Rule updated!');
            } else {
                await AutomationService.create(ruleForm);
                showNotification('Automation Rule active!');
            }
            setIsAddRuleOpen(false);
            setEditingRule(null);
            setRuleForm(prev => ({ ...prev, name: '', amount: 0, category: '', nextRunDate: '' }));
            loadData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to process rule', 'error');
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!window.confirm('Delete this automation rule?')) return;
        try {
            await AutomationService.delete(id);
            showNotification('Rule deleted');
            loadData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to delete rule', 'error');
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
            {notification && (
                <div className={`fixed bottom-10 right-10 left-10 md:left-auto z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-bold tracking-wide ${notification.type === 'success' ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                    {notification.type === 'success' ? <Check size={20}/> : <Shield size={20}/>}
                    {notification.msg}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{isIncomeView ? 'Income Streams' : 'Expense Tracking'}</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base mt-2 md:mt-0">Manage your cash flow and setup automation.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="bg-slate-950 border border-slate-800 p-1 rounded-2xl flex flex-1">
                        <button onClick={() => setActiveTab('History')} className={`flex-1 px-4 py-3 md:px-6 rounded-xl font-bold text-sm transition-all text-center ${activeTab === 'History' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>History</button>
                        <button onClick={() => setActiveTab('Automation')} className={`flex-1 px-4 py-3 md:px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'Automation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Repeat size={16}/> Auto</button>
                    </div>
                    <button 
                        onClick={() => activeTab === 'History' ? setIsAddTxOpen(true) : setIsAddRuleOpen(true)}
                        className={`flex-1 justify-center text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl transition-all active:scale-[0.98] ${activeTab === 'History' ? (isIncomeView ? 'bg-orange-700 hover:bg-orange-600 shadow-orange-600/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30') : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'}`}
                    >
                        <Plus size={22} strokeWidth={3}/>
                        {activeTab === 'History' ? 'New Record' : 'New Rule'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'History' ? (
                <div className="space-y-6">
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col md:flex-row flex-wrap gap-4 md:items-end shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-2 md:flex flex-1 gap-4">
                            <div className="w-full">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">From Date</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">To Date</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:flex flex-1 gap-4">
                            <div className="w-full">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Category</label>
                                <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm appearance-none">
                                    <option value="">All Categories</option>
                                    {uniqueCategories.map((cat: any) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Wallet</label>
                                <select value={filters.walletId} onChange={e => setFilters({...filters, walletId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm appearance-none">
                                    <option value="">All Wallets</option>
                                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <button onClick={() => setFilters({ startDate: '', endDate: '', category: '', walletId: '' })} className="p-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Reset Filters">
                                <RefreshCw size={20}/>
                            </button>
                            <button onClick={() => exportToCSV(filteredTransactions, `${isIncomeView ? 'Income' : 'Expense'}_Export_${new Date().toISOString().split('T')[0]}.csv`)} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all shadow-xl font-black text-xs flex items-center gap-2 whitespace-nowrap">
                                <Download size={16} strokeWidth={3}/> CSV
                            </button>
                            <button onClick={() => exportToExcel(filteredTransactions, `${isIncomeView ? 'Income' : 'Expense'}_Export_${new Date().toISOString().split('T')[0]}.xlsx`)} className="px-4 py-3 bg-orange-700/20 text-orange-500 hover:bg-orange-700 hover:text-white rounded-xl transition-all shadow-xl font-black text-xs flex items-center gap-2 border border-orange-600/20 whitespace-nowrap">
                                <Download size={16} strokeWidth={3}/> Excel
                            </button>
                            <button onClick={() => exportToPDF(filteredTransactions, `${isIncomeView ? 'Income' : 'Expense'}_Export_${new Date().toISOString().split('T')[0]}.pdf`)} className="px-4 py-3 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-xl font-black text-xs flex items-center gap-2 border border-rose-500/20 whitespace-nowrap">
                                <Download size={16} strokeWidth={3}/> PDF
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-4 md:p-10 shadow-2xl relative overflow-hidden">
                        <div className="space-y-4">
                            {filteredTransactions.map(tx => (
                                <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-slate-700 transition-colors group gap-4">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${tx.type === 'Income' ? 'bg-orange-600/10 text-orange-500' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {tx.type === 'Income' ? <ArrowDownLeft size={24}/> : <ArrowUpRight size={24}/>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-white text-base md:text-lg truncate">{tx.category || 'Uncategorized'}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                <span>{new Date(tx.transaction_date).toLocaleDateString()}</span>
                                                {tx.is_automated && <span className="text-indigo-400 flex items-center gap-1"><Repeat size={12}/> Auto</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-6 flex-1 sm:flex-none">
                                        <p className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${tx.type === 'Income' ? 'text-orange-500' : 'text-slate-300'}`}>
                                            {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}
                                        </p>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => {
                                                    setEditingTx(tx);
                                                    setTxForm({ walletId: tx.wallet_id.toString(), amount: tx.amount, type: tx.type, category: tx.category, notes: tx.notes || '', transaction_date: tx.transaction_date || new Date().toISOString().split('T')[0] });
                                                    setIsAddTxOpen(true);
                                                }}
                                                className="p-2 text-slate-500 hover:text-blue-400 bg-slate-950 rounded-xl transition-all"
                                            >
                                                <RefreshCw size={18}/>
                                            </button>
                                            <button onClick={() => handleDeleteTx(tx.id)} className="p-2 text-slate-500 hover:text-rose-500 bg-slate-950 rounded-xl transition-all">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        {filteredTransactions.length === 0 && !loading && (
                            <p className="text-slate-500 text-center py-20 font-bold">No records found matching filters.</p>
                        )}
                        {loading && <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-500" size={32}/></div>}
                    </div>
                </div>
                </div>
            ) : (
                <div className="bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-4 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                    <div className="space-y-4 md:space-y-6 relative z-10">
                        {rules.map(rule => (
                            <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-slate-700 transition-colors group gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg md:text-xl font-black text-white">{rule.name}</h3>
                                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-indigo-500/20">{rule.frequency}</span>
                                    </div>
                                    <p className="text-slate-500 text-xs md:text-sm font-bold flex items-center gap-2">
                                        <Calendar size={14}/> Next Run: {new Date(rule.next_run_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                    <p className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tighter mr-3">
                                        {formatCurrency(rule.amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setEditingRule(rule);
                                            setRuleForm({ walletId: rule.wallet_id.toString(), name: rule.name, amount: rule.amount, type: rule.type, category: rule.category, frequency: rule.frequency, nextRunDate: rule.next_run_date.split('T')[0] });
                                            setIsAddRuleOpen(true);
                                        }}
                                        className="p-3 text-slate-500 hover:text-blue-400 bg-slate-950 hover:bg-blue-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100"
                                    >
                                        <Repeat size={20}/>
                                    </button>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="p-3 text-slate-500 hover:text-rose-500 bg-slate-950 hover:bg-rose-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100">
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="text-center py-20 border-2 border-slate-800 border-dashed rounded-[2rem]">
                                <Repeat size={32} className="mx-auto text-slate-600 mb-4"/>
                                <p className="text-slate-500 font-bold">No automation rules configured.</p>
                                <p className="text-sm text-slate-600 mt-2">Setup rules to automatically add transactions for rent, salaries, or subscriptions.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isAddTxOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl animate-in zoom-in-95 duration-300 my-8">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                            Record {isIncomeView ? 'Income' : 'Expense'}
                        </h2>

                        {/* AI Smart Input Area */}
                        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 mb-6 relative">
                            {isParsing && (
                                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin text-indigo-400" size={24} />
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                    <Zap size={12}/> Smart AI Add
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={aiText} 
                                        onChange={e => setAiText(e.target.value)} 
                                        placeholder="e.g. Spent 500 on dinner..." 
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 transition-colors"
                                    />
                                    <button 
                                        onClick={() => handleAiParse({ text: aiText })}
                                        disabled={!aiText.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition-all"
                                    >
                                        <Zap size={18}/>
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-xl py-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                        <Camera size={16}/> <span className="text-sm font-bold">Scan Receipt Image</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleAddTx} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Wallet</label>
                                    <select required value={txForm.walletId} onChange={e => setTxForm({...txForm, walletId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                        <option value="" disabled>Select Wallet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                                    <input type="number" required value={txForm.amount} onChange={e => setTxForm({...txForm, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                    <input type="text" placeholder="Category (e.g., Salary, Rent)" required value={txForm.category} onChange={e => setTxForm({...txForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Transaction Date</label>
                                    <input type="date" required value={txForm.transaction_date} onChange={e => setTxForm({...txForm, transaction_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>
                            </div>
                            <textarea placeholder="Optional notes" value={txForm.notes} onChange={e => setTxForm({...txForm, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold h-24 resize-none" />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAddTxOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" className={`flex-1 text-white font-black py-5 rounded-2xl transition-all shadow-xl ${isIncomeView ? 'bg-orange-700 hover:bg-orange-600 shadow-orange-600/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30'}`}>Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddRuleOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-white mb-8">Setup Auto-Record</h2>
                        <form onSubmit={handleAddRule} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rule Name</label>
                                <input type="text" placeholder="Rule Name (e.g., Netflix Subscription)" required value={ruleForm.name} onChange={e => setRuleForm({...ruleForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Frequency</label>
                                    <select value={ruleForm.frequency} onChange={e => setRuleForm({...ruleForm, frequency: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                                    <input type="number" required value={ruleForm.amount} onChange={e => setRuleForm({...ruleForm, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deduct From</label>
                                    <select required value={ruleForm.walletId} onChange={e => setRuleForm({...ruleForm, walletId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                        <option value="" disabled>Select Wallet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Next Run Date</label>
                                    <input type="date" required value={ruleForm.nextRunDate} onChange={e => setRuleForm({...ruleForm, nextRunDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-sm" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                <input type="text" placeholder="Category (e.g. Subscriptions, Salary)" required value={ruleForm.category} onChange={e => setRuleForm({...ruleForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                            </div>
                            
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAddRuleOpen(false)} className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-4 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 text-white font-black py-4 rounded-xl transition-all shadow-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-500/10">Activate Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
