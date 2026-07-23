import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Edit2, Trash2, X, Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { TransactionService, WalletService } from '../api/apiService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function TransactionsScreen({ navigation }: { navigation: any }) {
    const [transactions, setTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [filterWallet, setFilterWallet] = useState('All');

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
        navigation.navigate('AddTransaction', { editingTransaction: tx, wallets, refreshCallback: fetchData });
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

    const filteredTransactions = transactions.filter((tx: any) => {
        if (searchQuery && !tx.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'All' && tx.type !== filterType) return false;
        if (filterWallet !== 'All' && tx.wallet_id?.toString() !== filterWallet) return false;
        return true;
    });

    const handleExportPDF = async () => {
        try {
            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: sans-serif; padding: 20px; color: #333; }
                            h1 { color: #F59E0B; margin-bottom: 5px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                            th { background-color: #f8fafc; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>Transactions Report</h1>
                        <p>Total Records: ${filteredTransactions.length}</p>
                        <table>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                            ${filteredTransactions.map((tx: any) => `
                                <tr>
                                    <td>${new Date(tx.transaction_date || tx.created_at).toLocaleDateString()}</td>
                                    <td>${tx.category}</td>
                                    <td>${tx.type}</td>
                                    <td>₹${parseFloat(tx.amount).toFixed(2)}</td>
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
                    <TextInput 
                        style={[styles.searchPlaceholder, { flex: 1, padding: 0 }]}
                        placeholder="Search transactions..."
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterVisible(true)}>
                    <Filter color={Colors.textPrimary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterBtn} onPress={handleExportPDF}>
                    <Download color={Colors.textPrimary} size={18} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {filteredTransactions.map((tx: any, index: number) => {
                    const isIncome = tx.type === 'Income';
                    const walletObj = wallets.find((w: any) => w.id === tx.wallet_id);
                    const walletName = walletObj ? walletObj.name : 'Wallet';
                    return (
                        <GlassCard intensity="heavy" style={styles.txCard} key={tx.id}>
                            <View style={styles.txLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isIncome ? 'rgba(234, 88, 12, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                                    {isIncome ? <ArrowDownRight color="#ea580c" size={24} /> : <ArrowUpRight color="#f43f5e" size={24} />}
                                </View>
                                <View>
                                    <Text style={styles.txCategory}>{tx.category}</Text>
                                    <View style={styles.txDetailsRow}>
                                        <Text style={styles.txDate}>{new Date(tx.transaction_date || tx.created_at).toLocaleDateString()}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.txWallet}>{walletName}</Text>
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

            {/* Filter Bottom Sheet */}
            <CustomBottomSheet visible={isFilterVisible} onClose={() => setIsFilterVisible(false)} height="60%">
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Filters</Text>
                    <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>Type</Text>
                    <View style={styles.typeSelectorRow}>
                        {['All', 'Income', 'Expense'].map(type => (
                            <TouchableOpacity 
                                key={type}
                                style={[styles.typeBtn, filterType === type && { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
                                onPress={() => setFilterType(type)}
                            >
                                <Text style={[styles.typeBtnText, filterType === type && { color: '#000', fontWeight: 'bold' }]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Wallet</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, flexGrow: 0 }}>
                        <TouchableOpacity 
                            style={[styles.walletPill, filterWallet === 'All' && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                            onPress={() => setFilterWallet('All')}
                        >
                            <Text style={[styles.walletPillText, filterWallet === 'All' && { color: '#000', fontWeight: 'bold' }]}>All</Text>
                        </TouchableOpacity>
                        {wallets?.map((w: any) => (
                            <TouchableOpacity 
                                key={w.id}
                                style={[styles.walletPill, filterWallet === w.id.toString() && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                                onPress={() => setFilterWallet(w.id.toString())}
                            >
                                <Text style={[styles.walletPillText, filterWallet === w.id.toString() && { color: '#000', fontWeight: 'bold' }]}>{w.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.submitBtn} onPress={() => setIsFilterVisible(false)}>
                        <Text style={styles.submitBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
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
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 10,
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
