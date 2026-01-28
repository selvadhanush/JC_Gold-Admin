import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { Stack } from 'expo-router';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { View, Text, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';
import MaintenanceScreen from '../components/MaintenanceScreen';
import MaintenanceWarningModal from '../components/MaintenanceWarningModal';

const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            style={{
                borderLeftWidth: 0,
                backgroundColor: '#ffffff',
                height: 80,
                borderRadius: 24,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
                paddingRight: 15,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#064e3b',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
            }}
            text2Style={{
                fontSize: 14,
                color: '#065f46',
                fontWeight: '600',
                marginTop: 2,
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 20 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                    </View>
                </View>
            )}
        />
    ),
    error: (props: any) => (
        <ErrorToast
            {...props}
            style={{
                borderLeftWidth: 0,
                backgroundColor: '#ffffff',
                height: 80,
                borderRadius: 24,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
                paddingRight: 15,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#7f1d1d',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
            }}
            text2Style={{
                fontSize: 14,
                color: '#991b1b',
                fontWeight: '600',
                marginTop: 2,
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 20 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="alert-circle" size={28} color="#ef4444" />
                    </View>
                </View>
            )}
        />
    ),
    info: (props: any) => (
        <InfoToast
            {...props}
            style={{
                borderLeftWidth: 0,
                backgroundColor: '#ffffff',
                height: 80,
                borderRadius: 24,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
                paddingRight: 15,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#1e3a8a',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
            }}
            text2Style={{
                fontSize: 14,
                color: '#1e40af',
                fontWeight: '600',
                marginTop: 2,
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 20 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="information-circle" size={28} color="#3b82f6" />
                    </View>
                </View>
            )}
        />
    ),
    warning: (props: any) => (
        <BaseToast
            {...props}
            style={{
                borderLeftWidth: 0,
                backgroundColor: '#ffffff',
                height: 80,
                borderRadius: 24,
                shadowColor: '#f97316',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
                paddingRight: 15,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#7c2d12',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
            }}
            text2Style={{
                fontSize: 14,
                color: '#9a3412',
                fontWeight: '600',
                marginTop: 2,
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 20 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="warning" size={28} color="#f97316" />
                    </View>
                </View>
            )}
        />
    )
};

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const appState = useRef(AppState.currentState);
    const [isAppReady, setIsAppReady] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);

    // Get maintenance status for buyers
    const maintenanceStatus = useMaintenanceStatus(userType || undefined);

    // List of public routes that don't need MPIN lock
    const publicRoutes = ['login', 'signup', 'index', 'mpin_setup', 'mpin_verification'];

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        checkSession();
        return () => {
            subscription.remove();
        };
    }, [segments]);

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            console.log('App has come to the foreground!');
            // Reset verification on foreground if needed, or keep it simple
            // For now, only lock on fresh start or manual re-lock
        }
        appState.current = nextAppState;
    };

    const checkSession = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userTypeValue = await SecureStore.getItemAsync('userType');
            setUserType(userTypeValue);
            const isMpinVerified = await SecureStore.getItemAsync('mpinVerified');
            const inPublicGroup = publicRoutes.includes(segments[0] || '');

            if (!token || userTypeValue !== 'buyer' || inPublicGroup) {
                return;
            }

            // If logged in and not in public group, check MPIN
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_MPIN_STATUS, { headers });
            const data = await response.json();

            if (data.success) {
                if (!data.data.isSet) {
                    // Force setup if not set
                    if (segments[0] !== 'mpin_setup') {
                        router.replace('/mpin_setup');
                    }
                } else if (!isMpinVerified) {
                    // Force verification if set but not verified in this ephemeral run
                    if (segments[0] !== 'mpin_verification') {
                        router.replace('/mpin_verification');
                    }
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setIsAppReady(true);
        }
    };

    // Show maintenance screen for buyers if maintenance is active
    // But don't show it if they are on a public route (like login)
    const inPublicRoute = publicRoutes.includes(segments[0] || '');
    const showMaintenanceScreen = userType === 'buyer' && maintenanceStatus.isActive && !maintenanceStatus.loading && !inPublicRoute;

    return (
        <>
            <StatusBar style="auto" />
            {showMaintenanceScreen ? (
                <>
                    <MaintenanceScreen
                        message={maintenanceStatus.message}
                        expectedDuration={maintenanceStatus.expectedDuration}
                    />
                    <Toast config={toastConfig} />
                </>
            ) : (
                <>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            headerStyle: {
                                backgroundColor: '#f97316',
                            },
                            headerTintColor: '#fff',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                        }}
                    >
                        <Stack.Screen name="login" options={{ headerShown: false }} />
                        <Stack.Screen name="signup" options={{ headerShown: false }} />
                        <Stack.Screen name="mpin_setup" options={{ headerShown: false }} />
                        <Stack.Screen name="mpin_verification" options={{ headerShown: false }} />
                        <Stack.Screen name="index" options={{ title: 'JC Gold Admin', headerShown: true }} />
                        <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: true }} />
                        <Stack.Screen name="products" options={{ title: 'Products', headerShown: true }} />
                        <Stack.Screen name="buyer_dashboard" options={{ title: 'Shop', headerShown: false }} />
                        <Stack.Screen name="profile" options={{ title: 'Profile', headerShown: true }} />
                        <Stack.Screen name="addresses" options={{ title: 'My Addresses', headerShown: true }} />
                        <Stack.Screen name="products_browse" options={{ headerShown: false }} />
                        <Stack.Screen name="product_detail" options={{ headerShown: false }} />
                        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
                        <Stack.Screen name="cart" options={{ headerShown: false }} />
                        <Stack.Screen name="orders" options={{ headerShown: false }} />
                        <Stack.Screen name="notifications" options={{ headerShown: false }} />
                        <Stack.Screen name="Superadmin" options={{ headerShown: false }} />
                        <Stack.Screen name="Productadmin" options={{ headerShown: false }} />
                        <Stack.Screen name="checkout" options={{ headerShown: false }} />
                        <Stack.Screen name="buyer_tickets" options={{ headerShown: false }} />
                        <Stack.Screen name="order_detail" options={{ headerShown: false }} />
                        <Stack.Screen name="order_support" options={{ headerShown: false }} />
                        <Stack.Screen name="digital_gold" options={{ headerShown: false }} />
                        <Stack.Screen name="schemes" options={{ headerShown: false }} />
                        <Stack.Screen name="kyc_verification" options={{ headerShown: false }} />
                        <Stack.Screen name="redeem_gold" options={{ headerShown: false }} />
                        <Stack.Screen name="redemption_status" options={{ headerShown: false }} />
                    </Stack>
                    <Toast config={toastConfig} />

                    {/* Show warning modal for buyers when maintenance is scheduled */}
                    {userType === 'buyer' && maintenanceStatus.isScheduled && maintenanceStatus.remainingSeconds > 0 && maintenanceStatus.remainingSeconds <= 60 && (
                        <MaintenanceWarningModal
                            remainingSeconds={maintenanceStatus.remainingSeconds}
                            message={maintenanceStatus.message}
                        />
                    )}
                </>
            )}
        </>
    );
}
