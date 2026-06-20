import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';
import Header from '../../components/Header';
import GlassCard from '../../components/GlassCard';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import { Crown, Edit2, Plus, X } from 'lucide-react-native';
import apiService from '../../api/apiService';

export default function AdminPlansScreen() {
    const [plans, setPlans] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [sheetVisible, setSheetVisible] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planName, setPlanName] = useState('');
    const [planPrice, setPlanPrice] = useState('');
    const [planFeatures, setPlanFeatures] = useState('');

    const fetchPlans = async () => {
        try {
            // Reusing public plans endpoint as an admin
            const res = await apiService.getPlans?.() || { data: { plans: [] } };
            setPlans(res.data.plans);
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

    const handleSavePlan = async () => {
        if (!planName || !planPrice || !planFeatures) return;
        
        try {
            const data = {
                name: planName,
                price: parseFloat(planPrice),
                features: planFeatures
            };

            if (editingPlan) {
                // Assuming updatePlan uses put and needs the ID
                // Note: Need to implement updateAdminPlan in apiService if not done
                console.log('Update plan:', { ...data, id: editingPlan.id });
            } else {
                console.log('Create plan:', data);
            }

            setSheetVisible(false);
            setEditingPlan(null);
            setPlanName('');
            setPlanPrice('');
            setPlanFeatures('');
            // Normally fetchPlans() here
        } catch (err) {
            console.error('Failed to save plan');
        }
    };

    const openEditSheet = (plan: any) => {
        setEditingPlan(plan);
        setPlanName(plan.name);
        setPlanPrice(plan.price.toString());
        setPlanFeatures(plan.features || '');
        setSheetVisible(true);
    };

    return (
        <View style={styles.container}>
            <Header title="Manage Plans" subtitle="Subscription Pricing" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <TouchableOpacity style={styles.createBtn} onPress={() => {
                    setEditingPlan(null);
                    setPlanName('');
                    setPlanPrice('');
                    setPlanFeatures('');
                    setSheetVisible(true);
                }}>
                    <View style={styles.createIcon}>
                        <Crown color="#000" size={24} />
                    </View>
                    <Text style={styles.createText}>Create New Plan</Text>
                </TouchableOpacity>

                {plans.map((plan: any) => (
                    <GlassCard key={plan.id} style={styles.planCard}>
                        <View style={styles.planHeader}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <TouchableOpacity onPress={() => openEditSheet(plan)}>
                                <Edit2 color={Colors.primary} size={20} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.price}>₹{plan.price} <Text style={styles.duration}>/mo</Text></Text>
                        <Text style={styles.features} numberOfLines={2}>{plan.features}</Text>
                    </GlassCard>
                ))}
            </ScrollView>

            <CustomBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={600}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{editingPlan ? 'Edit Plan' : 'New Plan'}</Text>
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Plan Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Pro, Elite" 
                    placeholderTextColor={Colors.textSecondary}
                    value={planName}
                    onChangeText={setPlanName}
                />

                <Text style={styles.inputLabel}>Monthly Price (₹)</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="0.00" 
                    placeholderTextColor={Colors.textSecondary}
                    value={planPrice}
                    onChangeText={setPlanPrice}
                />

                <Text style={styles.inputLabel}>Features (Comma separated)</Text>
                <TextInput 
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                    placeholder="Add manual entries, View charts, Priority Support" 
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    value={planFeatures}
                    onChangeText={setPlanFeatures}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSavePlan}>
                    <Text style={styles.submitBtnText}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Text>
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
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 255, 163, 0.1)',
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 163, 0.2)',
    },
    createIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    createText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '900',
    },
    planCard: {
        padding: 24,
        marginBottom: 16,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    planName: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
    },
    price: {
        color: Colors.textPrimary,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 12,
    },
    duration: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    features: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
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
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
