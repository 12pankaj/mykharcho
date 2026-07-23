import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2, Zap, Camera, X } from 'lucide-react-native';
import { TransactionService, AIService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddTransactionScreen({ route, navigation }: any) {
    const { editingTransaction, wallets, refreshCallback, initialMode, initialType } = route.params || {};

    const [mode, setMode] = useState<'manual' | 'smart'>(initialMode || 'manual');
    const [isParsing, setIsParsing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // AI State
    const [aiText, setAiText] = useState('');

    // Form State
    const [txType, setTxType] = useState(editingTransaction ? editingTransaction.type : (initialType || 'Expense'));
    const [amount, setAmount] = useState(editingTransaction ? editingTransaction.amount.toString() : '');
    const [category, setCategory] = useState(editingTransaction ? editingTransaction.category : '');
    const [walletId, setWalletId] = useState<string>(
        editingTransaction ? editingTransaction.wallet_id?.toString() : (wallets?.[0]?.id?.toString() || '')
    );
    const [notes, setNotes] = useState(editingTransaction?.notes || '');
    const [transactionDate, setTransactionDate] = useState(
        editingTransaction?.transaction_date 
            ? new Date(editingTransaction.transaction_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0]
    );

    const handleSaveTransaction = async () => {
        if (!amount || !category || !walletId) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            if (editingTransaction) {
                await TransactionService.update(editingTransaction.id, {
                    walletId,
                    amount: parseFloat(amount),
                    type: txType,
                    category,
                    notes,
                    transaction_date: transactionDate
                });
            } else {
                const res = await TransactionService.add({
                    walletId,
                    amount: parseFloat(amount),
                    type: txType,
                    category,
                    notes: notes || 'Added from Mobile App',
                    transaction_date: transactionDate
                });
                if (res.data && res.data.trialUnlocked) {
                    await AsyncStorage.setItem('trialUnlocked', 'true');
                }
            }

            if (refreshCallback) {
                refreshCallback();
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to save transaction");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAiParse = async (payload: { text?: string, imageBase64?: string }) => {
        setIsParsing(true);
        try {
            const res = await AIService.parseTransaction(payload);
            if (res.data.success) {
                const parsed = res.data.data;
                
                let matchedWalletId = undefined;
                if (parsed.walletName && wallets) {
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
                if (parsed.date) {
                    setTransactionDate(parsed.date);
                }
                if (matchedWalletId) {
                    setWalletId(matchedWalletId);
                }
                
                // Switch to manual mode to confirm details
                setMode('manual');
                setAiText('');
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
            base64: true
        });

        if (!result.canceled && result.assets[0].base64) {
            handleAiParse({ imageBase64: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'smart' ? 'Smart Add ✨' : (editingTransaction ? 'Edit Transaction' : 'Add Transaction')}
                </Text>
                {mode === 'manual' && !editingTransaction ? (
                    <TouchableOpacity onPress={() => setMode('smart')}>
                        <Zap color={Colors.primary} size={24} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    {mode === 'smart' ? (
                        <View style={{ flex: 1, justifyContent: 'center' }}>
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
                        </View>
                    ) : (
                        <>
                            <Text style={styles.inputLabel}>Type</Text>
                            <View style={styles.typeSelectorRow}>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, txType === 'Income' && { backgroundColor: Colors.success, borderColor: Colors.success }]} 
                                    onPress={() => setTxType('Income')}
                                >
                                    <Text style={[styles.typeBtnText, txType === 'Income' && { color: '#000' }]}>Income</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.typeBtn, txType === 'Expense' && { backgroundColor: Colors.danger, borderColor: Colors.danger }]} 
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

                            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="YYYY-MM-DD" 
                                placeholderTextColor={Colors.textSecondary}
                                value={transactionDate}
                                onChangeText={setTransactionDate}
                            />

                            <Text style={styles.inputLabel}>Notes</Text>
                            <TextInput 
                                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} 
                                placeholder="Optional notes" 
                                placeholderTextColor={Colors.textSecondary}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                            />

                            <Text style={styles.inputLabel}>Wallet</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, flexGrow: 0 }}>
                                {wallets?.map((w: any) => (
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
                        </>
                    )}

                </ScrollView>

                {mode === 'manual' && (
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={handleSaveTransaction} 
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
                                        <Text style={styles.saveButtonText}>{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
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
    aiOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: 16,
    },
    aiOptionTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    aiOptionSub: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    orText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        fontWeight: '800',
        letterSpacing: 2,
        marginVertical: 16,
        fontSize: 12,
    },
    aiInputContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 8,
    },
    aiInput: {
        color: Colors.white,
        fontSize: 16,
        minHeight: 100,
        padding: 16,
        textAlignVertical: 'top',
    },
    aiSendBtn: {
        backgroundColor: Colors.primary,
        alignSelf: 'flex-end',
        padding: 12,
        borderRadius: 12,
        margin: 8,
    },
});
