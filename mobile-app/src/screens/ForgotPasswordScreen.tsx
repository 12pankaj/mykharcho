import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { AuthService } from '../api/apiService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await AuthService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[Colors.background, '#1a1f35']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color={Colors.white} size={24} />
                    </TouchableOpacity>

                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a secure link</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {success ? (
                            <View style={styles.successContainer}>
                                <Text style={styles.successTitle}>Check your inbox!</Text>
                                <Text style={styles.successText}>We've sent password reset instructions to {email}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.inputGroup}>
                                    <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor={Colors.textSecondary}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={styles.submitButton} 
                                    onPress={handleReset}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primaryDark]}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={Colors.white} />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Send Reset Link</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    errorText: {
        color: Colors.danger,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    successContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 20,
        borderRadius: 20,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        alignItems: 'center',
    },
    successTitle: {
        color: '#10b981',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    successText: {
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
        height: 65,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        color: Colors.white,
        fontSize: 16,
        fontWeight: '500',
    },
    submitButton: {
        borderRadius: 20,
        overflow: 'hidden',
        height: 65,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
