import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { Users, CreditCard, LifeBuoy, ArrowRight, MessageSquare, Crown } from 'lucide-react-native';
import apiService from '../../api/apiService';

export default function AdminDashboardScreen({ navigation }: any) {
    const [stats, setStats] = useState({ totalUsers: 0, totalRevenue: 0, openTickets: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const fetchAdminStats = async () => {
        try {
            const res = await apiService.getAdminStats();
            setStats(res.data.stats);
        } catch (err) {
            console.error('Failed to load admin stats', err);
        }
    };

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAdminStats();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <Header title="Command Center" subtitle="Admin Access" />
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <View style={styles.statsGrid}>
                    <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('AdminUsers')}
                    >
                        <GlassCard intensity="heavy" style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Users color="#3b82f6" size={24} />
                            </View>
                            <Text style={styles.statValue}>{stats.totalUsers}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </GlassCard>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('AdminPayments')}
                    >
                        <GlassCard intensity="heavy" style={styles.statCard}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                                <CreditCard color="#22c55e" size={24} />
                            </View>
                            <Text style={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Revenue</Text>
                        </GlassCard>
                    </TouchableOpacity>
                </View>

                <GlassCard intensity="medium" style={styles.fullCard}>
                    <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <LifeBuoy color="#ef4444" size={24} />
                        </View>
                        <View style={styles.cardHeaderRight}>
                            <Text style={styles.ticketCount}>{stats.openTickets}</Text>
                            <Text style={styles.ticketLabel}>Open Tickets</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>Manage Support Desk</Text>
                        <ArrowRight color={Colors.textPrimary} size={18} />
                    </TouchableOpacity>
                </GlassCard>

                <GlassCard intensity="medium" style={styles.fullCard}>
                    <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                            <Crown color="#eab308" size={24} />
                        </View>
                        <View style={styles.cardHeaderRight}>
                            <Text style={[styles.ticketCount, { color: '#eab308' }]}>Manage</Text>
                            <Text style={styles.ticketLabel}>Pricing</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('AdminPlans')}
                    >
                        <Text style={styles.actionBtnText}>Configure Subscriptions</Text>
                        <ArrowRight color={Colors.textPrimary} size={18} />
                    </TouchableOpacity>
                </GlassCard>

                <Text style={styles.sectionTitle}>Marketing Engagement</Text>
                <GlassCard intensity="medium" style={styles.fullCard}>
                    <View style={styles.cardTop}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                            <MessageSquare color="#a855f7" size={24} />
                        </View>
                        <View style={styles.cardHeaderRight}>
                            <View style={styles.liveBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.chatTitle}>Live Website Chat</Text>
                    <Text style={styles.chatDesc}>Connect with visitors currently browsing the public marketing website.</Text>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: Colors.primary, marginTop: 16 }]}
                        onPress={() => navigation.navigate('AdminChat')}
                    >
                        <Text style={styles.actionBtnText}>Open Live Chat</Text>
                        <MessageSquare color={Colors.textPrimary} size={18} />
                    </TouchableOpacity>
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
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 20,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statValue: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    fullCard: {
        padding: 20,
        marginBottom: 24,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardHeaderRight: {
        alignItems: 'flex-end',
    },
    ticketCount: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: '900',
    },
    ticketLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionBtnText: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
        marginTop: 8,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#a855f7',
    },
    liveBadgeText: {
        color: '#a855f7',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    chatTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 4,
    },
    chatDesc: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
    }
});
