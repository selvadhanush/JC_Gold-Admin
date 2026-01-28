import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MpinInput from '../components/MpinInput';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';

export default function MpinSetup() {
    const router = useRouter();
    const [step, setStep] = useState<'SET' | 'CONFIRM'>('SET');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (step === 'SET') {
            if (pin.length < 6) {
                showToast.error('Please enter a 6-digit MPIN');
                return;
            }
            setStep('CONFIRM');
        } else {
            if (confirmPin.length < 6) {
                showToast.error('Please confirm your 6-digit MPIN');
                return;
            }
            if (pin !== confirmPin) {
                showToast.error('MPINs do not match. Please try again.');
                setConfirmPin('');
                setStep('SET');
                setPin('');
                return;
            }
            submitMpin();
        }
    };

    const submitMpin = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_MPIN_SET, {
                method: 'POST',
                headers,
                body: JSON.stringify({ mpin: pin }),
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Security MPIN set successfully! ✨');
                router.replace('/mpin_verification');
            } else {
                showToast.error(data.message || 'Failed to set MPIN');
                setPin('');
                setConfirmPin('');
                setStep('SET');
            }
        } catch (error) {
            showToast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Ionicons
                            name={step === 'SET' ? "lock-closed-outline" : "shield-checkmark-outline"}
                            size={40}
                            color="#ea580c"
                        />
                    </View>
                    <Text style={styles.title}>
                        {step === 'SET' ? 'Set Secure MPIN' : 'Confirm MPIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'SET'
                            ? 'Create a 6-digit MPIN to secure your account and digital gold vault.'
                            : 'Please re-enter your 6-digit MPIN to confirm.'}
                    </Text>
                </View>

                <View style={styles.inputSection}>
                    <MpinInput
                        value={step === 'SET' ? pin : confirmPin}
                        onValueChange={step === 'SET' ? setPin : setConfirmPin}
                        secure={true}
                        disabled={loading}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={loading}
                        style={[styles.button, loading && styles.buttonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>
                                    {step === 'SET' ? 'Continue' : 'Secure My Account'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    {step === 'CONFIRM' && (
                        <TouchableOpacity
                            onPress={() => {
                                setStep('SET');
                                setConfirmPin('');
                            }}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>Back to change</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.notice}>
                    <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
                    <Text style={styles.noticeText}>
                        Your MPIN will be required every time you open the app.
                    </Text>
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
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconBox: {
        width: 80,
        height: 80,
        backgroundColor: '#fff7ed',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
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
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    inputSection: {
        marginBottom: 40,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#111827',
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
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: 'bold',
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    noticeText: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 8,
    }
});
