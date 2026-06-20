import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Clock, X, Camera, Mic, Zap, CreditCard } from 'lucide-react-native';
import { AIService, DashboardService, TransactionService, WalletService, UserService } from '../api/apiService';
import { registerForPushNotificationsAsync } from '../services/NotificationService';
import { TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0, incomeTrend: '+0%', expenseTrend: '+0%' });
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [txSheetVisible, setTxSheetVisible] = useState(false);
    const [txType, setTxType] = useState('Expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    // AI States
    const [aiSheetVisible, setAiSheetVisible] = useState(false);
    const [aiText, setAiText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const fetchDashboard = async () => {
        // Fetch Profile
        try {
            const profileRes = await UserService.getProfile();
            setProfile(profileRes.data);
        } catch (err) {
            console.error('Failed to load profile in dashboard', err);
        }

        // Fetch Stats
        try {
            const statsRes = await DashboardService.getStats();
            console.log("stats", statsRes.data);
            setStats({
                balance: statsRes.data.balance || 0,
                income: statsRes.data.income || 0,
                expense: statsRes.data.expense || 0,
                incomeTrend: statsRes.data.incomeTrend || '+0%',
                expenseTrend: statsRes.data.expenseTrend || '+0%'
            });
        } catch (err) {
            console.error('Failed to load stats', err);
        }

        // Fetch Transactions
        try {
            const txRes = await TransactionService.getAll();
            setTransactions(txRes.data.slice(0, 5)); // Just recent 5
        } catch (err) {
            console.error('Failed to load transactions', err);
        }

        // Fetch Wallets
        try {
            const walletsRes = await WalletService.getAll();
            setWallets(walletsRes.data);
            if (walletsRes.data.length > 0) {
                setSelectedWallet(walletsRes.data[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to load wallets for dashboard', err);
        }
    };

    useEffect(() => {
        fetchDashboard();
        registerForPushNotificationsAsync();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboard();
        setRefreshing(false);
    };

    const handleAddTransaction = async () => {
        if (!amount || !category) {
            Alert.alert("Error", "Please enter amount and category");
            return;
        }
        if (!selectedWallet) {
            Alert.alert("Error", "Please select a wallet (create one first if none exist).");
            return;
        }
        try {
            await TransactionService.add({
                walletId: selectedWallet,
                amount: parseFloat(amount),
                type: txType,
                category,
                notes: notes || 'Added from Mobile App'
            });
            setTxSheetVisible(false);
            setAmount('');
            setCategory('');
            fetchDashboard(); // Refresh stats
        } catch (err) {
            console.error('Failed to add transaction');
            Alert.alert("Error", "Failed to add transaction");
        }
    };

    const handleAiParse = async (payload: { text?: string, imageBase64?: string }) => {
        setIsParsing(true);
        try {
            const res = await AIService.parseTransaction(payload);
            if (res.data.success) {
                const parsed = res.data.data;
                
                let matchedWalletId = undefined;
                if (parsed.walletName) {
                    const searchName = parsed.walletName.toLowerCase();
                    const matchedWallet = wallets.find((w: any) => 
                        w.name.toLowerCase().includes(searchName) || searchName.includes(w.name.toLowerCase())
                    );
                    if (matchedWallet) {
                        matchedWalletId = matchedWallet.id.toString();
                    }
                }

                setTxType(parsed.type || 'Expense');
                setAmount(parsed.amount ? parsed.amount.toString() : '');
                setCategory(parsed.category || '');
                setNotes(parsed.description || '');
                if (matchedWalletId) {
                    setSelectedWallet(matchedWalletId);
                }
                
                setAiSheetVisible(false);
                setAiText('');
                setTxSheetVisible(true); // Open the main sheet to confirm
            } else {
                Alert.alert("Parsing Failed", res.data.message);
            }
        } catch (err) {
            Alert.alert("Error", "Could not parse transaction.");
        } finally {
            setIsParsing(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            handleAiParse({ imageBase64: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const formatCurrency = (val: number) => {
        const currency = profile?.preferred_currency || 'INR';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
        return `${symbol}${val.toLocaleString()}`;
    };

    return (
        <View style={styles.container}>
            <Header 
                title="Overview" 
                subtitle={`Welcome Back, ${profile?.full_name || user?.fullName || 'User'}`} 
            />
            {profile && profile.role !== 'admin' && (
                <View style={{ paddingHorizontal: 24, marginBottom: 10 }}>
                    <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        <Text style={{ color: '#3b82f6', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{profile.plan_name || 'Free'} Plan</Text>
                    </View>
                </View>
            )}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Stat Cards Container */}
                <View style={styles.statsContainer}>
                    {/* Available Balance Card */}
                    <GlassCard intensity="heavy" style={styles.statCard}>
                        <View style={styles.statCardHeader}>
                            <View style={styles.statIconWrapper}>
                                <Wallet color="#3b82f6" size={20} />
                            </View>
                            <View style={[styles.trendBadge, stats.incomeTrend.startsWith('+') ? styles.trendPositive : styles.trendNegative]}>
                                <Text style={[styles.trendText, stats.incomeTrend.startsWith('+') ? styles.trendTextPositive : styles.trendTextNegative]}>
                                    {stats.incomeTrend}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.statCardLabel}>Available Balance</Text>
                        <Text style={styles.statCardValue}>{formatCurrency(stats.balance)}</Text>
                    </GlassCard>

                    {/* Monthly Expense Card */}
                    <GlassCard intensity="heavy" style={styles.statCard}>
                        <View style={styles.statCardHeader}>
                            <View style={styles.statIconWrapper}>
                                <CreditCard color="#f43f5e" size={20} />
                            </View>
                            <View style={[styles.trendBadge, stats.expenseTrend.startsWith('+') ? styles.trendNegative : styles.trendPositive]}>
                                <Text style={[styles.trendText, stats.expenseTrend.startsWith('+') ? styles.trendTextNegative : styles.trendTextPositive]}>
                                    {stats.expenseTrend}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.statCardLabel}>Monthly Expense</Text>
                        <Text style={styles.statCardValue}>{formatCurrency(stats.expense)}</Text>
                    </GlassCard>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => { setTxType('Expense'); setTxSheetVisible(true); }}>
                        <View style={styles.actionIconContainer}>
                            <ArrowUpRight color={Colors.danger} size={24} />
                        </View>
                        <Text style={styles.actionText}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => { setTxType('Income'); setTxSheetVisible(true); }}>
                        <View style={styles.actionIconContainer}>
                            <ArrowDownRight color={Colors.success} size={24} />
                        </View>
                        <Text style={styles.actionText}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setAiSheetVisible(true)}>
                        <View style={[styles.actionIconContainer, { borderColor: Colors.primary, borderWidth: 2 }]}>
                            <Zap color={Colors.primary} size={24} />
                        </View>
                        <Text style={[styles.actionText, { color: Colors.primary }]}>Smart Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <GlassCard intensity="light" style={styles.transactionsCard}>
                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Clock color={Colors.textSecondary} size={32} />
                            <Text style={styles.emptyText}>No recent activity</Text>
                        </View>
                    ) : (
                        transactions.map((tx: any, index: number) => (
                            <View key={tx.id} style={[styles.txRow, index !== transactions.length - 1 && styles.txBorder]}>
                                <View style={styles.txLeft}>
                                    <View style={[styles.txIcon, { backgroundColor: tx.type === 'Income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                        {tx.type === 'Income' ? <ArrowDownRight color="#22c55e" size={20} /> : <ArrowUpRight color="#ef4444" size={20} />}
                                    </View>
                                    <View>
                                        <Text style={styles.txTitle}>{tx.category}</Text>
                                        <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.txAmount, { color: tx.type === 'Income' ? '#22c55e' : Colors.textPrimary }]}>
                                    {tx.type === 'Income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </GlassCard>
            </ScrollView>

            <CustomBottomSheet visible={txSheetVisible} onClose={() => setTxSheetVisible(false)} height={500}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Add {txType}</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity onPress={() => { setTxSheetVisible(false); setAiSheetVisible(true); }}>
                            <Zap color={Colors.primary} size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setTxSheetVisible(false)}>
                            <X color={Colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

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
                    placeholder="0.00"
                    placeholderTextColor={Colors.textSecondary}
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={styles.inputLabel}>Category / Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Netflix, Salary"
                    placeholderTextColor={Colors.textSecondary}
                    value={category}
                    onChangeText={setCategory}
                />

                <Text style={styles.inputLabel}>Wallet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, flexGrow: 0 }}>
                    {wallets.map((w: any) => (
                        <TouchableOpacity 
                            key={w.id}
                            style={[{
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: Colors.border,
                                marginRight: 8,
                            }, selectedWallet === w.id.toString() && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                            onPress={() => setSelectedWallet(w.id.toString())}
                        >
                            <Text style={[{color: Colors.textSecondary, fontSize: 14}, selectedWallet === w.id.toString() && { color: '#000', fontWeight: 'bold' }]}>
                                {w.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
                    <Text style={styles.submitBtnText}>Add Transaction</Text>
                </TouchableOpacity>
            </CustomBottomSheet>

            {/* AI Smart Add Sheet */}
            <CustomBottomSheet visible={aiSheetVisible} onClose={() => setAiSheetVisible(false)} height={400}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Smart Add ✨</Text>
                    <TouchableOpacity onPress={() => setAiSheetVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                {isParsing ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={{ color: Colors.textSecondary, marginTop: 16 }}>Analyzing with AI...</Text>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity style={styles.aiOptionBtn} onPress={pickImage}>
                            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)' }]}>
                                <Camera color="#eab308" size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.aiOptionTitle}>Scan Receipt</Text>
                                <Text style={styles.aiOptionSub}>Upload a photo of your bill</Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.orText}>OR DESCRIBE IT</Text>

                        <View style={styles.aiInputContainer}>
                            <TextInput
                                style={styles.aiInput}
                                placeholder="e.g. Spent 500 on dinner with friends"
                                placeholderTextColor={Colors.textSecondary}
                                value={aiText}
                                onChangeText={setAiText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.aiSendBtn, !aiText.trim() && { opacity: 0.5 }]}
                                onPress={() => { if (aiText.trim()) handleAiParse({ text: aiText }) }}
                                disabled={!aiText.trim()}
                            >
                                <Zap color="#000" size={20} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 10,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    statIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendPositive: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)', // Orange for positive
    },
    trendNegative: {
        backgroundColor: 'rgba(244, 63, 94, 0.1)', // Rose for negative
    },
    trendText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    trendTextPositive: {
        color: '#ea580c',
    },
    trendTextNegative: {
        color: '#f43f5e',
    },
    statCardLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    statCardValue: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 32,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
    },
    seeAllText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
    },
    transactionsCard: {
        padding: 0,
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
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    txBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    txLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    txDate: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '900',
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
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 12,
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
    },
    aiOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    aiOptionTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    aiOptionSub: {
        color: Colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    orText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        marginVertical: 24,
    },
    aiInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    aiInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        color: Colors.textPrimary,
        minHeight: 60,
    },
    aiSendBtn: {
        backgroundColor: Colors.primary,
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
