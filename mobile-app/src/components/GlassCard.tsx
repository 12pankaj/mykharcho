import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: 'light' | 'medium' | 'heavy';
}

export default function GlassCard({ children, style, intensity = 'medium' }: GlassCardProps) {
    const opacity = intensity === 'light' ? 0.05 : intensity === 'medium' ? 0.1 : 0.15;
    
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={[`rgba(255,255,255,${opacity})`, `rgba(255,255,255,${opacity / 2})`]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)', // Slate 900 base
    },
    content: {
        padding: 20,
    }
});
