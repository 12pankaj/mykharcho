import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { Repeat, Zap, Plus, Trash2 } from 'lucide-react-native';
import { AutomationService, WalletService } from '../api/apiService';
import CustomBottomSheet from '../components/CustomBottomSheet';

export default function AutomationScreen() {
    const [rules, setRules] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isSheetVisible, setSheetVisible] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState('Monthly');
    const [type, setType] = useState('Expense');
    const [walletId, setWalletId] = useState('');
    const [nextRunDate, setNextRunDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [rulesRes, walletsRes] = await Promise.all([
                AutomationService.getAll(),
                WalletService.getAll()
            ]);
            setRules(rulesRes.data);
            setWallets(walletsRes.data);
            if (walletsRes.data.length > 0) {
                setWalletId(walletsRes.data[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to load automation data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleCreateRule = async () => {
        if (!name || !amount || !category || !walletId) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            await AutomationService.create({
                name,
                amount: parseFloat(amount),
                category,
                frequency,
                type,
                walletId,
                nextRunDate: nextRunDate
            });
            setSheetVisible(false);
            
            // Reset form
            setName('');
            setAmount('');
            setCategory('');
            setFrequency('Monthly');
            setType('Expense');
            
            fetchData();
            Alert.alert("Success", "Automation rule created successfully");
        } catch (error: any) {
            console.error('Create rule error', error);
            if (error.response?.data?.limitReached) {
                Alert.alert("Upgrade Required", error.response.data.message);
            } else {
                Alert.alert("Error", "Failed to create automation rule");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Rule", "Are you sure you want to delete this rule?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    try {
                        await AutomationService.delete(id);
                        fetchData();
                    } catch (err) {
                        Alert.alert("Error", "Could not delete rule");
                    }
                }
            }
        ]);
    };

    const handleToggleStatus = async (rule: any) => {
        const newStatus = rule.status === 'Active' ? 'Paused' : 'Active';
        try {
            await AutomationService.update(rule.id, {
                walletId: rule.wallet_id,
                name: rule.name,
                amount: rule.amount,
                type: rule.type,
                category: rule.category,
                frequency: rule.frequency,
                nextRunDate: rule.next_run_date,
                status: newStatus 
            });
            // Optimistic update
            setRules(rules.map((r: any) => r.id === rule.id ? { ...r, status: newStatus } : r) as any);
        } catch (err) {
            Alert.alert("Error", "Failed to update rule status");
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Automation" subtitle="Smart Recurring Rules" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <GlassCard style={styles.promoCard} intensity="medium">
                    <View style={styles.promoIcon}>
                        <Zap color={Colors.accent} size={24} />
                    </View>
                    <View style={styles.promoTextContainer}>
                        <Text style={styles.promoTitle}>Put Finances on Autopilot</Text>
                        <Text style={styles.promoDesc}>Automatically record rent, salary, and subscriptions on schedule.</Text>
                    </View>
                </GlassCard>

                {rules.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Repeat color={Colors.textSecondary} size={32} />
                        <Text style={styles.emptyText}>No automation rules yet</Text>
                    </View>
                ) : (
                    rules.map((rule: any) => (
                        <GlassCard key={rule.id} style={styles.ruleCard}>
                            <View style={styles.ruleHeader}>
                                <Text style={styles.ruleName}>{rule.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Switch 
                                        value={rule.status === 'Active'} 
                                        onValueChange={() => handleToggleStatus(rule)}
                                        trackColor={{ false: Colors.border, true: Colors.primary }}
                                        thumbColor="#fff"
                                    />
                                    <TouchableOpacity onPress={() => handleDelete(rule.id)} style={{ marginLeft: 12 }}>
                                        <Trash2 color={Colors.danger} size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={[styles.ruleAmount, { color: rule.type === 'Income' ? Colors.success : Colors.textPrimary }]}>
                                {rule.type === 'Income' ? '+' : '-'}₹{parseFloat(rule.amount).toLocaleString()}
                            </Text>
                            <Text style={styles.ruleDesc}>{rule.category} • Runs {rule.frequency.toLowerCase()} • Next run: {new Date(rule.next_run_date).toLocaleDateString()}</Text>
                        </GlassCard>
                    ))
                )}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => setSheetVisible(true)}>
                <Plus color={Colors.white} size={28} />
            </TouchableOpacity>

            <CustomBottomSheet visible={isSheetVisible} onClose={() => setSheetVisible(false)} height={600}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.sheetTitle}>Create New Rule</Text>
                    
                    <Text style={styles.inputLabel}>Rule Name</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g., Monthly Rent" 
                        placeholderTextColor={Colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.inputLabel}>Amount (₹)</Text>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric"
                        placeholder="0.00" 
                        placeholderTextColor={Colors.textSecondary}
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <Text style={styles.inputLabel}>Category</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g., Housing, Salary" 
                        placeholderTextColor={Colors.textSecondary}
                        value={category}
                        onChangeText={setCategory}
                    />

                    <Text style={styles.inputLabel}>Type</Text>
                    <View style={styles.typeSelectorRow}>
                        <TouchableOpacity 
                            style={[styles.typeBtn, type === 'Income' && { backgroundColor: Colors.success }]} 
                            onPress={() => setType('Income')}
                        >
                            <Text style={[styles.typeBtnText, type === 'Income' && { color: '#000' }]}>Income</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.typeBtn, type === 'Expense' && { backgroundColor: Colors.danger }]} 
                            onPress={() => setType('Expense')}
                        >
                            <Text style={[styles.typeBtnText, type === 'Expense' && { color: '#000' }]}>Expense</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Frequency</Text>
                    <View style={styles.typeSelectorRow}>
                        {['Daily', 'Weekly', 'Monthly'].map(freq => (
                            <TouchableOpacity 
                                key={freq}
                                style={[styles.typeBtn, frequency === freq && { backgroundColor: Colors.primary }]} 
                                onPress={() => setFrequency(freq)}
                            >
                                <Text style={[styles.typeBtnText, frequency === freq && { color: '#000' }]}>{freq}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Wallet</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
                        {wallets.map((w: any) => (
                            <TouchableOpacity 
                                key={w.id} 
                                style={[styles.walletPill, walletId === w.id.toString() && styles.walletPillActive]}
                                onPress={() => setWalletId(w.id.toString())}
                            >
                                <Text style={[styles.walletPillText, walletId === w.id.toString() && styles.walletPillTextActive]}>
                                    {w.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>Next Run Date (YYYY-MM-DD)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="YYYY-MM-DD" 
                        placeholderTextColor={Colors.textSecondary}
                        value={nextRunDate}
                        onChangeText={setNextRunDate}
                    />

                    <TouchableOpacity 
                        style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                        onPress={handleCreateRule}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Create Rule</Text>}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </CustomBottomSheet>
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
        paddingBottom: 100,
    },
    promoCard: {
        flexDirection: 'row',
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        gap: 16,
        borderColor: 'rgba(234, 179, 8, 0.2)', // Yellow hue
        backgroundColor: 'rgba(234, 179, 8, 0.05)',
    },
    promoIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promoTextContainer: {
        flex: 1,
    },
    promoTitle: {
        color: Colors.accent,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    promoDesc: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: Colors.textSecondary,
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    ruleCard: {
        padding: 20,
        marginBottom: 16,
    },
    ruleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ruleName: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    ruleAmount: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 8,
    },
    ruleDesc: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sheetTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
    },
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    typeBtnText: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    walletScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    walletPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: 8,
    },
    walletPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    walletPillText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    walletPillTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
    },
    submitBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
