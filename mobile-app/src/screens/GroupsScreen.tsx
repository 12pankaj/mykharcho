import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { Users, Plus, ArrowRight } from 'lucide-react-native';
import { GroupService } from '../api/apiService';
import CustomBottomSheet from '../components/CustomBottomSheet';

export default function GroupsScreen({ navigation }: any) {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetVisible, setSheetVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    const fetchGroups = async () => {
        try {
            const res = await GroupService.getGroups();
            setGroups(res.data);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchGroups();
        });
        return unsubscribe;
    }, [navigation]);

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        try {
            await GroupService.createGroup({ name: newGroupName, description: newGroupDesc });
            setSheetVisible(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchGroups();
        } catch (error) {
            Alert.alert("Error", "Could not create group");
        }
    };

    const renderGroup = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}>
            <GlassCard intensity="heavy" style={styles.groupCard}>
                <View style={styles.groupCardTop}>
                    <View style={styles.iconBox}>
                        <Users color={Colors.primary} size={24} />
                    </View>
                    <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{item.name}</Text>
                        <Text style={styles.groupDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
                    </View>
                </View>
                
                <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <ArrowRight color={Colors.primary} size={18} />
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header title="Splitwise" subtitle="Manage Group Expenses" />
            
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : groups.length === 0 ? (
                <View style={styles.center}>
                    <Users color={Colors.textSecondary} size={48} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>You are not part of any groups.</Text>
                </View>
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderGroup}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setSheetVisible(true)}>
                <Plus color={Colors.white} size={28} />
            </TouchableOpacity>

            <CustomBottomSheet visible={isSheetVisible} onClose={() => setSheetVisible(false)} height={400}>
                <Text style={styles.sheetTitle}>Create New Group</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Group Name (e.g. Goa Trip)"
                    placeholderTextColor={Colors.textSecondary}
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Description (Optional)"
                    placeholderTextColor={Colors.textSecondary}
                    value={newGroupDesc}
                    onChangeText={setNewGroupDesc}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGroup}>
                    <Text style={styles.saveBtnText}>Create</Text>
                </TouchableOpacity>
            </CustomBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    listContent: { padding: 20, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
    groupCard: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 24,
    },
    groupCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    groupInfo: { flex: 1 },
    groupName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 4 },
    groupDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
    viewDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    viewDetailsText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
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
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
        marginBottom: 16,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
