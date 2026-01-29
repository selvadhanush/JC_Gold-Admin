import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import MpinInput from '../components/MpinInput';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';

export default function MpinVerification() {
    const router = useRouter();
    const { redirect } = useLocalSearchParams();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        loadUser();

        // Prevent back button on lock screen
        const backAction = () => {
            return true; // Disable back button
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, []);

    const loadUser = async () => {
        try {
            const stored = await SecureStore.getItemAsync('userData');
            if (stored) {
                const user = JSON.parse(stored);
                setUserName(user.name?.split(' ')[0] || 'User');
            }
        } catch (error) { }
    };

    const handleVerify = async () => {
        if (pin.length < 6) {
            showToast.error('Please enter your 6-digit MPIN');
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_MPIN_VERIFY, {
                method: 'POST',
                headers,
                body: JSON.stringify({ mpin: pin }),
            });

            const data = await response.json();
            if (data.success) {
                // Store that MPIN is verified for this session
                await SecureStore.setItemAsync('mpinVerified', 'true');

                // Store the MPIN-verified token for backend requests
                if (data.token) {
                    await SecureStore.setItemAsync('userToken', data.token);
                }
                if (data.refreshToken) {
                    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
                }

                showToast.success('Welcome back! ✨');

                if (redirect) {
                    router.replace(redirect as any);
                } else {
                    router.replace('/buyer_dashboard');
                }
            } else {
                showToast.error(data.message || 'Invalid MPIN');
                setPin('');
            }
        } catch (error) {
            showToast.error('Verification failed. Please check network.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        await SecureStore.deleteItemAsync('mpinVerified');
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Ionicons name="lock-closed" size={40} color="#ea580c" />
                    </View>
                    <Text style={styles.title}>Unlock Account</Text>
                    <Text style={styles.subtitle}>
                        Welcome back, <Text style={styles.userName}>{userName}</Text>!{'\n'}
                        Please enter your 6-digit MPIN.
                    </Text>
                </View>

                <View style={styles.inputSection}>
                    <MpinInput
                        value={pin}
                        onValueChange={setPin}
                        secure={true}
                        disabled={loading}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={loading}
                        style={[styles.button, loading && styles.buttonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Unlock Dashboard</Text>
                                <Ionicons name="key" size={20} color="white" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <Text style={styles.logoutText}>Switch Account / Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.securitySeal}>
                    <Ionicons name="shield-checkmark" size={12} color="#9ca3af" />
                    <Text style={styles.securityText}>End-to-End Encrypted Finance Vault</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconBox: {
        width: 80,
        height: 80,
        backgroundColor: '#fff7ed',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    userName: {
        color: '#111827',
        fontWeight: '900',
    },
    inputSection: {
        marginBottom: 40,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#111827',
        width: '100%',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginTop: 24,
        padding: 10,
    },
    logoutText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    securitySeal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        opacity: 0.6,
    },
    securityText: {
        fontSize: 10,
        color: '#9ca3af',
        marginLeft: 6,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
