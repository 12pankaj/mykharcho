import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { Wallet as WalletIcon, Plus, CreditCard, Landmark, Coins, X, Trash2, Edit2 } from 'lucide-react-native';
import { WalletService, UserService } from '../api/apiService';

export default function WalletsScreen() {
    const [wallets, setWallets] = useState([]);
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingWalletId, setEditingWalletId] = useState<number | null>(null);
    const [walletName, setWalletName] = useState('');
    const [walletType, setWalletType] = useState('Bank');
    const [balance, setBalance] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchWallets = async () => {
        try {
            const [walletsRes, profileRes] = await Promise.all([
                WalletService.getAll(),
                UserService.getProfile()
            ]);
            setWallets(walletsRes.data);
            setProfile(profileRes.data);
        } catch (err) {
            console.error('Failed to load wallets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWallets();
        setRefreshing(false);
    };

    const openCreateSheet = () => {
        if (profile && wallets.length >= profile.max_wallets) {
            Alert.alert("Limit Reached", `Your ${profile.plan_name || 'current'} plan allows a maximum of ${profile.max_wallets} wallets.`);
            return;
        }
        setEditingWalletId(null);
        setWalletName('');
        setWalletType('Bank');
        setBalance('');
        setSheetVisible(true);
    };

    const openEditSheet = (wallet: any) => {
        setEditingWalletId(wallet.id);
        setWalletName(wallet.name);
        setWalletType(wallet.type);
        setBalance(wallet.balance.toString());
        setSheetVisible(true);
    };

    const handleSaveWallet = async () => {
        if (!walletName || !balance) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }
        
        setSubmitting(true);
        try {
            const data = {
                name: walletName,
                type: walletType,
                balance: parseFloat(balance)
            };

            if (editingWalletId) {
                await WalletService.update(editingWalletId, data);
            } else {
                await WalletService.create(data);
            }
            
            setSheetVisible(false);
            fetchWallets();
            Alert.alert("Success", editingWalletId ? "Wallet updated successfully" : "Wallet created successfully");
        } catch (err) {
            Alert.alert("Error", "Failed to save wallet");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteWallet = (id: string) => {
        Alert.alert("Delete Wallet", "Are you sure you want to delete this wallet? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    try {
                        await WalletService.delete(id);
                        fetchWallets();
                        Alert.alert("Success", "Wallet deleted successfully");
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete wallet");
                    }
                }
            }
        ]);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Bank': return <Landmark color="#3b82f6" size={24} />;
            case 'Credit Card': return <CreditCard color="#a855f7" size={24} />;
            case 'Cash': return <Coins color="#22c55e" size={24} />;
            default: return <WalletIcon color={Colors.primary} size={24} />;
        }
    };

    const formatCurrency = (val: number) => {
        const currency = profile?.preferred_currency || 'INR';
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
        return `${symbol}${val.toLocaleString()}`;
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
            <Header title="Your Wallets" subtitle="Manage Accounts" />
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>Total Liquidity</Text>
                <Text style={{ color: Colors.textPrimary, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
                    {formatCurrency(wallets.reduce((acc: number, curr: any) => acc + parseFloat(curr.balance), 0))}
                </Text>
            </View>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {profile && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>Usage Limit</Text>
                        <Text style={{ color: wallets.length >= profile.max_wallets ? Colors.danger : Colors.primary, fontSize: 12, fontWeight: '800' }}>
                            {wallets.length} / {profile.max_wallets} Wallets
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={styles.addWalletBtn} onPress={openCreateSheet}>
                    <View style={styles.addIconContainer}>
                        <Plus color={'#000'} size={24} />
                    </View>
                    <Text style={styles.addWalletText}>Add New Wallet</Text>
                </TouchableOpacity>

                {wallets.map((wallet: any) => (
                    <GlassCard key={wallet.id} intensity="medium" style={styles.walletCard}>
                        <View style={styles.walletHeader}>
                            <View style={styles.walletIconRow}>
                                <View style={styles.walletIcon}>
                                    {getIcon(wallet.type)}
                                </View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{wallet.type}</Text>
                                </View>
                            </View>
                            <View style={styles.actionIcons}>
                                <TouchableOpacity onPress={() => openEditSheet(wallet)} style={styles.iconBtn}>
                                    <Edit2 color={Colors.textSecondary} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteWallet(wallet.id)} style={styles.iconBtn}>
                                    <Trash2 color={Colors.danger} size={20} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletBalance}>{formatCurrency(parseFloat(wallet.balance))}</Text>
                    </GlassCard>
                ))}
            </ScrollView>

            <CustomBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={550}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{editingWalletId ? 'Edit Wallet' : 'Create Wallet'}</Text>
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

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

                <Text style={styles.inputLabel}>Type</Text>
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

                <TouchableOpacity 
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleSaveWallet}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>{editingWalletId ? 'Update Wallet' : 'Save Wallet'}</Text>}
                </TouchableOpacity>
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
        paddingBottom: 40,
    },
    addWalletBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue bg
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderStyle: 'dashed',
        marginBottom: 24,
        gap: 16,
    },
    addIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addWalletText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    walletCard: {
        marginBottom: 16,
        padding: 24,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    walletIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    badgeText: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 8,
        marginLeft: 8,
    },
    walletName: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    walletBalance: {
        color: Colors.textPrimary,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    sheetTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
    },
    inputLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeBtnText: {
        color: Colors.textSecondary,
        fontWeight: '800',
        fontSize: 12,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
    }
});
