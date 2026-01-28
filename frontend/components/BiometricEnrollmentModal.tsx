import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BiometricEnrollmentModalProps {
    visible: boolean;
    onEnroll: () => void;
    onSkip: () => void;
    biometricType?: string;
}

export const BiometricEnrollmentModal: React.FC<BiometricEnrollmentModalProps> = ({
    visible,
    onEnroll,
    onSkip,
    biometricType = 'Biometric',
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onSkip}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="finger-print" size={64} color="#f97316" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Enable {biometricType}?</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        Use {biometricType.toLowerCase()} for faster and more secure login. You can always use your password as a fallback.
                    </Text>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefit}>
                            <Ionicons name="flash" size={20} color="#10b981" />
                            <Text style={styles.benefitText}>Quick access</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                            <Text style={styles.benefitText}>Extra security</Text>
                        </View>
                        <View style={styles.benefit}>
                            <Ionicons name="lock-closed" size={20} color="#10b981" />
                            <Text style={styles.benefitText}>Auto-lock app</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity style={styles.enrollButton} onPress={onEnroll}>
                        <Text style={styles.enrollButtonText}>Enable {biometricType}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                        <Text style={styles.skipButtonText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    benefitsContainer: {
        width: '100%',
        marginBottom: 32,
    },
    benefit: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 8,
    },
    benefitText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 12,
    },
    enrollButton: {
        width: '100%',
        backgroundColor: '#f97316',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    enrollButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    skipButton: {
        paddingVertical: 12,
    },
    skipButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9ca3af',
    },
});
