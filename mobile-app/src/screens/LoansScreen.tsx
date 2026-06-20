import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { Users, FileText, Clock, Plus, X, CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';
import { LoanService, WalletService } from '../api/apiService';
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

    // Form State for new contract
    const [sheetVisible, setSheetVisible] = useState(false);
    const [partyName, setPartyName] = useState('');
    const [partyPhone, setPartyPhone] = useState('');
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [loanType, setLoanType] = useState('Money Given');
    const [interestType, setInterestType] = useState('Simple');

    // State for View EMIs
    const [isViewEMIsVisible, setIsViewEMIsVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [contractEMIs, setContractEMIs] = useState<any[]>([]);

    // State for Pay EMI
    const [isPayVisible, setIsPayVisible] = useState(false);
    const [selectedEMI, setSelectedEMI] = useState<any>(null);
    const [payAmount, setPayAmount] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [loansRes, walletsRes] = await Promise.all([
                LoanService.getContracts(),
                WalletService.getAll()
            ]);
            
            const loansData = loansRes.data;
            setContracts(loansData);
            setWallets(walletsRes.data);
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

    const handleCreateLoan = async () => {
        if (!partyName || !principal || !interestRate) return;
        try {
            await LoanService.createContract({
                partyName: partyName,
                partyPhone: partyPhone,
                totalPrincipal: parseFloat(principal),
                interestRate: parseFloat(interestRate),
                role: loanType === 'Money Given' ? 'Lender' : 'Borrower',
                totalInstallments: 0, 
                startDate: new Date().toISOString().split('T')[0]
            });
            setSheetVisible(false);
            setPartyName('');
            setPartyPhone('');
            setPrincipal('');
            setInterestRate('');
            fetchData();
        } catch (err) {
            Alert.alert("Error", "Failed to create loan");
        }
    };

    const handleViewEMIs = async (contract: any) => {
        setSelectedContract(contract);
        try {
            const res = await LoanService.getInstallments(contract.id);
            setContractEMIs(res.data);
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
                    <TouchableOpacity style={styles.createBtn} onPress={() => setSheetVisible(true)}>
                        <Plus color="#000" size={20} />
                    </TouchableOpacity>
                </View>

                {activeTab === 'Active Contracts' ? renderActiveContracts() : renderPendingEMIs()}
            </ScrollView>

            {/* Create Contract Sheet */}
            <CustomBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={680}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>New Contract</Text>
                        <TouchableOpacity onPress={() => setSheetVisible(false)}>
                            <X color={Colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Party Name</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Rahul, Bank" 
                        placeholderTextColor={Colors.textSecondary}
                        value={partyName}
                        onChangeText={setPartyName}
                    />

                    <Text style={styles.inputLabel}>Party Phone (WhatsApp)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="phone-pad"
                        placeholder="e.g. 919876543210" 
                        placeholderTextColor={Colors.textSecondary}
                        value={partyPhone}
                        onChangeText={setPartyPhone}
                    />

                    <Text style={styles.inputLabel}>Principal Amount (₹)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                        placeholderTextColor={Colors.textSecondary}
                        value={principal}
                        onChangeText={setPrincipal}
                    />

                    <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="e.g. 5" 
                        placeholderTextColor={Colors.textSecondary}
                        value={interestRate}
                        onChangeText={setInterestRate}
                    />

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Type</Text>
                            <View style={styles.typeSelectorRow}>
                                {['Given', 'Taken'].map(t => {
                                    const fullType = `Money ${t}`;
                                    return (
                                        <TouchableOpacity 
                                            key={t}
                                            style={[styles.typeBtn, loanType === fullType && { backgroundColor: Colors.primary }]} 
                                            onPress={() => setLoanType(fullType)}
                                        >
                                            <Text style={[styles.typeBtnText, loanType === fullType && { color: '#000' }]}>{t}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Interest</Text>
                            <View style={styles.typeSelectorRow}>
                                {['Simple', 'Compound'].map(t => (
                                    <TouchableOpacity 
                                        key={t}
                                        style={[styles.typeBtn, interestType === t && { backgroundColor: Colors.primary }]} 
                                        onPress={() => setInterestType(t)}
                                    >
                                        <Text style={[styles.typeBtnText, interestType === t && { color: '#000' }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreateLoan}>
                        <Text style={styles.submitBtnText}>Create Contract</Text>
                    </TouchableOpacity>
                </ScrollView>
            </CustomBottomSheet>

            {/* View EMIs Sheet */}
            <CustomBottomSheet visible={isViewEMIsVisible} onClose={() => setIsViewEMIsVisible(false)} height={600}>
                <View style={styles.sheetHeader}>
                    <View>
                        <Text style={styles.sheetTitle}>EMIs</Text>
                        <Text style={{color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold'}}>{selectedContract?.party_name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsViewEMIsVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
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
                </ScrollView>
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
