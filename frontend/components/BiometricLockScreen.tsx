import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBiometric } from '../contexts/BiometricContext';

interface BiometricLockScreenProps {
    onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
    const { authenticate, supportedTypes } = useBiometric();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState('');

    const handleBiometricAuth = async () => {
        setIsAuthenticating(true);
        setError('');

        const success = await authenticate('Unlock JC Gold & Jewels');

        if (success) {
            onUnlock();
        } else {
            setError('Authentication failed. Please try again.');
        }

        setIsAuthenticating(false);
    };

    const biometricType = supportedTypes[0] || 'Biometric';

    return (
        <Modal visible={true} animationType="fade">
            <View style={styles.container}>
                {/* Logo/Branding */}
                <View style={styles.header}>
                    <Text style={styles.branding}>JC GOLD & JEWELS</Text>
                    <Text style={styles.subtitle}>App Locked</Text>
                </View>

                {/* Biometric Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={biometricType === 'Face Recognition' ? 'scan' : 'finger-print'}
                            size={80}
                            color="#f97316"
                        />
                    </View>
                </View>

                {/* Message */}
                <Text style={styles.message}>
                    Use {biometricType.toLowerCase()} to unlock
                </Text>

                {/* Error Message */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Unlock Button */}
                <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={handleBiometricAuth}
                    disabled={isAuthenticating}
                >
                    {isAuthenticating ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="lock-open" size={20} color="white" />
                            <Text style={styles.unlockButtonText}>Unlock</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info */}
                <Text style={styles.info}>
                    Your session is still active. Unlock to continue.
                </Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    branding: {
        fontSize: 12,
        fontWeight: '900',
        color: '#f97316',
        letterSpacing: 4,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffedd5',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    message: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 32,
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '600',
        marginLeft: 8,
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316',
        paddingHorizontal: 48,
        paddingVertical: 18,
        borderRadius: 20,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 24,
        minWidth: 200,
        justifyContent: 'center',
    },
    unlockButtonText: {
        color: 'white',
        fontWeight: '900',
        marginLeft: 12,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    info: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
    },
});
