import React from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MaintenanceScreenProps {
    message?: string;
    expectedDuration?: string;
}

export default function MaintenanceScreen({ message, expectedDuration }: MaintenanceScreenProps) {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Animated Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="construct" size={80} color="#f97316" />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.branding}>JC GOLD & JEWELS</Text>
                <Text style={styles.title}>App Under Maintenance</Text>

                {/* Message */}
                <Text style={styles.message}>
                    {message || "We're currently performing scheduled maintenance to improve your experience. We'll be back soon!"}
                </Text>

                {/* Loading Indicator */}
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#f97316" />
                    {expectedDuration ? (
                        <View style={styles.durationBox}>
                            <Text style={styles.durationLabel}>Expected Duration</Text>
                            <Text style={styles.durationValue}>{expectedDuration}</Text>
                        </View>
                    ) : (
                        <Text style={styles.loaderText}>Please check back later</Text>
                    )}
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => {
                        // This will trigger a re-render/re-fetch in RootLayout if integrated with state
                        // For now it provides visual feedback and ensures the app is responsive
                    }}
                >
                    <Ionicons name="refresh" size={18} color="white" />
                    <Text style={styles.refreshText}>Check Again</Text>
                </TouchableOpacity>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#60a5fa" />
                    <Text style={styles.infoText}>
                        Your data is safe. All services will resume shortly.
                    </Text>
                </View>

                {/* Back to Login (Optional/Admin switch) */}
                <TouchableOpacity
                    style={styles.backToLogin}
                    onPress={async () => {
                        await SecureStore.deleteItemAsync('userToken');
                        await SecureStore.deleteItemAsync('userType');
                        // Navigate to login
                        router.replace('/login');
                    }}
                >
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#ffffff',
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffedd5',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    branding: {
        fontSize: 10,
        fontWeight: '900',
        color: '#f97316',
        letterSpacing: 4,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    message: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 10,
        fontWeight: '500',
    },
    loaderContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    loaderText: {
        marginTop: 16,
        fontSize: 13,
        color: '#9ca3af',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    durationBox: {
        marginTop: 20,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ffedd5',
        alignItems: 'center',
    },
    durationLabel: {
        fontSize: 10,
        color: '#f97316',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    durationValue: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '900',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 40,
    },
    refreshText: {
        color: 'white',
        fontWeight: '900',
        marginLeft: 10,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        width: '100%',
    },
    infoText: {
        marginLeft: 12,
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '600',
        flex: 1,
    },
    backToLogin: {
        marginTop: 40,
        padding: 10,
    },
    backToLoginText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
