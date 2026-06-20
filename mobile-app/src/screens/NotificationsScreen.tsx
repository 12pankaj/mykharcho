import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ArrowDownRight, ArrowUpRight, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { NotificationService } from '../api/apiService';

// Format date helper
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
};

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await NotificationService.getAll();
            setNotifications(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationClick = async (notif: any) => {
        if (!notif.is_read) {
            try {
                await NotificationService.markAsRead(notif.id);
                // Optimistically update UI
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error('Failed to mark as read', err);
            }
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'income': return <ArrowDownRight color={Colors.success} size={24} />;
            case 'expense': return <ArrowUpRight color={Colors.danger} size={24} />;
            case 'group': return <MessageSquare color={Colors.primary} size={24} />;
            case 'loan': return <AlertCircle color={Colors.warning} size={24} />;
            case 'system': return <CheckCircle2 color={Colors.accent} size={24} />;
            default: return <Bell color={Colors.textSecondary} size={24} />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'income': return 'rgba(34, 197, 94, 0.1)';
            case 'expense': return 'rgba(239, 68, 68, 0.1)';
            case 'group': return 'rgba(59, 130, 246, 0.1)';
            case 'loan': return 'rgba(234, 179, 8, 0.1)';
            case 'system': return 'rgba(168, 85, 247, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Notifications" subtitle="ALERTS & UPDATES" />
            
            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 60) }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                        <Bell color={Colors.textMuted} size={48} style={{ marginBottom: 16 }} />
                        <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((notif) => (
                        <TouchableOpacity 
                            key={notif.id} 
                            style={[styles.notificationCard, !notif.is_read && styles.unreadCard]}
                            onPress={() => handleNotificationClick(notif)}
                        >
                            <View style={styles.leftContent}>
                                <View style={[styles.iconWrapper, { backgroundColor: getIconBg(notif.type) }]}>
                                    {getIcon(notif.type)}
                                </View>
                                <View style={styles.textContent}>
                                    <Text style={[styles.title, !notif.is_read && styles.unreadText]}>{notif.title}</Text>
                                    <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
                                    <Text style={styles.time}>{formatTimeAgo(notif.created_at)}</Text>
                                </View>
                            </View>
                            {!notif.is_read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))
                )}
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
        paddingTop: 10,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    unreadCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    leftContent: {
        flexDirection: 'row',
        flex: 1,
        gap: 16,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    unreadText: {
        color: Colors.primary,
    },
    message: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 8,
    },
    time: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
        marginTop: 6,
    }
});
