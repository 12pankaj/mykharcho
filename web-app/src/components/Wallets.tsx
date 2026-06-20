import React, { useState, useEffect } from 'react';
import { WalletService, UserService } from '../api/shared/apiService';
import { formatCurrency } from '../api/shared/utils';
import { 
    Wallet, 
    Plus, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    X,
    Check,
    Shield
} from 'lucide-react';

const Wallets: React.FC = () => {
    const [wallets, setWallets] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', type: 'Cash', balance: 0 });
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchData = async () => {
        try {
            const [walletsRes, profileRes] = await Promise.all([
                WalletService.getAll(),
                UserService.getProfile()
            ]);
            setWallets(walletsRes.data);
            setProfile(profileRes.data);
        } catch (err) {
            showNotification('Failed to load wallets', 'error');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingWallet) {
                await WalletService.update(editingWallet.id, formData);
                showNotification('Wallet updated successfully!');
            } else {
                await WalletService.create(formData);
                showNotification('Wallet created successfully!');
            }
            setIsModalOpen(false);
            setEditingWallet(null);
            setFormData({ name: '', type: 'Cash', balance: 0 });
            fetchData();
        } catch (err) {
            showNotification('Operation failed', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this wallet? All associated transactions will be set to NULL.')) return;
        try {
            await WalletService.delete(id);
            showNotification('Wallet deleted!');
            fetchData();
        } catch (err) {
            showNotification('Failed to delete', 'error');
        }
    };

    const openEdit = (wallet: any) => {
        setEditingWallet(wallet);
        setFormData({ name: wallet.name, type: wallet.type, balance: wallet.balance });
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const getWalletIcon = (type: string) => {
        switch(type) {
            case 'Bank': return <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20"><Wallet size={24}/></div>;
            case 'Crypto': return <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20"><Wallet size={24}/></div>;
            default: return <div className="w-14 h-14 rounded-2xl bg-orange-600/10 text-orange-500 flex items-center justify-center border border-orange-600/20"><Wallet size={24}/></div>;
        }
    };

    const totalBalance = wallets.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
            {/* Custom Toast Notification */}
            {notification && (
                <div className={`fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-bold tracking-wide ${notification.type === 'success' ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                    {notification.type === 'success' ? <Check size={20}/> : <Shield size={20}/>}
                    {notification.msg}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Wallets & Accounts</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your liquidity across all institutions.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Liquidity</p>
                        <p className="text-2xl font-black text-white">{formatCurrency(totalBalance, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}</p>
                    </div>
                    {profile && (
                        <div className="flex flex-col items-end mr-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Usage</p>
                            <p className={`text-sm font-black ${wallets.length >= profile.max_wallets ? 'text-rose-500' : 'text-orange-500'}`}>
                                {wallets.length} / {profile.max_wallets}
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={() => {
                            if (profile && wallets.length >= profile.max_wallets) {
                                showNotification(`Limit reached! Your ${profile.plan_name} plan allows max ${profile.max_wallets} wallets.`, 'error');
                                return;
                            }
                            setEditingWallet(null);
                            setFormData({ name: '', type: 'Cash', balance: 0 });
                            setIsModalOpen(true);
                        }}
                        className={`font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl transition-all active:scale-[0.98] ${profile && wallets.length >= profile.max_wallets ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'}`}
                    >
                        <Plus size={22} strokeWidth={3}/>
                        Add Wallet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map(wallet => (
                    <div key={wallet.id} className="bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 relative group hover:border-blue-500/30 transition-all shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            {getWalletIcon(wallet.type)}
                            <div className="relative">
                                <button 
                                    onClick={() => setActiveMenu(activeMenu === wallet.id ? null : wallet.id)}
                                    className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
                                >
                                    <MoreVertical size={20}/>
                                </button>
                                {activeMenu === wallet.id && (
                                    <div className="absolute right-0 top-12 w-40 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <button onClick={() => openEdit(wallet)} className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 flex items-center gap-2 transition-colors">
                                            <Edit2 size={16}/> Edit
                                        </button>
                                        <button onClick={() => handleDelete(wallet.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500 hover:text-white flex items-center gap-2 transition-colors border-t border-slate-700">
                                            <Trash2 size={16}/> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-1 truncate pr-4">{wallet.name}</p>
                            <h3 className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {formatCurrency(wallet.balance, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}
                            </h3>
                            <div className="mt-4 inline-block px-3 py-1 rounded-lg bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-700">
                                {wallet.type}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <X size={20}/>
                        </button>
                        
                        <h2 className="text-2xl font-black text-white mb-8">{editingWallet ? 'Edit Wallet' : 'Create Wallet'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Wallet Name</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g., HDFC Savings, Cash Stash"
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                                    <select 
                                        value={formData.type} 
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold appearance-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank Account</option>
                                        <option value="Crypto">Crypto</option>
                                        <option value="Credit">Credit Card</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Balance</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.balance} 
                                        onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold tabular-nums" 
                                    />
                                </div>
                            </div>
                            
                            <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/30 active:scale-[0.98]">
                                {editingWallet ? 'Save Changes' : 'Create Wallet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallets;
