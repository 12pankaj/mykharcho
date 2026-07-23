import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import { Users, Mail, Phone, Crown } from 'lucide-react-native';
import apiService from '../../api/apiService';

export default function AdminUsersScreen() {
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        try {
            // NOTE: apiService.getAdminUsers needs to be implemented
            const res = await apiService.getAdminUsers?.() || { data: { users: [] } };
            setUsers(res.data.users);
        } catch (err) {
            console.error('Failed to load users', err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <Header title="Users" subtitle="Platform Directory" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <GlassCard style={styles.statsCard} intensity="medium">
                    <View style={styles.statsIcon}>
                        <Users color={Colors.primary} size={24} />
                    </View>
                    <View>
                        <Text style={styles.statsLabel}>Total Registered Users</Text>
                        <Text style={styles.statsValue}>{users.length}</Text>
                    </View>
                </GlassCard>

                {users.map((user: any) => (
                    <GlassCard key={user.id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user.full_name?.substring(0, 1).toUpperCase()}</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.full_name}</Text>
                                <View style={styles.rolesRow}>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{user.role}</Text>
                                    </View>
                                    {user.is_premium && (
                                        <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', flexDirection: 'row', gap: 4 }]}>
                                            <Crown color={Colors.primary} size={10} />
                                            <Text style={[styles.badgeText, { color: Colors.primary }]}>Premium</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.contactRow}>
                            <Mail color={Colors.textSecondary} size={16} />
                            <Text style={styles.contactText}>{user.email}</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Phone color={Colors.textSecondary} size={16} />
                            <Text style={styles.contactText}>{user.phone_number || 'N/A'}</Text>
                        </View>
                    </GlassCard>
                ))}
            </ScrollView>
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
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        marginBottom: 24,
        gap: 16,
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 255, 163, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    statsValue: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: '900',
    },
    userCard: {
        padding: 20,
        marginBottom: 16,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '900',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    rolesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: Colors.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 12,
    },
    contactText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    }
});
