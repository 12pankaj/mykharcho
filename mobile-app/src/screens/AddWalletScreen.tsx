import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { WalletService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddWalletScreen({ route, navigation }: any) {
    const editingWallet = route.params?.editingWallet || null;
    const refreshCallback = route.params?.refreshCallback;

    const [walletName, setWalletName] = useState(editingWallet ? editingWallet.name : '');
    const [balance, setBalance] = useState(editingWallet ? editingWallet.balance.toString() : '');
    const [walletType, setWalletType] = useState(editingWallet ? editingWallet.type : 'Bank');
    const [submitting, setSubmitting] = useState(false);

    const handleSaveWallet = async () => {
        if (!walletName || !balance || !walletType) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingWallet) {
                await WalletService.update(editingWallet.id, {
                    name: walletName,
                    balance: parseFloat(balance),
                    type: walletType
                });
            } else {
                await WalletService.create({
                    name: walletName,
                    balance: parseFloat(balance),
                    type: walletType
                });
            }
            if (refreshCallback) {
                refreshCallback();
            }
            navigation.goBack();
        } catch (error: any) {
            console.error('Wallet Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save wallet');
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
                <Text style={styles.headerTitle}>{editingWallet ? 'Edit Wallet' : 'Create Wallet'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.inputLabel}>Wallet Name</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. HDFC Bank, Secret Stash" 
                        placeholderTextColor={Colors.textSecondary}
                        value={walletName}
                        onChangeText={setWalletName}
                    />

                    <Text style={styles.inputLabel}>Balance (₹)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                        placeholderTextColor={Colors.textSecondary}
                        value={balance}
                        onChangeText={setBalance}
                    />

                    <Text style={styles.inputLabel}>Wallet Type</Text>
                    <View style={styles.typeSelectorRow}>
                        {['Bank', 'Cash', 'Credit Card'].map(type => (
                            <TouchableOpacity 
                                key={type}
                                style={[styles.typeBtn, walletType === type && { backgroundColor: Colors.primary }]} 
                                onPress={() => setWalletType(type)}
                            >
                                <Text style={[styles.typeBtnText, walletType === type && { color: '#000' }]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleSaveWallet} 
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
                                    <Text style={styles.saveButtonText}>{editingWallet ? 'Update Wallet' : 'Save Wallet'}</Text>
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
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    typeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    typeBtnText: {
        color: Colors.textSecondary,
        fontWeight: 'bold',
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
