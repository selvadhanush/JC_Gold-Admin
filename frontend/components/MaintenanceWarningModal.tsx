import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface MaintenanceWarningModalProps {
    remainingSeconds: number;
    message: string;
}

export default function MaintenanceWarningModal({ remainingSeconds, message }: MaintenanceWarningModalProps) {
    const [countdown, setCountdown] = useState(remainingSeconds);

    useEffect(() => {
        setCountdown(remainingSeconds);
    }, [remainingSeconds]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Only show when countdown is 1 minute or less
    if (remainingSeconds > 60 || remainingSeconds === 0) {
        return null;
    }

    return (
        <Modal
            visible={true}
            transparent={true}
            animationType="fade"
        >
            <BlurView intensity={80} style={styles.container}>
                <View style={styles.modal}>
                    {/* Warning Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="warning" size={48} color="#f59e0b" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Maintenance Alert</Text>

                    {/* Countdown */}
                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownLabel}>System maintenance in</Text>
                        <Text style={styles.countdown}>{formatTime(countdown)}</Text>
                    </View>

                    {/* Message */}
                    <Text style={styles.message}>
                        {message || 'Please save your work and logout. The system will be unavailable during maintenance.'}
                    </Text>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
                        <Text style={styles.infoText}>
                            You will be automatically logged out when maintenance begins
                        </Text>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: 32,
        padding: 32,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fde68a',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1f2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#fef3c7',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fde68a',
    },
    countdownLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400e',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    countdown: {
        fontSize: 48,
        fontWeight: '900',
        color: '#f59e0b',
        fontVariant: ['tabular-nums'],
    },
    message: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    infoText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '600',
        flex: 1,
    },
});
