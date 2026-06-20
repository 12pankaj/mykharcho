import React, { useState, useEffect } from 'react';
import { LoanService, WalletService, UserService, FinanceService } from '../api/shared/apiService';
import { formatCurrency, exportLoanStatementToPDF } from '../api/shared/utils';
import { 
    Users, Plus, Trash2, Check, Shield, FileText, Calendar, CheckCircle2, Circle, AlertCircle, X, Download, RefreshCw
} from 'lucide-react';

const Loans: React.FC = () => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [installments, setInstallments] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    
    // Derived state for history
    const loanTransactions = selectedContract ? allTransactions.filter(tx => tx.notes && tx.notes.includes(`Contract #${selectedContract.id.substring(0,8)}`)) : [];
    
    // UI State
    const [isAddContractOpen, setIsAddContractOpen] = useState(false);
    const [isAddInstallmentOpen, setIsAddInstallmentOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<any>(null);
    const [editingInstallment, setEditingInstallment] = useState<any>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
    const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    // Form States
    const [contractForm, setContractForm] = useState({ partyName: '', partyPhone: '', role: 'Lender', totalPrincipal: 0, interestRate: 0, totalInstallments: 0, startDate: '', walletId: '' });
    const [installmentForm, setInstallmentForm] = useState({ dueDate: '', emiAmount: 0 });
    const [payForm, setPayForm] = useState({ walletId: '', paidAmount: 0 });

    const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadData = async () => {
        try {
            const [contractsRes, walletsRes, profileRes, txRes] = await Promise.all([
                LoanService.getContracts(),
                WalletService.getAll(),
                UserService.getProfile(),
                FinanceService.getAll()
            ]);
            setContracts(contractsRes.data);
            setWallets(walletsRes.data);
            setProfile(profileRes.data);
            setAllTransactions(txRes.data);
            if (walletsRes.data.length > 0) {
                setPayForm(prev => ({ ...prev, walletId: walletsRes.data[0].id }));
                setContractForm(prev => ({ ...prev, walletId: walletsRes.data[0].id }));
            }
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to load data', 'error');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadInstallments = async (contractId: number) => {
        try {
            const res = await LoanService.getInstallments(contractId);
            setInstallments(res.data);
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to load installments', 'error');
        }
    };

    const handleContractClick = (contract: any) => {
        setSelectedContract(contract);
        loadInstallments(contract.id);
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContract) {
                await LoanService.updateContract(editingContract.id, contractForm);
                showNotification('Contract updated successfully!');
            } else {
                await LoanService.createContract(contractForm);
                showNotification('Contract created successfully!');
            }
            setIsAddContractOpen(false);
            setEditingContract(null);
            setContractForm({ partyName: '', partyPhone: '', role: 'Lender', totalPrincipal: 0, interestRate: 0, totalInstallments: 0, startDate: '', walletId: wallets.length > 0 ? wallets[0].id : '' });
            loadData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to process contract', 'error');
        }
    };

    const handleDeleteContract = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this contract? All related installments will be lost.')) return;
        try {
            await LoanService.deleteContract(id);
            showNotification('Contract deleted');
            if (selectedContract?.id === id) setSelectedContract(null);
            loadData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to delete contract', 'error');
        }
    };

    const handleAddInstallment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingInstallment) {
                await LoanService.updateInstallment(editingInstallment.id, installmentForm);
                showNotification('Installment updated!');
            } else {
                await LoanService.addInstallment(selectedContract.id, installmentForm);
                showNotification('Installment added!');
            }
            setIsAddInstallmentOpen(false);
            setEditingInstallment(null);
            setInstallmentForm({ dueDate: '', emiAmount: 0 });
            loadInstallments(selectedContract.id);
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Failed to process installment', 'error');
        }
    };

    const handleDeleteInstallment = async (id: string) => {
        if (!window.confirm('Delete this installment?')) return;
        try {
            await LoanService.deleteInstallment(id);
            showNotification('Installment deleted');
            loadInstallments(selectedContract.id);
        } catch (err: any) {
            showNotification('Failed to delete', 'error');
        }
    };

    const handlePayInstallment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await LoanService.payInstallment(selectedInstallment.id, payForm);
            showNotification('Payment successful!');
            setIsPayModalOpen(false);
            loadInstallments(selectedContract.id);
            loadData(); // Refresh wallets and contracts
        } catch (err: any) {
            showNotification(err.response?.data?.message || err.message || 'Payment failed. Check your wallet balance.', 'error');
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
            {notification && (
                <div className={`fixed bottom-10 right-10 left-10 md:left-auto z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-bold tracking-wide ${notification.type === 'success' ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                    {notification.type === 'success' ? <Check size={20}/> : <Shield size={20}/>}
                    {notification.msg}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Loan Contracts</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base mt-2 md:mt-0">Manage your lending and borrowing agreements.</p>
                </div>
                <button 
                    onClick={() => setIsAddContractOpen(true)}
                    className="w-full md:w-auto justify-center bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98]"
                >
                    <Plus size={22} strokeWidth={3}/>
                    New Contract
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                {/* Contracts List */}
                <div className="w-full lg:w-1/3 space-y-4">
                    {contracts.map(contract => (
                        <div 
                            key={contract.id} 
                            onClick={() => handleContractClick(contract)}
                            className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative ${selectedContract?.id === contract.id ? 'bg-blue-600/10 border-blue-500 shadow-xl shadow-blue-900/20' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}
                        >
                            <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setEditingContract(contract);
                                        setContractForm({ partyName: contract.party_name, partyPhone: contract.party_phone, role: contract.role, totalPrincipal: contract.total_principal, interestRate: contract.interest_rate, totalInstallments: 0, startDate: contract.start_date.split('T')[0], walletId: '' });
                                        setIsAddContractOpen(true);
                                    }}
                                    className="text-slate-500 hover:text-blue-400"
                                >
                                    <RefreshCw size={18}/>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteContract(contract.id); }}
                                    className="text-slate-500 hover:text-rose-500"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${contract.role === 'Lender' ? 'bg-orange-600/10 text-orange-500 border-orange-600/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    <Users size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-white leading-tight">{contract.party_name}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{contract.role}</p>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white tabular-nums tracking-tighter">
                                {formatCurrency(contract.total_amount || contract.total_principal, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mt-1">Principal: {formatCurrency(contract.total_principal, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}</p>
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Calendar size={14}/>
                                {new Date(contract.start_date).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                    {contracts.length === 0 && (
                        <div className="text-center py-20 border border-slate-800 border-dashed rounded-[2rem]">
                            <FileText size={32} className="mx-auto text-slate-600 mb-4"/>
                            <p className="text-slate-500 font-bold">No active contracts</p>
                        </div>
                    )}
                </div>

                {/* Installments Detail View */}
                <div className="flex-1">
                    {selectedContract ? (
                        <div className="bg-slate-950/50 border border-slate-800 rounded-3xl md:rounded-[3rem] p-4 md:p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 md:mb-10 relative z-10">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-white">{selectedContract.party_name} - Installments</h2>
                                    <p className="text-slate-500 font-medium text-sm md:text-base mt-1">Total Amount: {formatCurrency(selectedContract.total_amount || selectedContract.total_principal, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}</p>
                                </div>
                                <div className="flex gap-3 items-center w-full sm:w-auto relative z-10 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                                    <button 
                                        onClick={() => exportLoanStatementToPDF(selectedContract, installments, loanTransactions, profile?.preferred_currency)}
                                        className="whitespace-nowrap bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold py-3 px-4 rounded-2xl flex items-center gap-2 transition-all border border-indigo-500/20 text-sm shadow-xl"
                                    >
                                        <Download size={18} strokeWidth={3}/> Statement
                                    </button>
                                    <button 
                                        onClick={() => setIsAddInstallmentOpen(true)}
                                        className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all text-sm"
                                    >
                                        <Plus size={18} strokeWidth={3}/> Add EMI
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {installments.map(emi => (
                                    <div key={emi.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl hover:border-slate-700 transition-colors gap-4">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="flex-shrink-0">
                                                {emi.status === 'Paid' ? (
                                                    <CheckCircle2 size={28} className="text-orange-600"/>
                                                ) : emi.status === 'Partial' ? (
                                                    <AlertCircle size={28} className="text-amber-500"/>
                                                ) : (
                                                    <Circle size={28} className="text-slate-700"/>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">Due {new Date(emi.due_date).toLocaleDateString()}</p>
                                                <div className="flex flex-wrap items-end gap-2">
                                                    <h4 className="text-lg md:text-xl font-black text-white truncate">{formatCurrency(emi.emi_amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}</h4>
                                                    {parseFloat(emi.paid_amount) > 0 && (
                                                        <span className="text-[10px] md:text-xs font-bold text-slate-500 mb-1">(Paid: {formatCurrency(emi.paid_amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {emi.status !== 'Paid' && (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedInstallment(emi);
                                                        setPayForm(prev => ({ ...prev, paidAmount: parseFloat(emi.emi_amount) - parseFloat(emi.paid_amount) }));
                                                        setIsPayModalOpen(true);
                                                    }}
                                                    className="flex-1 sm:flex-none bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg text-sm"
                                                >
                                                    {selectedContract.role === 'Lender' ? 'Receive Now' : 'Pay Now'}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={() => {
                                                        setEditingInstallment(emi);
                                                        setInstallmentForm({ dueDate: emi.due_date.split('T')[0], emiAmount: emi.emi_amount });
                                                        setIsAddInstallmentOpen(true);
                                                    }}
                                                    className="p-3 text-slate-500 hover:text-blue-400 bg-slate-950 rounded-xl"
                                                >
                                                    <RefreshCw size={16}/>
                                                </button>
                                                <button onClick={() => handleDeleteInstallment(emi.id)} className="p-3 text-slate-500 hover:text-rose-500 bg-slate-950 rounded-xl">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {installments.length === 0 && (
                                    <p className="text-slate-500 text-center py-10 font-bold">No installments created yet.</p>
                                )}
                            </div>

                            <div className="mt-8 md:mt-10 border-t border-slate-800 pt-6 md:pt-8 relative z-10">
                                <h3 className="text-lg md:text-xl font-black text-white mb-4 md:mb-6">Payment History</h3>
                                <div className="space-y-4">
                                    {loanTransactions.map(tx => (
                                        <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl gap-2 md:gap-0">
                                            <div>
                                                <p className="font-bold text-white text-xs md:text-sm">{tx.notes}</p>
                                                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">{new Date(tx.transaction_date).toLocaleDateString()} | Wallet: {wallets.find(w => w.id === tx.wallet_id)?.name || 'Unknown'}</p>
                                            </div>
                                            <p className={`font-black tabular-nums text-left sm:text-right ${tx.type === 'Income' ? 'text-orange-500' : 'text-slate-300'}`}>
                                                {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.preferred_currency || 'INR', profile?.country_code || 'IN')}
                                            </p>
                                        </div>
                                    ))}
                                    {loanTransactions.length === 0 && (
                                        <p className="text-slate-500 text-center py-4 font-bold text-sm">No payment history found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center border-2 border-slate-800 border-dashed rounded-[3rem] bg-slate-950/20">
                            <p className="text-slate-500 font-bold">Select a contract to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals will be added here based on states */}
            {isAddContractOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsAddContractOpen(false)} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl"><X size={20}/></button>
                        <h2 className="text-2xl font-black text-white mb-8">Create Loan Contract</h2>
                        <form onSubmit={handleCreateContract} className="space-y-6">
                            <input type="text" placeholder="Party Name" required value={contractForm.partyName} onChange={e => setContractForm({...contractForm, partyName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                            <select value={contractForm.role} onChange={e => setContractForm({...contractForm, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                <option value="Lender">I gave money (Lender)</option>
                                <option value="Borrower">I took money (Borrower)</option>
                            </select>
                            <input type="number" min="0.01" step="0.01" placeholder="Total Principal Amount" required value={contractForm.totalPrincipal} onChange={e => setContractForm({...contractForm, totalPrincipal: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Flat Interest Rate (%)</label>
                                    <input type="number" min="0" step="0.01" placeholder="e.g., 5" value={contractForm.interestRate} onChange={e => setContractForm({...contractForm, interestRate: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Total Installments (Months)</label>
                                     <input type="number" min="0" step="1" placeholder="e.g., 12" value={contractForm.totalInstallments} onChange={e => setContractForm({...contractForm, totalInstallments: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                                     {contractForm.totalInstallments > 0 && profile && !profile.can_auto_emi && (
                                         <p className="text-[10px] text-amber-500 font-bold px-1 flex items-center gap-1">
                                             <Shield size={12}/> Auto-EMI is a Pro feature
                                         </p>
                                     )}
                                 </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Wallet for Principal</label>
                                    <select value={contractForm.walletId} onChange={e => setContractForm({...contractForm, walletId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                        <option value="">None (Paper Trail Only)</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.balance})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                    <input type="date" required value={contractForm.startDate} onChange={e => setContractForm({...contractForm, startDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={contractForm.totalInstallments > 0 && profile && !profile.can_auto_emi}
                                className={`w-full font-black py-5 rounded-2xl transition-all ${contractForm.totalInstallments > 0 && profile && !profile.can_auto_emi ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/30'}`}
                             >
                                {contractForm.totalInstallments > 0 && profile && !profile.can_auto_emi ? 'Upgrade for Auto-EMI' : 'Create & Auto-Generate EMIs'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAddInstallmentOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsAddInstallmentOpen(false)} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl"><X size={20}/></button>
                        <h2 className="text-2xl font-black text-white mb-8">Add EMI</h2>
                        <form onSubmit={handleAddInstallment} className="space-y-6">
                            <input type="date" required value={installmentForm.dueDate} onChange={e => setInstallmentForm({...installmentForm, dueDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold" />
                            <input type="number" min="0.01" step="0.01" placeholder="EMI Amount" required value={installmentForm.emiAmount} onChange={e => setInstallmentForm({...installmentForm, emiAmount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl">Save Installment</button>
                        </form>
                    </div>
                </div>
            )}

            {isPayModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsPayModalOpen(false)} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl"><X size={20}/></button>
                        <h2 className="text-2xl font-black text-white mb-8">
                            {selectedContract?.role === 'Lender' ? 'Receive EMI' : 'Pay EMI'}
                        </h2>
                        <form onSubmit={handlePayInstallment} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Wallet</label>
                                <select required value={payForm.walletId} onChange={e => setPayForm({...payForm, walletId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none">
                                    <option value="" disabled>Select Wallet</option>
                                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.balance})</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    {selectedContract?.role === 'Lender' ? 'Received Amount' : 'Payment Amount'}
                                </label>
                                <input type="number" min="0.01" step="0.01" required max={parseFloat(selectedInstallment?.emi_amount) - parseFloat(selectedInstallment?.paid_amount)} value={payForm.paidAmount} onChange={e => setPayForm({...payForm, paidAmount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold tabular-nums" />
                            </div>
                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-600/20">
                                {selectedContract?.role === 'Lender' ? 'Confirm Receipt' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loans;
