import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Edit2, Trash2, X } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';
import { TransactionService, WalletService } from '../api/apiService';

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingTxId, setEditingTxId] = useState<number | null>(null);
    const [txType, setTxType] = useState('Expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [walletId, setWalletId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [txRes, walletRes] = await Promise.all([
                TransactionService.getAll(),
                WalletService.getAll()
            ]);
            setTransactions(txRes.data);
            setWallets(walletRes.data);
        } catch (err) {
            console.error('Failed to load transactions');
        } finally {
            setLoading(false);
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

    const openEditSheet = (tx: any) => {
        setEditingTxId(tx.id);
        setTxType(tx.type);
        setAmount(tx.amount.toString());
        setCategory(tx.category);
        setWalletId(tx.wallet_id?.toString() || (wallets.length > 0 ? wallets[0].id.toString() : ''));
        setSheetVisible(true);
    };

    const handleUpdateTransaction = async () => {
        if (!amount || !category || !walletId) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setSubmitting(true);
        try {
            await TransactionService.update(editingTxId!, {
                walletId: walletId,
                amount: parseFloat(amount),
                type: txType,
                category,
            });
            setSheetVisible(false);
            fetchData();
            Alert.alert("Success", "Transaction updated");
        } catch (err) {
            Alert.alert("Error", "Failed to update transaction");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTransaction = (id: string) => {
        Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    try {
                        await TransactionService.delete(id);
                        fetchData();
                        Alert.alert("Success", "Transaction deleted");
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete transaction");
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Transactions" subtitle="All History" />
            
            {/* Search & Filter Bar */}
            <View style={styles.filterRow}>
                <View style={styles.searchBar}>
                    <Search color={Colors.textSecondary} size={18} />
                    <Text style={styles.searchPlaceholder}>Search transactions...</Text>
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Filter color={Colors.textPrimary} size={18} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {transactions.map((tx: any, index: number) => {
                    const isIncome = tx.type === 'Income';
                    return (
                        <GlassCard intensity="heavy" style={styles.txCard} key={tx.id}>
                            <View style={styles.txLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isIncome ? 'rgba(234, 88, 12, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                                    {isIncome ? <ArrowDownRight color="#ea580c" size={24} /> : <ArrowUpRight color="#f43f5e" size={24} />}
                                </View>
                                <View>
                                    <Text style={styles.txCategory}>{tx.category}</Text>
                                    <View style={styles.txDetailsRow}>
                                        <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.txWallet}>{tx.wallet_name || 'Wallet'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={[styles.txAmount, { color: isIncome ? '#ea580c' : Colors.textPrimary }]}>
                                    {isIncome ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                </Text>
                                <View style={styles.txActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditSheet(tx)}>
                                        <Edit2 color={Colors.textSecondary} size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteTransaction(tx.id)}>
                                        <Trash2 color={Colors.danger} size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GlassCard>
                    );
                })}
            </ScrollView>

            <CustomBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={500}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Edit Transaction</Text>
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeSelectorRow}>
                    <TouchableOpacity 
                        style={[styles.typeBtn, txType === 'Income' && { backgroundColor: Colors.success }]} 
                        onPress={() => setTxType('Income')}
                    >
                        <Text style={[styles.typeBtnText, txType === 'Income' && { color: '#000' }]}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.typeBtn, txType === 'Expense' && { backgroundColor: Colors.danger }]} 
                        onPress={() => setTxType('Expense')}
                    >
                        <Text style={[styles.typeBtnText, txType === 'Expense' && { color: '#000' }]}>Expense</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={styles.inputLabel}>Category</Text>
                <TextInput 
                    style={styles.input} 
                    value={category}
                    onChangeText={setCategory}
                />

                <Text style={styles.inputLabel}>Wallet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, flexGrow: 0 }}>
                    {wallets.map((w: any) => (
                        <TouchableOpacity 
                            key={w.id}
                            style={[styles.walletPill, walletId === w.id.toString() && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                            onPress={() => setWalletId(w.id.toString())}
                        >
                            <Text style={[styles.walletPillText, walletId === w.id.toString() && { color: '#000', fontWeight: 'bold' }]}>
                                {w.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity 
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleUpdateTransaction}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Update Transaction</Text>}
                </TouchableOpacity>
            </CustomBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 10,
    },
    searchPlaceholder: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    filterBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    txCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        marginBottom: 16,
        borderRadius: 24,
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txCategory: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 4,
    },
    txDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    txDate: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.textSecondary,
    },
    txWallet: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
    },
    txRight: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    txActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        padding: 4,
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
    walletPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
    },
    walletPillText: {
        color: Colors.textSecondary,
        fontSize: 14,
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
