import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Mail, Lock, CheckSquare, Square } from 'lucide-react-native';
import { AuthService } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: '966188039700-bd15sdstsn3flnp5qfho7vnb2rc949mh.apps.googleusercontent.com', // Must use Web Client ID for idToken
});

export default function LoginScreen({ navigation }: any) {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Removed expo-auth-session request

    useEffect(() => {
        const loadRememberedEmail = async () => {
            try {
                const storedEmail = await AsyncStorage.getItem('rememberedEmail');
                if (storedEmail) {
                    setEmail(storedEmail);
                    setRememberMe(true);
                }
            } catch (e) {
                console.error('Failed to load remembered email');
            }
        };
        loadRememberedEmail();
    }, []);

    // Handled by native sign in

    const handleNativeGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.idToken || userInfo.data?.idToken; // handle varying versions

            if (idToken) {
                const res = await AuthService.googleLogin(idToken);
                if (res.data.token) {
                    await signIn(res.data.token, res.data.user);
                } else {
                    setError('Google Login failed on server.');
                }
            } else {
                setError('Failed to get Google ID Token.');
            }
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                setError('Sign in cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                setError('Sign in already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setError('Play services not available');
            } else {
                setError('Google Login failed. Check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setError('');
        setLoading(true);
        try {
            if (rememberMe) {
                await AsyncStorage.setItem('rememberedEmail', email);
            } else {
                await AsyncStorage.removeItem('rememberedEmail');
            }

            const res = await AuthService.login(email, password);
            if (res.data.token) {
                await signIn(res.data.token, res.data.user);
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
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
                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/newlogo.png')}
                                style={{ width: 100, height: 100, borderRadius: 30 }}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.title}>
                            My<Text style={{ color: Colors.primary }}>Kharcho</Text>
                        </Text>
                        <Text style={styles.subtitle}>The Next-Gen Financial Empire</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

                        <View style={styles.inputGroup}>
                            <Lock size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                style={styles.rememberMeContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                {rememberMe ? (
                                    <CheckSquare size={18} color={Colors.primary} />
                                ) : (
                                    <Square size={18} color={Colors.textSecondary} />
                                )}
                                <Text style={styles.rememberMeText}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
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
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Elite Access</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleNativeGoogleLogin}
                            disabled={loading}
                        >
                            <Image style={styles.googleIcon} source={{ uri: 'https://www.svgrepo.com/show/475656/google.svg' }} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>New to the empire? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>Initiate Access</Text>
                            </TouchableOpacity>
                        </View>
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
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 8,
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
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 20,
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
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberMeText: {
        color: Colors.textSecondary,
        marginLeft: 8,
        fontSize: 14,
    },
    forgotPassword: {
        alignSelf: 'center',
    },
    forgotPasswordText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    loginButton: {
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
    loginButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        color: Colors.textSecondary,
        paddingHorizontal: 15,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        height: 60,
        marginBottom: 10,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    googleButtonText: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    signupText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    signupLink: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: 'bold',
    },
});
