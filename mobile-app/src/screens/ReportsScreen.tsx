import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { TransactionService, DashboardService } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width - 48; // padding 24 on each side

const chartConfig = {
    backgroundGradientFrom: '#0f172a',
    backgroundGradientTo: '#0f172a',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
    propsForLabels: {
        fontSize: 10,
        fontWeight: 'bold',
    }
};

export default function ReportsScreen() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState<any>(null);
    const [pieData, setPieData] = useState<any[]>([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const [txRes, statsRes] = await Promise.all([
                    TransactionService.getAll(),
                    DashboardService.getStats()
                ]);
                
                const txs = txRes.data;
                setTransactions(txs);
                setStats(statsRes.data);

                // Calculate Expense Categories
                const catMap: any = {};
                txs.forEach((tx: any) => {
                    if (tx.type === 'Expense') {
                        catMap[tx.category] = (catMap[tx.category] || 0) + parseFloat(tx.amount);
                    }
                });

                const colors = ['#3b82f6', '#f43f5e', '#ea580c', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];
                const mappedPie = Object.keys(catMap).map((cat, idx) => ({
                    name: cat,
                    population: catMap[cat],
                    color: colors[idx % colors.length],
                    legendFontColor: '#94a3b8',
                    legendFontSize: 12
                })).sort((a, b) => b.population - a.population);

                setPieData(mappedPie);

            } catch (err) {
                console.error("Failed to load reports", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const formatCurrency = (val: number) => {
        const currency = profile?.preferred_currency || 'INR';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
        return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Prepare Bar Chart Data
    const barDataLabels = stats?.chartData?.slice(-7).map((d: any) => d.date.substring(5)) || [];
    const barDataIncome = stats?.chartData?.slice(-7).map((d: any) => d.Income) || [];
    const barDataExpense = stats?.chartData?.slice(-7).map((d: any) => d.Expense) || [];

    const chartData = {
        labels: barDataLabels.length > 0 ? barDataLabels : ['Mon', 'Tue', 'Wed'],
        datasets: [
            { data: barDataIncome.length > 0 ? barDataIncome : [0,0,0], color: () => '#3b82f6' }, // Income
            { data: barDataExpense.length > 0 ? barDataExpense : [0,0,0], color: () => '#f43f5e' }  // Expense
        ],
    };

    const lineData = {
        labels: barDataLabels.length > 0 ? barDataLabels : ['Mon', 'Tue', 'Wed'],
        datasets: [
            { data: barDataIncome.length > 0 ? barDataIncome : [0,0,0], color: () => '#3b82f6', strokeWidth: 2 },
            { data: barDataExpense.length > 0 ? barDataExpense : [0,0,0], color: () => '#ea580c', strokeWidth: 2 }
        ],
        legend: ["Income", "Expense"]
    };

    return (
        <View style={styles.container}>
            <Header title="Reports" subtitle="Analytics & Insights" />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]} showsVerticalScrollIndicator={false}>
                
                {/* Expense Breakdown (Pie Chart) */}
                <GlassCard intensity="heavy" style={styles.card}>
                    <View style={styles.cardHeader}>
                        <PieIcon color={Colors.danger} size={20} />
                        <Text style={styles.cardTitle}>Expense Breakdown</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>WHERE YOUR MONEY GOES</Text>
                    
                    {pieData.length > 0 ? (
                        <PieChart
                            data={pieData}
                            width={screenWidth}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
                        </View>
                    )}
                </GlassCard>

                {/* Income vs Expense (Bar Chart) */}
                <GlassCard intensity="heavy" style={styles.card}>
                    <View style={styles.cardHeader}>
                        <BarChart3 color={Colors.primary} size={20} />
                        <Text style={styles.cardTitle}>Income vs Expense</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>LAST 7 DAYS CASH FLOW</Text>
                    
                    <View style={{ marginLeft: -10 }}>
                        <BarChart
                            data={chartData}
                            width={screenWidth + 10}
                            height={220}
                            yAxisLabel="₹"
                            yAxisSuffix=""
                            chartConfig={{...chartConfig, barPercentage: 0.3}}
                            verticalLabelRotation={0}
                            fromZero={true}
                            showValuesOnTopOfBars={false}
                        />
                    </View>
                </GlassCard>

                {/* Wealth Trajectory (Line Chart) */}
                <GlassCard intensity="heavy" style={styles.card}>
                    <View style={styles.cardHeader}>
                        <TrendingUp color={Colors.success} size={20} />
                        <Text style={styles.cardTitle}>Wealth Trajectory</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>CUMULATIVE TRENDS</Text>
                    
                    <View style={{ marginLeft: -10 }}>
                        <LineChart
                            data={lineData}
                            width={screenWidth + 10}
                            height={220}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            }}
                            bezier
                            withDots={true}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                            yAxisLabel="₹"
                            yAxisSuffix=""
                        />
                    </View>
                </GlassCard>

            </ScrollView>
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
        paddingTop: 10,
    },
    card: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    cardTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
    },
    cardSubtitle: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 20,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
    }
});
