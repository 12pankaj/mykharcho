import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { GroupService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

export default function AddGroupExpenseScreen({ route, navigation }: any) {
    const { groupId, members, refreshCallback } = route.params || {};
    const { user } = useAuth();

    const [expDesc, setExpDesc] = useState('');
    const [expAmt, setExpAmt] = useState('');
    const [isEqualSplit, setIsEqualSplit] = useState(true);
    const [customSplits, setCustomSplits] = useState<{ [key: number]: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const handleAddExpense = async () => {
        if (!expDesc || !expAmt) {
            Alert.alert("Error", "Please enter description and amount");
            return;
        }
        
        const totalAmount = parseFloat(expAmt);
        if (isNaN(totalAmount) || totalAmount <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        let splits = [];
        if (isEqualSplit) {
            const splitAmt = (totalAmount / members.length).toFixed(2);
            splits = members.map((m: any) => ({ user_id: m.id, amount_owed: splitAmt }));
        } else {
            let sum = 0;
            splits = members.map((m: any) => {
                const amt = parseFloat(customSplits[m.id] || '0');
                sum += amt;
                return { user_id: m.id, amount_owed: amt };
            });
            if (Math.abs(sum - totalAmount) > 0.01) {
                Alert.alert("Error", "Custom splits must equal the total amount");
                return;
            }
        }

        setSubmitting(true);
        try {
            await GroupService.addExpense(groupId, {
                description: expDesc,
                amount: totalAmount,
                paid_by: user.id, // currently logged in user pays
                splits
            });
            
            if (refreshCallback) {
                refreshCallback();
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Could not add expense");
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
                <Text style={styles.headerTitle}>Add Group Expense</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Dinner, Cab" 
                        placeholderTextColor={Colors.textSecondary}
                        value={expDesc}
                        onChangeText={setExpDesc}
                        autoFocus
                    />

                    <Text style={styles.inputLabel}>Amount (₹) *</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                        placeholderTextColor={Colors.textSecondary}
                        value={expAmt}
                        onChangeText={setExpAmt}
                    />

                    <Text style={styles.inputLabel}>Split Type</Text>
                    <View style={styles.typeSelectorRow}>
                        <TouchableOpacity 
                            style={[styles.typeBtn, isEqualSplit && { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
                            onPress={() => setIsEqualSplit(true)}
                        >
                            <Text style={[styles.typeBtnText, isEqualSplit && { color: '#000' }]}>Equally</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.typeBtn, !isEqualSplit && { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
                            onPress={() => setIsEqualSplit(false)}
                        >
                            <Text style={[styles.typeBtnText, !isEqualSplit && { color: '#000' }]}>Custom Split</Text>
                        </TouchableOpacity>
                    </View>

                    {!isEqualSplit && (
                        <View style={styles.customSplitContainer}>
                            <Text style={[styles.inputLabel, { marginTop: 0 }]}>Enter amount for each member:</Text>
                            {members?.map((m: any) => (
                                <View key={m.id} style={styles.splitRow}>
                                    <Text style={styles.splitMemberName}>{m.full_name}</Text>
                                    <TextInput 
                                        style={styles.splitInput} 
                                        keyboardType="numeric" 
                                        placeholder="0.00"
                                        placeholderTextColor={Colors.textSecondary}
                                        value={customSplits[m.id] || ''}
                                        onChangeText={(val) => setCustomSplits({...customSplits, [m.id]: val})}
                                    />
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleAddExpense} 
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
                                    <Text style={styles.saveButtonText}>Add Expense</Text>
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
    customSplitContainer: {
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    splitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    splitMemberName: {
        color: Colors.textPrimary,
        fontSize: 14,
        flex: 1,
    },
    splitInput: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: Colors.white,
        fontSize: 14,
        width: 100,
        textAlign: 'right',
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
