import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Linking } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { Users, Plus, ArrowRight, UserPlus, CreditCard } from 'lucide-react-native';
import { GroupService } from '../api/apiService';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailsScreen({ route, navigation }: any) {
    const { groupId } = route.params;
    const { user } = useAuth();
    
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Expenses');

    // Bottom sheets replaced by full-page screens

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await GroupService.getGroupDetails(groupId);
            setGroup(res.data.group);
            setMembers(res.data.members);
            setExpenses(res.data.expenses);

            const setRes = await GroupService.getSettlements(groupId);
            setSettlements(setRes.data.settlements);
            setBalances(setRes.data.balances);
        } catch (error) {
            Alert.alert("Error", "Could not load group details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [groupId]);

    const openAddMember = () => {
        navigation.navigate('AddGroupMember', { groupId, refreshCallback: fetchData });
    };

    const openAddExpense = () => {
        navigation.navigate('AddGroupExpense', { groupId, members, refreshCallback: fetchData });
    };

    const openSettleUp = (settlement: any) => {
        if (!settlement.to_upi_id) {
            Alert.alert("Missing UPI ID", `${settlement.to_name} has not set up their UPI ID yet.`);
            // Allow manual settle even without UPI
        }
        navigation.navigate('GroupSettleUp', { groupId, settlement, groupName: group?.name, refreshCallback: fetchData });
    };

    if (loading || !group) {
        return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <Header title={group.name} subtitle={group.description || "Group Details"} showBack />

            <GlassCard intensity="heavy" style={styles.membersCard}>
                <View style={styles.membersRow}>
                    <View style={styles.avatarStack}>
                        {members.map((m, index) => (
                            <View key={m.id} style={[styles.avatar, { zIndex: members.length - index, marginLeft: index === 0 ? 0 : -16 }]}>
                                <Text style={styles.avatarText}>{m.full_name.substring(0, 2).toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.membersCount}>{members.length} Members</Text>
                </View>
                <TouchableOpacity style={styles.addMemberBtnTop} onPress={openAddMember}>
                    <UserPlus color={Colors.primary} size={16} />
                    <Text style={styles.addMemberTextTop}>Add</Text>
                </TouchableOpacity>
            </GlassCard>
            
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'Expenses' && styles.activeTab]} onPress={() => setActiveTab('Expenses')}>
                    <Text style={[styles.tabText, activeTab === 'Expenses' && styles.activeTabText]}>Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'Balances' && styles.activeTab]} onPress={() => setActiveTab('Balances')}>
                    <Text style={[styles.tabText, activeTab === 'Balances' && styles.activeTabText]}>Balances</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'Expenses' ? (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={expenses}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <GlassCard intensity="light" style={styles.card}>
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={styles.expDesc}>{item.description}</Text>
                                        <Text style={styles.expSub}>Paid by {item.paid_by_name}</Text>
                                    </View>
                                    <Text style={styles.expAmount}>₹{item.amount}</Text>
                                </View>
                            </GlassCard>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No expenses yet.</Text>}
                    />
                    <TouchableOpacity style={styles.fab} onPress={openAddExpense}>
                        <Plus color={Colors.white} size={28} />
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    <Text style={styles.sectionTitle}>Optimized Settlements</Text>
                    {settlements.length === 0 ? (
                        <Text style={styles.emptyText}>All caught up! No one owes anything.</Text>
                    ) : (
                        settlements.map((s, idx) => (
                            <GlassCard key={idx} intensity="light" style={styles.card}>
                                <View style={styles.rowBetween}>
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={styles.settleText}>
                                            <Text style={styles.bold}>{s.from_name}</Text> owes <Text style={styles.bold}>{s.to_name}</Text>
                                        </Text>
                                        <Text style={styles.settleAmount}>₹{s.amount}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.settleBtn} onPress={() => openSettleUp(s)}>
                                        <CreditCard color={Colors.white} size={16} />
                                        <Text style={styles.settleBtnText}>Settle Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Replaced bottom sheets with AddGroupExpense, AddGroupMember, and GroupSettleUp screens */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
    tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
    tabText: { color: Colors.textSecondary, fontSize: 16, fontWeight: 'bold' },
    activeTabText: { color: Colors.primary },
    listContent: { padding: 20, paddingBottom: 100 },
    membersCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginHorizontal: 20, marginBottom: 16, borderRadius: 20 },
    membersRow: { flexDirection: 'row', alignItems: 'center' },
    avatarStack: { flexDirection: 'row', marginRight: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 2, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
    membersCount: { color: Colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
    addMemberBtnTop: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(234, 88, 12, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    addMemberTextTop: { color: Colors.primary, marginLeft: 6, fontWeight: 'bold', fontSize: 14 },
    card: { padding: 16, marginBottom: 12 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expDesc: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
    expSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
    expAmount: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 20, fontSize: 16 },
    sectionTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    settleText: { color: Colors.textSecondary, fontSize: 15 },
    bold: { color: Colors.textPrimary, fontWeight: 'bold' },
    settleAmount: { color: Colors.danger, fontSize: 20, fontWeight: '900', marginTop: 8 },
    settleBtn: { backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
    settleBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    sheetTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.textPrimary, fontSize: 16, marginBottom: 16 },
    saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    splitToggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 16, padding: 4 },
    splitToggle: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    splitToggleActive: { backgroundColor: Colors.primary },
    splitToggleText: { color: Colors.textSecondary, fontWeight: 'bold' },
    splitToggleTextActive: { color: Colors.white },
    customSplitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    customSplitName: { color: Colors.textPrimary, fontSize: 16, flex: 1 },
    customSplitInput: { width: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, color: Colors.textPrimary, textAlign: 'center' },
    upiBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center' },
    upiBtnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold' }
});
