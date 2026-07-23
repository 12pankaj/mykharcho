import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, Platform, Share } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { LogOut, User, Shield, ChevronRight, Repeat, MessageSquare, Crown, Camera, Globe, Check, Gift } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

const DUMMY_AVATARS = [
    { id: 'm1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm2', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f2', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm3', url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f3', url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'm4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&h=250&q=80' },
    { id: 'f4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&h=250&q=80' },
];

export default function ProfileScreen({ navigation }: any) {
    const { signOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [isEditVisible, setIsEditVisible] = useState(false);
    const insets = useSafeAreaInsets();
    
    const [formData, setFormData] = useState({
        fullName: '',
        currency: 'INR',
        countryCode: 'IN',
        upiId: '',
        monthly_budget: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await UserService.getProfile();
                setProfile(res.data);
                setFormData({
                    fullName: res.data.full_name || '',
                    currency: res.data.preferred_currency || 'INR',
                    countryCode: res.data.country_code || 'IN',
                    upiId: res.data.upi_id || '',
                    monthly_budget: res.data.monthly_budget ? String(res.data.monthly_budget) : ''
                });
            } catch (err) {
                console.error('Failed to load profile');
            }
        };
        fetchProfile();
    }, []);

    const handleCopyCode = async () => {
        if (profile?.referral_code) {
            await Clipboard.setStringAsync(profile.referral_code);
            Alert.alert('Copied', 'Referral code copied to clipboard!');
        }
    };

    const handleShareReferral = async () => {
        if (profile?.referral_code) {
            const shareText = `Hey! Track your expenses easily with MyKharcho. Sign up using my referral link to get a 20% discount on upgrades!\nLink: https://app.mykharcho.in/signup?ref=${profile.referral_code}`;
            try {
                await Share.share({
                    message: shareText,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!formData.fullName.trim()) return;
        setIsSaving(true);
        try {
            const payload = { 
                fullName: formData.fullName, 
                currency: formData.currency, 
                countryCode: formData.countryCode, 
                upi_id: formData.upiId,
                profilePic: profile?.profile_pic
            };
            const res = await UserService.updateProfile(payload);
            setProfile(res.data);
            setIsEditVisible(false);
            Alert.alert('Success', 'Profile synchronized successfully!');
        } catch (err) {
            console.error('Failed to update profile', err);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const selectDummyAvatar = async (url: string) => {
        try {
            const payload = { 
                fullName: formData.fullName, 
                currency: formData.currency, 
                countryCode: formData.countryCode, 
                upi_id: formData.upiId,
                profilePic: url 
            };
            const res = await UserService.updateProfile(payload);
            setProfile(res.data);
            Alert.alert('Success', 'Avatar updated!');
        } catch (err) {
            Alert.alert('Error', 'Failed to select avatar');
        }
    };

    const getProfilePic = () => {
        if (!profile?.profile_pic) return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=2563eb&color=fff&size=256&font-size=0.4&bold=true`;
        if (profile.profile_pic.startsWith('http')) return profile.profile_pic;
        return `http://72.60.222.102:5010${profile.profile_pic}`;
    };

    const handleFileUpload = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                const uri = asset.uri;
                const fileType = asset.mimeType ? asset.mimeType.split('/')[1] : uri.substring(uri.lastIndexOf('.') + 1);
                const formData = new FormData();
                formData.append('image', {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    name: `profile.${fileType || 'jpg'}`,
                    type: asset.mimeType || `image/${fileType || 'jpg'}`
                } as any);

                const res = await UserService.uploadProfilePic(formData);
                setProfile({ ...profile, profile_pic: res.data.imageUrl });
                Alert.alert('Success', 'Profile picture uploaded!');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to upload image');
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Settings" subtitle="System Preferences" />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 150, 150) }]}>
                
                {/* Advanced Profile Card */}
                <GlassCard style={styles.profileCard} intensity="heavy">
                    <View style={{ position: 'relative' }}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: getProfilePic() }} style={styles.avatarImage} />
                        </View>
                        <TouchableOpacity style={styles.cameraBtn} onPress={handleFileUpload}>
                            <Camera color="#fff" size={14} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{profile?.full_name || 'Loading...'}</Text>
                        <Text style={styles.email}>{profile?.email}</Text>
                        
                        <View style={styles.badgesRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{profile?.role || 'user'}</Text>
                            </View>
                            {profile?.is_premium && (
                                <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                    <Text style={[styles.badgeText, { color: Colors.primary }]}>Premium</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </GlassCard>

                {/* Instant Avatars Section */}
                <Text style={styles.sectionTitle}>Instant Avatars</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
                    {DUMMY_AVATARS.map((avatar) => (
                        <TouchableOpacity 
                            key={avatar.id} 
                            style={[
                                styles.dummyAvatarBtn, 
                                profile?.profile_pic === avatar.url && styles.dummyAvatarSelected
                            ]}
                            onPress={() => selectDummyAvatar(avatar.url)}
                        >
                            <Image source={{ uri: avatar.url }} style={styles.dummyAvatarImg} />
                            {profile?.profile_pic === avatar.url && (
                                <View style={styles.checkOverlay}>
                                    <Check color="#fff" size={16} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Upgrade Button */}
                {!profile?.is_premium && (
                    <TouchableOpacity 
                        style={styles.upgradeBanner}
                        onPress={() => navigation.navigate('Plans')}
                    >
                        <Crown color="#000" size={24} />
                        <View style={styles.upgradeBannerText}>
                            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                            <Text style={styles.upgradeSubtitle}>Unlock all exclusive features</Text>
                        </View>
                        <ChevronRight color="#000" size={24} />
                    </TouchableOpacity>
                )}

                {/* Referral Program Card */}
                <Text style={styles.sectionTitle}>Referral Program</Text>
                <GlassCard style={styles.referralCard} intensity="medium">
                    <View style={styles.referralHeader}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)', marginRight: 16 }]}>
                            <Gift color="#f97316" size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.referralCardTitle}>Give a Month, Get a Month</Text>
                            <Text style={styles.referralCardSubtitle}>Invite friends. They get 20% off their upgrade, and you get 30 days of Pro free!</Text>
                        </View>
                    </View>

                    <View style={styles.referralContent}>
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>Your Unique Code</Text>
                            <Text style={styles.codeText}>{profile?.referral_code || '------'}</Text>
                        </View>
                        
                        <View style={styles.referralActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleCopyCode}>
                                <Text style={styles.actionBtnText}>Copy Code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]} onPress={handleShareReferral}>
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share Link</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </GlassCard>

                {/* Settings Menu */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setIsEditVisible(true)}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                                <User color={Colors.textPrimary} size={20} />
                            </View>
                            <Text style={styles.menuText}>Edit Profile</Text>
                        </View>
                        <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    {/* Automation Rules */}
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Automation')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                                <Repeat color={Colors.accent} size={20} />
                            </View>
                            <Text style={styles.menuText}>Automation Rules</Text>
                        </View>
                        <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    {/* Support Tickets */}
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('SupportTickets')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <MessageSquare color={Colors.primary} size={20} />
                            </View>
                            <Text style={styles.menuText}>Support Desk</Text>
                        </View>
                        <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    {/* Admin Access Portal */}
                    {profile?.role === 'admin' && (
                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('AdminDashboard')}
                        >
                            <View style={styles.menuLeft}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Shield color="#ef4444" size={20} />
                                </View>
                                <Text style={[styles.menuText, { color: '#ef4444' }]}>Admin Command Center</Text>
                            </View>
                            <ChevronRight color={Colors.textSecondary} size={20} />
                        </TouchableOpacity>
                    )}
                    {/* Logout */}
                    <TouchableOpacity 
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={signOut}
                    >
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <LogOut color="#ef4444" size={20} />
                            </View>
                            <Text style={[styles.menuText, { color: '#ef4444' }]}>Log Out securely</Text>
                        </View>
                        <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Edit Profile Bottom Sheet */}
            <CustomBottomSheet 
                visible={isEditVisible} 
                onClose={() => setIsEditVisible(false)}
                height={550}
            >
                <Text style={styles.sheetTitle}>Edit Profile</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.fullName}
                            onChangeText={(text) => setFormData({...formData, fullName: text})}
                            placeholder="Enter your name"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Primary Currency</Text>
                        <View style={styles.currencyRow}>
                            {['INR', 'USD', 'EUR', 'AED'].map(curr => (
                                <TouchableOpacity 
                                    key={curr} 
                                    style={[styles.currencyBtn, formData.currency === curr && styles.currencyBtnActive]}
                                    onPress={() => setFormData({...formData, currency: curr})}
                                >
                                    <Text style={[styles.currencyBtnText, formData.currency === curr && { color: '#000' }]}>{curr}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Country Code</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.countryCode}
                            onChangeText={(text) => setFormData({...formData, countryCode: text})}
                            placeholder="e.g. IN, US"
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>UPI ID</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.upiId}
                            onChangeText={(text) => setFormData({...formData, upiId: text})}
                            placeholder="e.g. name@okhdfcbank"
                            placeholderTextColor={Colors.textSecondary}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Monthly Budget (High Spending Alert)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.monthly_budget}
                            onChangeText={(text) => setFormData({...formData, monthly_budget: text})}
                            placeholder="e.g. 50000"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="numeric"
                        />
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={Colors.background} />
                        ) : (
                            <Text style={styles.saveBtnText}>Synchronize Profile</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        gap: 20,
        marginBottom: 32,
    },
    avatarContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    avatarScroll: {
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    dummyAvatarBtn: {
        width: 60,
        height: 60,
        borderRadius: 16,
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dummyAvatarSelected: {
        borderColor: Colors.primary,
    },
    dummyAvatarImg: {
        width: '100%',
        height: '100%',
    },
    checkOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(245, 158, 11, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
    },
    email: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
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
    upgradeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
    },
    upgradeBannerText: {
        flex: 1,
        marginLeft: 16,
    },
    upgradeTitle: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
    },
    upgradeSubtitle: {
        color: 'rgba(0,0,0,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
        marginLeft: 4,
    },
    menuContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        color: Colors.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '800',
    },
    sheetTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 16,
        color: Colors.textPrimary,
        fontSize: 16,
    },
    currencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    currencyBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    currencyBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    currencyBtnText: {
        color: Colors.textSecondary,
        fontWeight: '800',
        fontSize: 12,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    saveBtnText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
    referralCard: {
        padding: 20,
        marginBottom: 24,
        borderRadius: 24,
    },
    referralHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    referralCardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    referralCardSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
        lineHeight: 16,
    },
    referralContent: {
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 16,
    },
    codeContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    codeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    codeText: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
    },
    referralActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        color: Colors.textPrimary,
        fontSize: 13,
        fontWeight: '800',
    },
});
