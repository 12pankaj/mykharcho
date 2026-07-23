import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { AuthService } from '../api/apiService';

export default function SignupScreen({ navigation }: any) {
    const { signIn } = useAuth();
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referredByCode, setReferredByCode] = useState('');

    const handleSignup = async () => {
        if(email && password && fullName) {
            try {
                // Call actual signup API
                const res = await AuthService.signup({ fullName, email, password, referredByCode });
                if (res.data && res.data.token) {
                    await signIn(res.data.token, res.data.user);
                }
            } catch (err: any) {
                console.error('Signup failed:', err);
                const errorMessage = err.response?.data?.message || 'Failed to create account. Please try again.';
                Alert.alert('Signup Failed', errorMessage);
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>M</Text>
                    </View>
                    <Text style={styles.title}>Join MyKharcho</Text>
                    <Text style={styles.subtitle}>Start tracking your wealth today</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Rahul Sharma"
                            placeholderTextColor={Colors.textSecondary}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Referral Code (Optional)</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="e.g. PANKAJ"
                            placeholderTextColor={Colors.textSecondary}
                            autoCapitalize="characters"
                            value={referredByCode}
                            onChangeText={(val) => setReferredByCode(val.toUpperCase())}
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSignup}>
                        <Text style={styles.buttonText}>Create Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log in</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    logoText: {
        color: '#000',
        fontSize: 40,
        fontWeight: '900',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    linkTextBold: {
        color: Colors.primary,
        fontWeight: '800',
    }
});
