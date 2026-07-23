import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import { Crown, Check } from 'lucide-react-native';
import apiService from '../api/apiService';

export default function PlansScreen() {
    const [plans, setPlans] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [duration, setDuration] = useState('monthly');
    const [couponCode, setCouponCode] = useState('');

    const fetchPlans = async () => {
        try {
            // Reusing the public plans endpoint 
            const res = await apiService.getPlans?.() || { data: { plans: [] } };
            setPlans(res.data.plans || []);
        } catch (err) {
            console.error('Failed to load plans', err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPlans();
        setRefreshing(false);
    };

    const handleUpgrade = (plan: any) => {
        let price = duration === 'monthly' ? plan.price_monthly : duration === 'yearly' ? plan.price_yearly : plan.price_3_year;
        
        Alert.alert(
            "Upgrade Plan",
            `Would you like to upgrade to ${plan.name} for ₹${price} (${duration})?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Pay via Razorpay", 
                    onPress: () => {
                        // Razorpay SDK integration would go here. We pass duration and couponCode to API.
                        Alert.alert("Success", "Payment simulation successful!");
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Upgrade" subtitle="Unlock Premium Features" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Duration Toggle & Coupon */}
                <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => setDuration('monthly')} style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 }, duration === 'monthly' && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={{ color: duration === 'monthly' ? '#fff' : Colors.textSecondary, fontWeight: 'bold' }}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDuration('yearly')} style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 }, duration === 'yearly' && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={{ color: duration === 'yearly' ? '#fff' : Colors.textSecondary, fontWeight: 'bold' }}>Yearly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDuration('3_year')} style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 }, duration === '3_year' && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={{ color: duration === '3_year' ? '#fff' : Colors.textSecondary, fontWeight: 'bold' }}>3 Years</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput 
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, textAlign: 'center', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }}
                        placeholder="Have a Promo Code?"
                        placeholderTextColor={Colors.textSecondary}
                        value={couponCode}
                        onChangeText={text => setCouponCode(text.toUpperCase())}
                        autoCapitalize="characters"
                    />
                </View>

                {plans.length === 0 ? (
                    <Text style={styles.emptyText}>Loading plans...</Text>
                ) : (
                    plans.map((plan: any) => {
                        const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite');
                        const isFree = plan.name.toLowerCase() === 'free';
                        
                        let monthlyEquivalent = 0;
                        let strikethrough = 0;
                        let billingText = '';
                        let savePercent = 0;

                        if (!isFree) {
                            if (duration === 'monthly') {
                                monthlyEquivalent = plan.price_monthly;
                                strikethrough = Math.round(plan.price_monthly * 1.5);
                                savePercent = 33;
                                billingText = 'Billed monthly';
                            } else if (duration === 'yearly') {
                                monthlyEquivalent = Math.round(plan.price_yearly / 12);
                                strikethrough = plan.price_monthly;
                                savePercent = Math.round((1 - (monthlyEquivalent / strikethrough)) * 100);
                                billingText = `Billed ₹${plan.price_yearly} every 12 months`;
                            } else if (duration === '3_year') {
                                monthlyEquivalent = Math.round(plan.price_3_year / 36);
                                strikethrough = plan.price_monthly;
                                savePercent = Math.round((1 - (monthlyEquivalent / strikethrough)) * 100);
                                billingText = `Billed ₹${plan.price_3_year} every 36 months`;
                            }
                        }
                        
                        return (
                            <GlassCard 
                                key={plan.id} 
                                style={[styles.planCard, isPro && styles.proCard]} 
                                intensity={isPro ? 'heavy' : 'medium'}
                            >
                                {isPro && (
                                    <View style={styles.proBadge}>
                                        <Crown color="#000" size={14} />
                                        <Text style={styles.proBadgeText}>RECOMMENDED</Text>
                                    </View>
                                )}
                                
                                <Text style={styles.planName}>{plan.name}</Text>
                                
                                {!isFree && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Text style={{ textDecorationLine: 'line-through', color: Colors.textSecondary, fontWeight: 'bold' }}>₹{strikethrough}/mo</Text>
                                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                            <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>SAVE {savePercent}%</Text>
                                        </View>
                                    </View>
                                )}
                                
                                <View style={styles.priceRow}>
                                    <Text style={styles.currency}>₹</Text>
                                    <Text style={styles.price}>{isFree ? 0 : monthlyEquivalent}</Text>
                                    <Text style={styles.duration}>/mo</Text>
                                </View>
                                
                                {!isFree && duration !== 'monthly' && (
                                    <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 16, marginTop: -16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        {billingText}
                                    </Text>
                                )}
                                
                                <View style={styles.featuresList}>
                                    {plan.features?.split(',').map((feat: string, idx: number) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <Check color={Colors.primary} size={16} />
                                            <Text style={styles.featureText}>{feat.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                                
                                <TouchableOpacity 
                                    style={[styles.upgradeBtn, isPro && styles.upgradeBtnPro]}
                                    onPress={() => handleUpgrade(plan)}
                                >
                                    <Text style={[styles.upgradeBtnText, isPro && { color: '#000' }]}>
                                        {plan.price === 0 ? 'Current Plan' : 'Upgrade Now'}
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        )
                    })
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
        paddingBottom: 40,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 40,
        fontWeight: '600',
    },
    planCard: {
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    proCard: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(0, 255, 163, 0.05)',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
        gap: 6,
    },
    proBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    planName: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    currency: {
        color: Colors.textSecondary,
        fontSize: 20,
        fontWeight: '700',
        marginRight: 4,
    },
    price: {
        color: Colors.textPrimary,
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: -2,
    },
    duration: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
    featuresList: {
        marginBottom: 32,
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    upgradeBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    upgradeBtnPro: {
        backgroundColor: Colors.primary,
    },
    upgradeBtnText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    }
});
