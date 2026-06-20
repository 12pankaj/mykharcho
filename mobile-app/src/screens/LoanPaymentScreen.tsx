import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, Wallet, CheckCircle2 } from 'lucide-react-native';
import { LoanService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoanPaymentScreen({ route, navigation }: any) {
    const { emi, contract, wallets, refreshCallback } = route.params;

    const [payAmount, setPayAmount] = useState((parseFloat(emi.emi_amount) - parseFloat(emi.paid_amount)).toString());
    const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
    const [isPaying, setIsPaying] = useState(false);

    const isLender = contract?.role === 'Lender';
    const title = isLender ? 'Receive Payment' : 'Make Payment';

    const handlePayment = async () => {
        if (!selectedWalletId || !payAmount || parseFloat(payAmount) <= 0) {
            Alert.alert('Error', 'Please select a wallet and enter a valid amount.');
            return;
        }
        
        setIsPaying(true);
        try {
            await LoanService.payInstallment(emi.id, parseFloat(payAmount), selectedWalletId);
            if (refreshCallback) {
                refreshCallback();
            }
            Alert.alert('Success', `${title} successful!`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Failed to process payment.';
            Alert.alert('Error', msg);
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>EMI Details</Text>
                        <Text style={styles.cardTitle}>Due {new Date(emi.due_date).toLocaleDateString()}</Text>
                        
                        <View style={styles.row}>
                            <Text style={styles.detailLabel}>Total Amount</Text>
                            <Text style={styles.detailValue}>₹{parseFloat(emi.emi_amount).toLocaleString()}</Text>
                        </View>
                        
                        <View style={styles.row}>
                            <Text style={styles.detailLabel}>Paid So Far</Text>
                            <Text style={[styles.detailValue, { color: Colors.success }]}>₹{parseFloat(emi.paid_amount).toLocaleString()}</Text>
                        </View>

                        <View style={[styles.row, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                            <Text style={styles.detailLabel}>Remaining</Text>
                            <Text style={[styles.detailValue, { color: Colors.warning, fontSize: 18 }]}>
                                ₹{(parseFloat(emi.emi_amount) - parseFloat(emi.paid_amount)).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Select Wallet</Text>
                    <View style={styles.walletContainer}>
                        {wallets.map((w: any) => (
                            <TouchableOpacity 
                                key={w.id} 
                                style={[styles.walletItem, selectedWalletId === w.id && styles.walletItemSelected]}
                                onPress={() => setSelectedWalletId(w.id)}
                            >
                                <Wallet size={20} color={selectedWalletId === w.id ? '#000' : Colors.textSecondary} />
                                <Text style={[styles.walletText, selectedWalletId === w.id && styles.walletTextSelected]}>
                                    {w.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Payment Amount (₹)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={payAmount}
                        onChangeText={setPayAmount}
                        placeholder="Enter amount"
                        placeholderTextColor={Colors.textSecondary}
                    />

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.payButton} 
                        onPress={handlePayment} 
                        disabled={isPaying}
                    >
                        <LinearGradient
                            colors={isLender ? [Colors.success, '#10b981'] : [Colors.primary, Colors.primaryDark]}
                            style={styles.payGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isPaying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 color="#fff" size={20} />
                                    <Text style={styles.payButtonText}>Confirm {title}</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardLabel: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    detailValue: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    walletContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 30,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    walletItemSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    walletText: {
        color: Colors.textSecondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    walletTextSelected: {
        color: '#000',
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    payButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    payGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
