import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react-native';
import { GroupService } from '../api/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddGroupMemberScreen({ route, navigation }: any) {
    const { groupId, refreshCallback } = route.params || {};

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddMember = async () => {
        if (!newMemberEmail.trim()) {
            Alert.alert("Error", "Please enter an email address");
            return;
        }

        setSubmitting(true);
        try {
            await GroupService.addMember(groupId, newMemberEmail);
            
            if (refreshCallback) {
                refreshCallback();
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Could not add member");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={Colors.white} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Member</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <View style={styles.iconContainer}>
                        <UserPlus color={Colors.primary} size={48} />
                    </View>
                    <Text style={styles.subtitle}>Add a user by their registered email address to this group.</Text>

                    <Text style={styles.inputLabel}>User Email *</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. friend@example.com" 
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={newMemberEmail}
                        onChangeText={setNewMemberEmail}
                        autoFocus
                    />

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleAddMember} 
                        disabled={submitting}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 color="#000" size={20} />
                                    <Text style={styles.saveButtonText}>Add to Group</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
    },
    subtitle: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 14,
        paddingHorizontal: 20,
    },
    inputLabel: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: Colors.white,
        fontSize: 16,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    saveButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
