import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    title: string;
    subtitle?: string;
    onNotificationPress?: () => void;
}

export default function Header({ title, subtitle, onNotificationPress }: HeaderProps) {
    const insets = useSafeAreaInsets();
    
    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top + 20, 60) }]}>
            <View>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.iconButton}>
                    <Search color={Colors.textSecondary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                    <Bell color={Colors.textSecondary} size={20} />
                    <View style={styles.badge} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
        borderWidth: 2,
        borderColor: Colors.surface,
    }
});
