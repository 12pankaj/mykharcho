import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Linking } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { GroupService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroupSettleUpScreen({ route, navigation }: any) {
    const { groupId, settlement, groupName, refreshCallback } = route.params || {};

    const [submitting, setSubmitting] = useState(false);

    const handleUpiPayment = async (app: string) => {
        if (!settlement) return;
        
        const { amount, to_name, to_upi_id, from, to } = settlement;
        const note = encodeURIComponent(`Settlement for ${groupName}`);
        const payeeName = encodeURIComponent(to_name);
        
        // Base UPI URL
        let url = `upi://pay?pa=${to_upi_id}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
        
        if (app === 'gpay') url = `tez://upi/pay?pa=${to_upi_id}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
        if (app === 'phonepe') url = `phonepe://upi/pay?pa=${to_upi_id}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
        if (app === 'paytm') url = `paytmmp://upi/pay?pa=${to_upi_id}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen || app === 'other') {
                await Linking.openURL(url);
                // Assume payment initiated, ask user to confirm
                setTimeout(() => {
                    Alert.alert(
                        "Confirm Payment",
                        `Did you successfully pay ₹${amount} to ${to_name}?`,
                        [
                            { text: "No", style: "cancel" },
                            {
                                text: "Yes, Record It",
                                onPress: async () => {
                                    try {
                                        setSubmitting(true);
                                        await GroupService.settleDebt(groupId, {
                                            paid_by: from,
                                            paid_to: to,
                                            amount: amount
                                        });
                                        if (refreshCallback) {
                                            refreshCallback();
                                        }
                                        navigation.goBack();
                                    } catch (error) {
                                        Alert.alert("Error", "Could not record settlement");
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }
                            }
                        ]
                    );
                }, 1500);
            } else {
                Alert.alert("App not found", "The selected UPI app is not installed on your device.");
            }
        } catch (err) {
            try {
                await Linking.openURL(url);
            } catch (fallbackErr) {
                Alert.alert("Error", "Could not open the selected UPI app.");
            }
        }
    };

    const handleManualSettle = () => {
        const { amount, to_name, from, to } = settlement;
        Alert.alert(
            "Manual Settle",
            `Record ₹${amount} as paid to ${to_name} (Cash/Bank)?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Record",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            await GroupService.settleDebt(groupId, {
                                paid_by: from,
                                paid_to: to,
                                amount: amount
                            });
                            if (refreshCallback) {
                                refreshCallback();
                            }
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Error", "Could not record settlement");
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    if (!settlement) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settle Up</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>You are paying</Text>
                    <Text style={styles.summaryName}>{settlement.to_name}</Text>
                    <Text style={styles.summaryAmount}>₹{settlement.amount}</Text>
                    {settlement.to_upi_id ? (
                        <Text style={styles.summaryUpi}>UPI ID: {settlement.to_upi_id}</Text>
                    ) : (
                        <Text style={styles.summaryNoUpi}>No UPI ID provided by user</Text>
                    )}
                </View>

                {submitting ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator color={Colors.primary} size="large" />
                        <Text style={{ color: Colors.white, marginTop: 16 }}>Recording settlement...</Text>
                    </View>
                ) : (
                    <>
                        {settlement.to_upi_id && (
                            <>
                                <Text style={styles.sectionTitle}>Pay via UPI</Text>
                                
                                <TouchableOpacity style={styles.upiBtn} onPress={() => handleUpiPayment('gpay')}>
                                    <Text style={styles.upiBtnText}>Google Pay</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={styles.upiBtn} onPress={() => handleUpiPayment('phonepe')}>
                                    <Text style={styles.upiBtnText}>PhonePe</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={styles.upiBtn} onPress={() => handleUpiPayment('paytm')}>
                                    <Text style={styles.upiBtnText}>Paytm</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={styles.upiBtn} onPress={() => handleUpiPayment('other')}>
                                    <Text style={styles.upiBtnText}>Other UPI App</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <Text style={styles.sectionTitle}>Other Methods</Text>
                        <TouchableOpacity style={[styles.upiBtn, { borderColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={handleManualSettle}>
                            <Text style={styles.upiBtnText}>Record Manual Cash/Bank Payment</Text>
                        </TouchableOpacity>
                    </>
                )}

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        flex: 1,
    },
    summaryBox: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    summaryLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    summaryName: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 16,
    },
    summaryAmount: {
        color: Colors.primary,
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 16,
    },
    summaryUpi: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    summaryNoUpi: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 16,
        marginTop: 8,
        letterSpacing: 1,
    },
    upiBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    upiBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
