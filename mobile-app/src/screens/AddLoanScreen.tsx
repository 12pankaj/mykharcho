import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { LoanService, WalletService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddLoanScreen({ route, navigation }: any) {
    const { refreshCallback } = route.params || {};

    const [partyName, setPartyName] = useState('');
    const [partyPhone, setPartyPhone] = useState('');
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [totalInstallments, setTotalInstallments] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [loanType, setLoanType] = useState('Money Given');
    const [submitting, setSubmitting] = useState(false);
    
    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedWalletId, setSelectedWalletId] = useState<any>(null);

    useEffect(() => {
        const fetchWallets = async () => {
            try {
                const res = await WalletService.getAll();
                setWallets(res.data);
                if (res.data.length > 0) {
                    setSelectedWalletId(res.data[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchWallets();
    }, []);

    const handleCreateLoan = async () => {
        if (!partyName || !principal || !interestRate || !startDate || !selectedWalletId) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            await LoanService.createContract({
                partyName: partyName,
                partyPhone: partyPhone,
                totalPrincipal: parseFloat(principal),
                interestRate: parseFloat(interestRate),
                role: loanType === 'Money Given' ? 'Lender' : 'Borrower',
                totalInstallments: parseInt(totalInstallments) || 0, 
                startDate: startDate,
                walletId: selectedWalletId
            });
            
            if (refreshCallback) {
                refreshCallback();
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to create loan");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Loan</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.inputLabel}>Role</Text>
                    <View style={styles.typeSelectorRow}>
                        {['Money Given', 'Money Taken'].map(type => (
                            <TouchableOpacity 
                                key={type}
                                style={[styles.typeBtn, loanType === type && { backgroundColor: type === 'Money Given' ? Colors.danger : Colors.success, borderColor: type === 'Money Given' ? Colors.danger : Colors.success }]} 
                                onPress={() => setLoanType(type)}
                            >
                                <Text style={[styles.typeBtnText, loanType === type && { color: '#000' }]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Party Name *</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Rahul, John" 
                        placeholderTextColor={Colors.textSecondary}
                        value={partyName}
                        onChangeText={setPartyName}
                    />

                    <Text style={styles.inputLabel}>Party Phone (Optional)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="phone-pad"
                        placeholder="e.g. 9876543210" 
                        placeholderTextColor={Colors.textSecondary}
                        value={partyPhone}
                        onChangeText={setPartyPhone}
                    />

                    <Text style={styles.inputLabel}>Principal Amount (₹) *</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                        placeholderTextColor={Colors.textSecondary}
                        value={principal}
                        onChangeText={setPrincipal}
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.inputLabel}>Interest Rate (% Flat) *</Text>
                            <TextInput 
                                style={styles.input} 
                                keyboardType="numeric" 
                                placeholder="e.g. 2" 
                                placeholderTextColor={Colors.textSecondary}
                                value={interestRate}
                                onChangeText={setInterestRate}
                            />
                        </View>
                        <View style={styles.spacing} />
                        <View style={styles.flex1}>
                            <Text style={styles.inputLabel}>Total Installments (Months)</Text>
                            <TextInput 
                                style={styles.input} 
                                keyboardType="numeric" 
                                placeholder="e.g. 12" 
                                placeholderTextColor={Colors.textSecondary}
                                value={totalInstallments}
                                onChangeText={setTotalInstallments}
                            />
                        </View>
                    </View>

                    <Text style={[styles.inputLabel, { textAlign: 'center' }]}>Start Date</Text>
                    <TextInput 
                        style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 2, paddingVertical: 20 }]} 
                        placeholder="YYYY-MM-DD" 
                        placeholderTextColor={Colors.textSecondary}
                        value={startDate}
                        onChangeText={setStartDate}
                    />
                    <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: -10, marginBottom: 20 }}>
                        Format: Year-Month-Day (e.g. 2024-05-30)
                    </Text>

                    <Text style={styles.inputLabel}>Wallet for Principal *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
                        {wallets.map(wallet => (
                            <TouchableOpacity
                                key={wallet.id}
                                style={[
                                    styles.walletCard,
                                    selectedWalletId === wallet.id && styles.walletCardSelected
                                ]}
                                onPress={() => setSelectedWalletId(wallet.id)}
                            >
                                <Text style={[
                                    styles.walletName,
                                    selectedWalletId === wallet.id && styles.walletTextSelected
                                ]}>{wallet.name}</Text>
                                <Text style={[
                                    styles.walletBalance,
                                    selectedWalletId === wallet.id && styles.walletTextSelected
                                ]}>₹{wallet.balance}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleCreateLoan} 
                        disabled={submitting}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 color="#000" size={20} />
                                    <Text style={styles.saveButtonText}>Create & Auto-Generate EMIs</Text>
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
    inputLabel: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: Colors.white,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flex1: {
        flex: 1,
    },
    spacing: {
        width: 16,
    },
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeBtnText: {
        color: Colors.textSecondary,
        fontWeight: 'bold',
    },
    walletScroll: {
        marginTop: 5,
        marginBottom: 20,
    },
    walletCard: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        minWidth: 140,
    },
    walletCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '20', // 20% opacity
    },
    walletName: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
    },
    walletBalance: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    walletTextSelected: {
        color: Colors.primary,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    saveButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
