import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ArrowDownRight, ArrowUpRight, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react-native';

const DUMMY_NOTIFICATIONS = [
    {
        id: '1',
        type: 'income',
        title: 'Salary Credited',
        message: '₹1,50,000 has been credited to your HDFC account.',
        time: '2 mins ago',
        isRead: false,
    },
    {
        id: '2',
        type: 'expense',
        title: 'High Spending Alert',
        message: 'You have spent 80% of your Food budget this month.',
        time: '1 hour ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'group',
        title: 'Goa Trip Settlement',
        message: 'Rahul added a new expense of ₹4,500. You owe ₹1,500.',
        time: '5 hours ago',
        isRead: true,
    },
    {
        id: '4',
        type: 'loan',
        title: 'EMI Due Tomorrow',
        message: 'Your Car Loan EMI of ₹12,000 is due on 22nd June.',
        time: '1 day ago',
        isRead: true,
    },
    {
        id: '5',
        type: 'system',
        title: 'System Update',
        message: 'MyKharcho has been updated with new AI Insights.',
        time: '2 days ago',
        isRead: true,
    }
];

export default function NotificationsScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

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
            >
                {DUMMY_NOTIFICATIONS.map((notif) => (
                    <TouchableOpacity 
                        key={notif.id} 
                        style={[styles.notificationCard, !notif.isRead && styles.unreadCard]}
                    >
                        <View style={styles.leftContent}>
                            <View style={[styles.iconWrapper, { backgroundColor: getIconBg(notif.type) }]}>
                                {getIcon(notif.type)}
                            </View>
                            <View style={styles.textContent}>
                                <Text style={[styles.title, !notif.isRead && styles.unreadText]}>{notif.title}</Text>
                                <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
                                <Text style={styles.time}>{notif.time}</Text>
                            </View>
                        </View>
                        {!notif.isRead && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
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
