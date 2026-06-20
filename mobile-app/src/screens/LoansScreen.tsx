import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { Users, FileText, Clock, Plus, X, CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';
import { LoanService, WalletService, TransactionService } from '../api/apiService';
import { TextInput } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';

export default function LoansScreen() {
    const navigation = useNavigation<any>();
    const [contracts, setContracts] = useState<any[]>([]);
    const [pendingEMIs, setPendingEMIs] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Active Contracts');

    // Removed form states for new contract

    // State for View EMIs
    const [isViewEMIsVisible, setIsViewEMIsVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [contractEMIs, setContractEMIs] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [contractPaymentHistory, setContractPaymentHistory] = useState<any[]>([]);

    // State for Add EMI
    const [isAddEMIVisible, setIsAddEMIVisible] = useState(false);
    const [newEmiDate, setNewEmiDate] = useState('');
    const [newEmiAmount, setNewEmiAmount] = useState('');

    // State for Pay EMI
    const [isPayVisible, setIsPayVisible] = useState(false);
    const [selectedEMI, setSelectedEMI] = useState<any>(null);
    const [payAmount, setPayAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [loansRes, walletsRes, txRes] = await Promise.all([
                LoanService.getContracts(),
                WalletService.getAll(),
                TransactionService.getAll()
            ]);
            
            const loansData = loansRes.data;
            setContracts(loansData);
            setWallets(walletsRes.data);
            setAllTransactions(txRes.data);
            if (walletsRes.data.length > 0) {
                setSelectedWalletId(walletsRes.data[0].id);
            }

            // Fetch pending EMIs
            let allPending: any[] = [];
            for (const loan of loansData) {
                const instRes = await LoanService.getInstallments(loan.id);
                const unpaid = instRes.data.filter((emi: any) => emi.status !== 'Paid');
                unpaid.forEach((emi: any) => {
                    emi.contract = loan;
                    allPending.push(emi);
                });
            }
            allPending.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
            setPendingEMIs(allPending);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const openCreateLoan = () => {
        navigation.navigate('AddLoan', { refreshCallback: fetchData });
    };

    const handleViewEMIs = async (contract: any) => {
        setSelectedContract(contract);
        try {
            const res = await LoanService.getInstallments(contract.id);
            setContractEMIs(res.data);
            
            const history = allTransactions.filter((tx: any) => tx.notes && tx.notes.includes(`Contract #${contract.id.substring(0,8)}`));
            setContractPaymentHistory(history);
            
            setIsViewEMIsVisible(true);
        } catch (err) {
            Alert.alert("Error", "Could not fetch EMIs");
        }
    };

    const handleExportPDF = async (contract: any) => {
        try {
            const instRes = await LoanService.getInstallments(contract.id);
            const installments = instRes.data;

            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: sans-serif; padding: 20px; color: #333; }
                            h1 { color: #2563eb; margin-bottom: 5px; }
                            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                            th { background-color: #f8fafc; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Loan Statement</h1>
                            <p><strong>Party:</strong> ${contract.party_name}</p>
                            <p><strong>Role:</strong> ${contract.role}</p>
                            <p><strong>Principal:</strong> ₹${contract.total_principal}</p>
                            <p><strong>Interest Rate:</strong> ${contract.interest_rate}%</p>
                            <p><strong>Total Amount:</strong> ₹${contract.total_amount}</p>
                        </div>
                        <h2>Installments Schedule</h2>
                        <table>
                            <tr>
                                <th>Due Date</th>
                                <th>EMI Amount</th>
                                <th>Amount Paid</th>
                                <th>Status</th>
                            </tr>
                            ${installments.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No installments found.</td></tr>' : ''}
                            ${installments.map((emi: any) => `
                                <tr>
                                    <td>${new Date(emi.due_date).toLocaleDateString()}</td>
                                    <td>₹${parseFloat(emi.emi_amount).toFixed(2)}</td>
                                    <td>₹${parseFloat(emi.paid_amount || 0).toFixed(2)}</td>
                                    <td><strong>${emi.status}</strong></td>
                                </tr>
                            `).join('')}
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (err) {
            Alert.alert("Error", "Failed to generate PDF");
        }
    };

    const handleSaveEMI = async () => {
        if (!newEmiDate || !newEmiAmount) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        try {
            await LoanService.addInstallment(selectedContract.id, {
                dueDate: newEmiDate,
                emiAmount: parseFloat(newEmiAmount)
            });
            setIsAddEMIVisible(false);
            setNewEmiDate('');
            setNewEmiAmount('');
            await fetchData();
            handleViewEMIs(selectedContract);
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add EMI");
        }
    };

    const handleOpenPay = (emi: any, contract: any) => {
        setIsViewEMIsVisible(false);
        setTimeout(() => {
            navigation.navigate('LoanPayment', {
                emi,
                contract,
                wallets,
                refreshCallback: fetchData
            });
        }, 300);
    };

    const renderActiveContracts = () => {
        if (contracts.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Clock color={Colors.textSecondary} size={32} />
                    <Text style={styles.emptyText}>No active loans</Text>
                </View>
            );
        }
        return contracts.map((contract: any) => {
            const isLender = contract.type === 'Money Given' || contract.role === 'Lender';
            return (
            <GlassCard key={contract.id} style={styles.contractCard} intensity="heavy">
                <View style={styles.cardHeader}>
                    <View style={[styles.userIcon, { backgroundColor: isLender ? 'rgba(234, 88, 12, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                        <Users color={isLender ? '#ea580c' : '#f43f5e'} size={24} />
                    </View>
                    <View style={[styles.badge, { backgroundColor: isLender ? 'rgba(234, 88, 12, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                        <Text style={[styles.badgeText, { color: isLender ? '#ea580c' : '#f43f5e' }]}>
                            {isLender ? 'LENDER' : 'BORROWER'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.partyName}>{contract.party_name}</Text>
                <Text style={styles.amount}>₹{parseFloat(contract.total_amount || contract.total_principal).toLocaleString()}</Text>
                <Text style={{color: Colors.textSecondary, fontSize: 12, marginBottom: 16, marginTop: -16, fontWeight: 'bold'}}>Principal: ₹{parseFloat(contract.total_principal).toLocaleString()}</Text>
                
                <View style={styles.detailsRow}>
                    <View>
                        <Text style={styles.detailLabel}>Interest</Text>
                        <Text style={styles.detailValue}>{contract.interest_rate}% Flat</Text>
                    </View>
                    <View>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, { color: Colors.primary }]}>Active</Text>
                    </View>
                </View>
                
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewEMIs(contract)}>
                        <Text style={styles.actionBtnText}>View EMIs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pdfBtn} onPress={() => handleExportPDF(contract)}>
                        <FileText color={Colors.textPrimary} size={18} />
                        <Text style={styles.pdfBtnText}>Export PDF</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>
        )});
    };

    const renderPendingEMIs = () => {
        if (pendingEMIs.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <CheckCircle2 color={Colors.success} size={48} style={{marginBottom: 16}} />
                    <Text style={[styles.emptyText, { color: Colors.textPrimary, fontSize: 18 }]}>All clear!</Text>
                    <Text style={styles.emptyText}>You don't have any pending EMIs.</Text>
                </View>
            );
        }
        return pendingEMIs.map((emi: any) => {
            const contract = emi.contract;
            const isLender = contract.role === 'Lender';
            return (
                <GlassCard key={emi.id} intensity="light" style={{ padding: 16, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
                                Due {new Date(emi.due_date).toLocaleDateString()}
                            </Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
                                {contract.party_name}
                            </Text>
                            <Text style={{ color: isLender ? Colors.success : Colors.danger, fontSize: 12, fontWeight: 'bold' }}>
                                {isLender ? 'To Receive' : 'To Pay'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '900' }}>
                                ₹{parseFloat(emi.emi_amount).toLocaleString()}
                            </Text>
                            {parseFloat(emi.paid_amount) > 0 && (
                                <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>
                                    Paid: ₹{parseFloat(emi.paid_amount).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={{ backgroundColor: Colors.primary, padding: 12, borderRadius: 12, marginTop: 16, alignItems: 'center' }}
                        onPress={() => handleOpenPay(emi, contract)}
                    >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>
                            {isLender ? 'Receive Payment' : 'Make Payment'}
                        </Text>
                    </TouchableOpacity>
                </GlassCard>
            );
        });
    };

    return (
        <View style={styles.container}>
            <Header title="Loans & EMI" subtitle="Track Borrowing" />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <View style={styles.tabHeaderRow}>
                    <View style={styles.tabHeader}>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'Active Contracts' && styles.tabActive]}
                            onPress={() => setActiveTab('Active Contracts')}
                        >
                            <Text style={activeTab === 'Active Contracts' ? styles.tabTextActive : styles.tabText}>Active Contracts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'Pending EMI' && styles.tabActive]}
                            onPress={() => setActiveTab('Pending EMI')}
                        >
                            <Text style={activeTab === 'Pending EMI' ? styles.tabTextActive : styles.tabText}>Pending EMI</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.createBtn} onPress={openCreateLoan}>
                        <Plus color="#000" size={20} />
                    </TouchableOpacity>
                </View>

                {activeTab === 'Active Contracts' ? renderActiveContracts() : renderPendingEMIs()}
            </ScrollView>


            {/* View EMIs Sheet */}
            <CustomBottomSheet visible={isViewEMIsVisible} onClose={() => setIsViewEMIsVisible(false)} height={600}>
                <View style={styles.sheetHeader}>
                    <View>
                        <Text style={styles.sheetTitle}>EMIs</Text>
                        <Text style={{color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold'}}>{selectedContract?.party_name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={() => setIsAddEMIVisible(true)}>
                            <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 12 }}>+ Add EMI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsViewEMIsVisible(false)}>
                            <X color={Colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 16 }}>Installments</Text>
                    {contractEMIs.length === 0 ? (
                        <Text style={{color: Colors.textSecondary, textAlign: 'center', marginTop: 40}}>No installments found.</Text>
                    ) : (
                        contractEMIs.map((emi: any) => (
                            <View key={emi.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
                                        Due {new Date(emi.due_date).toLocaleDateString()}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        {emi.status === 'Paid' ? <CheckCircle2 size={16} color={Colors.success}/> : emi.status === 'Partial' ? <AlertCircle size={16} color={Colors.warning}/> : <Circle size={16} color={Colors.textSecondary}/>}
                                        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '900' }}>₹{parseFloat(emi.emi_amount).toLocaleString()}</Text>
                                    </View>
                                    {parseFloat(emi.paid_amount) > 0 && (
                                        <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>Paid: ₹{parseFloat(emi.paid_amount).toLocaleString()}</Text>
                                    )}
                                </View>
                                {emi.status !== 'Paid' && (
                                    <TouchableOpacity 
                                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
                                        onPress={() => handleOpenPay(emi, selectedContract)}
                                    >
                                        <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 12 }}>Pay Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}

                    <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingTop: 24, paddingBottom: 40 }}>
                        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 16 }}>Payment History</Text>
                        {contractPaymentHistory.length === 0 ? (
                            <Text style={{color: Colors.textSecondary, textAlign: 'center'}}>No payment history found.</Text>
                        ) : (
                            contractPaymentHistory.map((tx: any) => {
                                const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || 'Unknown';
                                const isIncome = tx.type === 'Income';
                                return (
                                    <View key={tx.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={{ color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{tx.notes}</Text>
                                            <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{new Date(tx.transaction_date).toLocaleDateString()} • {walletName}</Text>
                                        </View>
                                        <Text style={{ color: isIncome ? Colors.warning : Colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
                                            {isIncome ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                        </Text>
                                    </View>
                                )
                            })
                        )}
                    </View>
                </ScrollView>
            </CustomBottomSheet>

            {/* Add EMI Sheet */}
            <CustomBottomSheet visible={isAddEMIVisible} onClose={() => setIsAddEMIVisible(false)} height={400}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>New Custom EMI</Text>
                    <TouchableOpacity onPress={() => setIsAddEMIVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>
                <View style={{ marginTop: 16 }}>
                    <Text style={{ color: Colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }}>Due Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={[styles.input, { marginBottom: 16 }]}
                        placeholder="2026-12-31"
                        placeholderTextColor={Colors.textSecondary}
                        value={newEmiDate}
                        onChangeText={setNewEmiDate}
                    />
                    
                    <Text style={{ color: Colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }}>EMI Amount</Text>
                    <TextInput
                        style={[styles.input, { marginBottom: 24 }]}
                        placeholder="e.g. 5000"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                        value={newEmiAmount}
                        onChangeText={setNewEmiAmount}
                    />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEMI}>
                        <Text style={styles.submitBtnText}>Save EMI</Text>
                    </TouchableOpacity>
                </View>
            </CustomBottomSheet>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    tabHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    tabHeader: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 4,
    },
    createBtn: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
    },
    tabText: {
        color: Colors.textSecondary,
        fontWeight: '700',
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    contractCard: {
        marginBottom: 16,
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    partyName: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 4,
    },
    amount: {
        color: Colors.textPrimary,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    detailLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    detailValue: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionBtnText: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    pdfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pdfBtnText: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    sheetTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
    },
    inputLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeBtnText: {
        color: Colors.textSecondary,
        fontWeight: '800',
        fontSize: 12,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
    }
});
