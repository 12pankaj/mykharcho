import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Clock, X, Camera, Mic, Zap, CreditCard } from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import { AIService, DashboardService, TransactionService, WalletService, UserService, PromotionService } from '../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../services/NotificationService';
import { TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0, incomeTrend: '+0%', expenseTrend: '+0%' });
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [topCategories, setTopCategories] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [wallets, setWallets] = useState([]);
    const insets = useSafeAreaInsets();
    const [activePromotion, setActivePromotion] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [claimingTrial, setClaimingTrial] = useState(false);

    const screenWidth = Dimensions.get('window').width - 48; // padding 24 on each side

    const chartConfig = {
        backgroundGradientFrom: Colors.background,
        backgroundGradientTo: Colors.background,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
        useShadowColorFromDataset: false,
    };

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
            const allTx = txRes.data;
            setTransactions(allTx.slice(0, 5)); // Just recent 5
            
            // Calculate Top Categories for Dashboard Reports Block
            const catMap: any = {};
            allTx.forEach((tx: any) => {
                if (tx.type === 'Expense') {
                    catMap[tx.category] = (catMap[tx.category] || 0) + parseFloat(tx.amount);
                }
            });
            const mapped = Object.keys(catMap).map(cat => ({
                name: cat,
                amount: catMap[cat]
            })).sort((a, b) => b.amount - a.amount).slice(0, 4); // Top 4
            
            const colors = [Colors.primary, '#f43f5e', '#ea580c', '#10b981'];
            const mappedPie = mapped.map((item, idx) => ({
                name: item.name,
                population: item.amount,
                color: colors[idx % colors.length],
                legendFontColor: '#94a3b8',
                legendFontSize: 11
            }));
            
            setPieData(mappedPie);

        } catch (err) {
            console.error('Failed to load transactions', err);
        }

        // Fetch Wallets
        try {
            const walletsRes = await WalletService.getAll();
            setWallets(walletsRes.data);
        } catch (err) {
            console.error('Failed to load wallets for dashboard', err);
        }

        // Fetch Active Promotion
        try {
            const promoRes = await PromotionService.getActive();
            setActivePromotion(promoRes.data.promotion);
        } catch (err) {
            console.error('Failed to load active promotion in dashboard', err);
        }
    };

    useEffect(() => {
        fetchDashboard();
        registerForPushNotificationsAsync();
    }, []);

    // Countdown Timer for Promotion Banner
    useEffect(() => {
        if (!activePromotion?.end_date) return;
        
        const updateTimer = () => {
            const end = new Date(activePromotion.end_date).getTime();
            const now = new Date().getTime();
            const diff = end - now;
            
            if (diff <= 0) {
                setTimeLeft('Expired');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activePromotion]);

    // Trial Modal Auto-trigger check
    useEffect(() => {
        const checkTrialUnlocked = async () => {
            if (
                profile && 
                profile.role !== 'admin' && 
                profile.current_streak >= 7 && 
                !profile.has_claimed_trial && 
                (profile.current_plan_id === '197f1815-141b-492f-bd2a-398ba6dc53d9' || profile.plan_name === 'Free')
            ) {
                setShowTrialModal(true);
            } else {
                const isUnlocked = await AsyncStorage.getItem('trialUnlocked');
                if (isUnlocked === 'true' && profile && !profile.has_claimed_trial) {
                    setShowTrialModal(true);
                } else {
                    setShowTrialModal(false);
                }
            }
        };
        checkTrialUnlocked();
    }, [profile]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboard();
        setRefreshing(false);
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
                onNotificationPress={() => navigation.navigate('Notifications' as never)}
            />
            {profile && profile.role !== 'admin' && (
                <View style={{ paddingHorizontal: 24, marginBottom: 10, flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{profile.plan_name || 'Free'} Plan</Text>
                    </View>
                    {profile.current_streak > 0 && (
                        <View style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.2)' }}>
                            <Text style={{ color: '#ea580c', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>🔥 {profile.current_streak} Day Streak</Text>
                        </View>
                    )}
                </View>
            )}
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 120, 120) }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Active Promotion Banner */}
                {activePromotion && timeLeft !== 'Expired' && (
                    <LinearGradient
                        colors={['#f97316', '#eab308']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.promoBanner}
                    >
                        <View style={styles.promoHeader}>
                            <View style={styles.promoIconContainer}>
                                <Zap color="#fff" size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.promoTitle}>{activePromotion.title}</Text>
                                <Text style={styles.promoSubtitle}>Get {activePromotion.discount_percentage}% OFF on all upgrades!</Text>
                            </View>
                        </View>
                        <View style={styles.promoTimerRow}>
                            <Text style={styles.promoTimerLabel}>Flash Sale Ends In:</Text>
                            <View style={styles.promoTimerContainer}>
                                <Text style={styles.promoTimerText}>{timeLeft}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Stat Cards Container */}
                <View style={styles.statsContainer}>
                    {/* Available Balance Card */}
                    <LinearGradient 
                        colors={[Colors.primary, Colors.primaryDark]} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        style={styles.gradientCard}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Wallet color="#ffffff" size={20} />
                            </View>
                            <View style={[styles.trendBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.trendText, { color: '#ffffff' }]}>
                                    {stats.incomeTrend}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Available Balance</Text>
                        <Text style={[styles.statCardValue, { color: '#ffffff' }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatCurrency(stats.balance)}
                        </Text>
                    </LinearGradient>

                    {/* Monthly Expense Card */}
                    <LinearGradient 
                        colors={['#e11d48', '#be123c']} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        style={styles.gradientCard}
                    >
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <CreditCard color="#ffffff" size={20} />
                            </View>
                            <View style={[styles.trendBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.trendText, { color: '#ffffff' }]}>
                                    {stats.expenseTrend}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.statCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Monthly Expense</Text>
                        <Text style={[styles.statCardValue, { color: '#ffffff' }]} numberOfLines={1} adjustsFontSizeToFit>
                            {formatCurrency(stats.expense)}
                        </Text>
                    </LinearGradient>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTransaction', { wallets, initialType: 'Expense', refreshCallback: fetchDashboard })}>
                        <View style={styles.actionIconContainer}>
                            <ArrowUpRight color={Colors.danger} size={24} />
                        </View>
                        <Text style={styles.actionText}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTransaction', { wallets, initialType: 'Income', refreshCallback: fetchDashboard })}>
                        <View style={styles.actionIconContainer}>
                            <ArrowDownRight color={Colors.success} size={24} />
                        </View>
                        <Text style={styles.actionText}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTransaction', { wallets, initialMode: 'smart', refreshCallback: fetchDashboard })}>
                        <View style={[styles.actionIconContainer, { borderColor: Colors.primary, borderWidth: 2 }]}>
                            <Zap color={Colors.primary} size={24} />
                        </View>
                        <Text style={[styles.actionText, { color: Colors.primary }]}>Smart Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard Reports Block */}
                <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Expense Distribution</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
                        <Text style={styles.seeAllText}>View Report</Text>
                    </TouchableOpacity>
                </View>

                <GlassCard intensity="heavy" style={styles.reportsCard}>
                    {pieData.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: Colors.textSecondary }}>No expenses recorded</Text>
                        </View>
                    ) : (
                        <View style={{ marginLeft: -10, marginTop: -10 }}>
                            <PieChart
                                data={pieData}
                                width={screenWidth}
                                height={180}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"5"}
                                center={[10, 0]}
                                absolute
                            />
                        </View>
                    )}
                </GlassCard>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
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

            {/* Sheets replaced by AddTransactionScreen */}

            {/* Trial Claim Modal */}
            {showTrialModal && (
                <View style={styles.modalOverlay}>
                    <GlassCard intensity="heavy" style={styles.modalCard}>
                        <View style={styles.fireCircle}>
                            <Text style={styles.fireEmoji}>🔥</Text>
                        </View>
                        
                        <Text style={styles.modalTitle}>7-Day Streak Achieved!</Text>
                        <Text style={styles.modalDescription}>
                            You logged your expenses for 7 consecutive days. Incredible discipline!
                        </Text>
                        
                        <View style={styles.rewardCard}>
                            <Text style={styles.rewardLabel}>YOUR REWARD UNLOCKED</Text>
                            <Text style={styles.rewardTitle}>3-Day FREE Elite Trial</Text>
                            <Text style={styles.rewardDesc}>
                                Gain access to unlimited wallets, advanced automation rules, EMI schedules, and PDF exports instantly.
                            </Text>
                        </View>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.claimBtn}
                                onPress={async () => {
                                    setClaimingTrial(true);
                                    try {
                                        await UserService.claimTrial();
                                        await AsyncStorage.removeItem('trialUnlocked');
                                        await fetchDashboard();
                                        setShowTrialModal(false);
                                        Alert.alert("Success", "Your 3-Day Free Elite Trial is active!");
                                    } catch (err: any) {
                                        Alert.alert("Error", err.response?.data?.error || 'Failed to claim trial');
                                    } finally {
                                        setClaimingTrial(false);
                                    }
                                }}
                                disabled={claimingTrial}
                            >
                                <LinearGradient
                                    colors={['#f97316', '#eab308']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.claimGradient}
                                >
                                    {claimingTrial ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.claimBtnText}>Claim 3-Day Free Elite</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.laterBtn}
                                onPress={async () => {
                                    await AsyncStorage.removeItem('trialUnlocked');
                                    setShowTrialModal(false);
                                }}
                            >
                                <Text style={styles.laterBtnText}>Maybe Later</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            )}
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
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    gradientCard: {
        flex: 1,
        padding: 16,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
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
        letterSpacing: 1,
        marginBottom: 4,
    },
    statCardValue: {
        color: Colors.textPrimary,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
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
        marginBottom: 24,
    },
    reportsCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
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
    },
    promoBanner: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    promoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    promoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    promoTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    promoSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    promoTimerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    promoTimerLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    promoTimerContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    promoTimerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 1000,
    },
    modalCard: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    fireCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderWidth: 2,
        borderColor: '#ea580c',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    fireEmoji: {
        fontSize: 36,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalDescription: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    rewardCard: {
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 24,
        gap: 6,
    },
    rewardLabel: {
        color: '#ea580c',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    rewardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    rewardDesc: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
    },
    modalButtons: {
        width: '100%',
        gap: 12,
    },
    claimBtn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    claimGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    claimBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    laterBtn: {
        width: '100%',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    laterBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    }
});
