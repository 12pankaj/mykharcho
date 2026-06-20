import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { Colors } from '../../theme/colors';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { AdminService } from '../../api/apiService';

export default function AdminPaymentsScreen() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await AdminService.getAllPayments();
                setPayments(res.data.payments || []);
            } catch (error) {
                console.error("Failed to load payments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const renderPayment = ({ item }: { item: any }) => (
        <GlassCard style={styles.paymentCard}>
            <View style={styles.paymentRow}>
                <Text style={styles.paymentUser}>{item.user_name || 'Unknown User'}</Text>
                <Text style={styles.paymentAmount}>₹{item.amount}</Text>
            </View>
            <View style={styles.paymentRow}>
                <Text style={styles.paymentStatus}>{item.status}</Text>
                <Text style={styles.paymentDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
        </GlassCard>
    );

    return (
        <View style={styles.container}>
            <Header title="Admin" subtitle="All Payments" />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : payments.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No payments found.</Text>
                </View>
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderPayment}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    paymentCard: {
        padding: 16,
        marginBottom: 16,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentUser: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    paymentAmount: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    paymentStatus: {
        color: Colors.success,
        fontSize: 14,
        textTransform: 'capitalize',
    },
    paymentDate: {
        color: Colors.textSecondary,
        fontSize: 14,
    }
});
