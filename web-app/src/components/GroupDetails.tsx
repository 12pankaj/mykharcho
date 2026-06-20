import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GroupService } from '../api/shared/apiService';
import { ArrowLeft, UserPlus, Receipt, CreditCard, ArrowRight } from 'lucide-react';

const GroupDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('expenses');

    // Modals
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expDesc, setExpDesc] = useState('');
    const [expAmt, setExpAmt] = useState('');
    const [splitType, setSplitType] = useState('equal');
    const [customSplits, setCustomSplits] = useState<any>({});

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await GroupService.getGroupDetails(id as string);
            setGroup(res.data.group);
            setMembers(res.data.members);
            setExpenses(res.data.expenses);

            const setRes = await GroupService.getSettlements(id as string);
            setSettlements(setRes.data.settlements);
        } catch (error) {
            console.error("Failed to load group details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GroupService.addMember(id as string, newMemberEmail);
            setShowMemberModal(false);
            setNewMemberEmail('');
            fetchData();
        } catch (error) {
            alert("Could not add member. Make sure they are registered.");
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalAmount = parseFloat(expAmt);
        if (isNaN(totalAmount) || totalAmount <= 0) return;

        let splits = [];
        if (splitType === 'equal') {
            const splitAmt = (totalAmount / members.length).toFixed(2);
            splits = members.map(m => ({ user_id: m.id, amount_owed: splitAmt }));
        } else {
            let sum = 0;
            splits = members.map(m => {
                const amt = parseFloat(customSplits[m.id] || '0');
                sum += amt;
                return { user_id: m.id, amount_owed: amt };
            });
            if (Math.abs(sum - totalAmount) > 0.01) {
                alert("Custom splits must equal total amount");
                return;
            }
        }

        try {
            await GroupService.addExpense(id as string, {
                description: expDesc,
                amount: totalAmount,
                splits
            });
            setShowExpenseModal(false);
            setExpDesc('');
            setExpAmt('');
            setCustomSplits({});
            fetchData();
        } catch (error) {
            alert("Could not add expense");
        }
    };

    const handleSettle = async (settlement: any) => {
        if (window.confirm(`Record payment of ₹${settlement.amount} from ${settlement.from_name} to ${settlement.to_name}?`)) {
            try {
                await GroupService.settleDebt(id as string, {
                    paid_by: settlement.from,
                    paid_to: settlement.to,
                    amount: settlement.amount
                });
                fetchData();
            } catch (error) {
                alert("Error settling debt");
            }
        }
    };

    if (loading || !group) {
        return (
            <div className="flex justify-center p-20">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate('/groups')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white">{group.name}</h1>
                    <p className="text-slate-400">{group.description}</p>
                </div>
            </div>

            {/* Members Quick List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex -space-x-4">
                        {members.map(m => (
                            <div key={m.id} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#0f172a] flex items-center justify-center text-xs font-bold text-white shadow-lg" title={m.full_name}>
                                {m.full_name.substring(0, 2).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <span className="text-slate-400 font-medium">{members.length} Members</span>
                </div>
                <button 
                    onClick={() => setShowMemberModal(true)}
                    className="flex items-center space-x-2 text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors bg-orange-500/10 px-4 py-2 rounded-xl"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Member</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'expenses' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Expenses List
                </button>
                <button 
                    onClick={() => setActiveTab('balances')}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'balances' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Optimized Balances
                </button>
            </div>

            {/* Content */}
            {activeTab === 'expenses' ? (
                <div className="space-y-4">
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={() => setShowExpenseModal(true)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 font-bold"
                        >
                            <Receipt className="w-5 h-5" />
                            <span>Add Expense</span>
                        </button>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="text-center p-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                            <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400">No expenses recorded yet.</p>
                        </div>
                    ) : (
                        expenses.map(exp => (
                            <div key={exp.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                        <Receipt className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{exp.description}</h4>
                                        <p className="text-slate-400 text-sm">Paid by {exp.paid_by_name} • {new Date(exp.expense_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-xl font-black text-white">₹{parseFloat(exp.amount).toLocaleString()}</div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {settlements.length === 0 ? (
                        <div className="text-center p-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                            <CreditCard className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-green-400">All Settled Up!</h3>
                            <p className="text-slate-400 mt-1">No one owes anything in this group.</p>
                        </div>
                    ) : (
                        settlements.map((s, idx) => (
                            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 font-bold text-slate-300">
                                        {s.from_name.substring(0, 1)}
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
                                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 font-bold text-slate-300">
                                        {s.to_name.substring(0, 1)}
                                    </div>
                                    <div className="sm:ml-4">
                                        <p className="text-slate-300 text-sm sm:text-base">
                                            <strong className="text-white">{s.from_name}</strong> owes <strong className="text-white">{s.to_name}</strong>
                                        </p>
                                        <div className="text-2xl font-black text-red-400">₹{parseFloat(s.amount).toLocaleString()}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleSettle(s)}
                                    className="flex items-center space-x-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 px-4 py-2 rounded-lg transition-colors font-bold border border-green-500/20"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Settle</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modals */}
            {showMemberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] rounded-3xl w-full max-w-md border border-slate-800 p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Add Member</h3>
                        <form onSubmit={handleAddMember}>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white mb-4 outline-none focus:border-orange-500"
                                placeholder="User Email"
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                            />
                            <div className="flex space-x-3">
                                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] rounded-3xl w-full max-w-md border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Add Expense</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                placeholder="Description (e.g. Dinner)"
                                value={expDesc}
                                onChange={e => setExpDesc(e.target.value)}
                            />
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                placeholder="Total Amount"
                                value={expAmt}
                                onChange={e => setExpAmt(e.target.value)}
                            />

                            <div className="flex bg-slate-900 rounded-xl p-1">
                                <button type="button" onClick={() => setSplitType('equal')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${splitType === 'equal' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Equal Split</button>
                                <button type="button" onClick={() => setSplitType('custom')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${splitType === 'custom' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Unequal Split</button>
                            </div>

                            {splitType === 'custom' && (
                                <div className="space-y-3 mt-4 border-t border-slate-800 pt-4">
                                    <p className="text-xs text-slate-400 uppercase font-bold">Specify Amounts</p>
                                    {members.map(m => (
                                        <div key={m.id} className="flex justify-between items-center">
                                            <span className="text-slate-300 font-medium">{m.full_name}</span>
                                            <input
                                                type="number"
                                                className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-right"
                                                placeholder="0.00"
                                                value={customSplits[m.id] || ''}
                                                onChange={e => setCustomSplits({...customSplits, [m.id]: e.target.value})}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetails;
