import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { Stack } from 'expo-router';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { View, Text, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { API_ENDPOINTS, getAuthHeaders, fetchWithAuth } from '../api';
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';
import MaintenanceScreen from '../components/MaintenanceScreen';
import MaintenanceWarningModal from '../components/MaintenanceWarningModal';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    FadeIn,
    FadeOut,
    withSpring
} from 'react-native-reanimated';
import { ActivityIndicator } from 'react-native';

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
    const [isSessionVerified, setIsSessionVerified] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);

    // Animation values
    const pulseValue = useSharedValue(1);
    const floatValue = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textScale = useSharedValue(0.9);
    const shineValue = useSharedValue(-150);

    // Mesh Gradient Values
    const blob1X = useSharedValue(-20);
    const blob1Y = useSharedValue(-20);
    const blob2X = useSharedValue(50);
    const blob2Y = useSharedValue(50);

    useEffect(() => {
        // Initial entrance
        textOpacity.value = withTiming(1, { duration: 1000 });
        textScale.value = withSpring(1, { damping: 12 });

        // Continuous Loop Animations
        pulseValue.value = withRepeat(
            withSpring(1.08, { damping: 12, stiffness: 90 }),
            -1,
            true
        );

        floatValue.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2500 }),
                withTiming(0, { duration: 2500 })
            ),
            -1,
            true
        );

        shineValue.value = withRepeat(
            withSequence(
                withTiming(300, { duration: 2000 }),
                withDelay(1500, withTiming(-150, { duration: 0 }))
            ),
            -1
        );

        // Slow mesh movement
        blob1X.value = withRepeat(withTiming(40, { duration: 8000 }), -1, true);
        blob1Y.value = withRepeat(withTiming(30, { duration: 9000 }), -1, true);
        blob2X.value = withRepeat(withTiming(-40, { duration: 7000 }), -1, true);
        blob2Y.value = withRepeat(withTiming(-30, { duration: 10000 }), -1, true);
    }, []);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: pulseValue.value },
            { translateY: floatValue.value }
        ] as any,
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ scale: textScale.value }] as any,
    }));

    const animatedShineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shineValue.value }] as any,
    }));

    const blob1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: blob1X.value },
            { translateY: blob1Y.value }
        ] as any,
    }));

    const blob2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: blob2X.value },
            { translateY: blob2Y.value }
        ] as any,
    }));

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
    }, []); // Only run on mount

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
        const startTime = Date.now();
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userTypeValue = await SecureStore.getItemAsync('userType');
            const userDataString = await SecureStore.getItemAsync('userData');
            setUserType(userTypeValue);

            // Step 1: Session Verification
            if (!token || !userTypeValue || !userDataString) {
                setIsSessionVerified(true); // Technically "verified" as guest
                if (!['login', 'signup'].includes(segments[0])) {
                    router.replace('/login');
                }
                setIsAuthorized(true);
                return;
            }

            const userData = JSON.parse(userDataString);

            // Live check with fetchWithAuth (handles auto-refresh)
            try {
                let response;
                if (userTypeValue === 'buyer') {
                    response = await fetchWithAuth(API_ENDPOINTS.BUYER_MPIN_STATUS);
                } else {
                    response = await fetchWithAuth(`${API_ENDPOINTS.DASHBOARD}/stats`);
                }

                if (!response || response.status === 401) {
                    console.warn('[Auth] Verification failed, logging out...');
                    await confirmLogout();
                    return;
                }

                setIsSessionVerified(true);

                // Step 2: Route Guard / Authorization
                if (userTypeValue === 'buyer') {
                    const data = await response.json();
                    if (data.success) {
                        if (!data.data.isSet) {
                            if (segments[0] !== 'mpin_setup') {
                                router.replace('/mpin_setup');
                                return; // Wait for redirect
                            }
                        } else {
                            const isMpinVerified = await SecureStore.getItemAsync('mpinVerified');
                            if (!isMpinVerified) {
                                if (segments[0] !== 'mpin_verification') {
                                    router.replace('/mpin_verification');
                                    return; // Wait for redirect
                                }
                            } else {
                                // Logic for auto-redirecting from login/index to dashboard
                                if (['login', 'index', undefined].includes(segments[0])) {
                                    router.replace('/buyer_dashboard' as any);
                                    return;
                                }
                            }
                        }
                    }
                } else if (userTypeValue === 'admin') {
                    if (['login', 'index', undefined].includes(segments[0])) {
                        const role = userData.role;
                        switch (role) {
                            case 'SUPER_ADMIN': router.replace('/Superadmin'); break;
                            case 'PRODUCT_ADMIN': router.replace('/Productadmin'); break;
                            case 'ORDER_ADMIN': router.replace('/Orderadmin'); break;
                            case 'FINANCE_ADMIN': router.replace('/Financeadmin'); break;
                            default: router.replace('/dashboard');
                        }
                        return;
                    }
                }

                setIsAuthorized(true);

            } catch (fetchError) {
                console.error('[Auth] Verification failed:', fetchError);
                // Allow proceeding if we have a token (maybe offline), but set guarded. 
                // For better UX, we'll let it pass if we have base data
                setIsSessionVerified(true);
                setIsAuthorized(true);
            }

        } catch (error) {
            console.error('Session check error:', error);
            setIsSessionVerified(true);
            setIsAuthorized(true);
        } finally {
            const checkTime = Date.now() - startTime;
            const minDuration = 3000;
            const remainingDelay = Math.max(0, minDuration - checkTime);

            setTimeout(() => {
                setIsAppReady(true);
            }, remainingDelay);
        }
    };

    const confirmLogout = async () => {
        await Promise.all([
            SecureStore.deleteItemAsync('userToken'),
            SecureStore.deleteItemAsync('userType'),
            SecureStore.deleteItemAsync('userData'),
            SecureStore.deleteItemAsync('mpinVerified'),
        ]);
        router.replace('/login');
    };

    if (!isAppReady || !isSessionVerified || !isAuthorized) {
        return (
            <Animated.View
                exiting={FadeOut.duration(1200)}
                style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
                {/* mesh background blobs */}
                <Animated.View style={[blob1Style, { position: 'absolute', top: -150, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: '#fff7ed', opacity: 0.6 }]} />
                <Animated.View style={[blob2Style, { position: 'absolute', bottom: -150, right: -100, width: 450, height: 450, borderRadius: 225, backgroundColor: '#fef3c7', opacity: 0.4 }]} />

                <Animated.View style={[animatedTextStyle, { alignItems: 'center', zIndex: 10 }]}>
                    {/* Main Logo Icon */}
                    <Animated.View
                        style={[
                            { width: 120, height: 120, backgroundColor: '#f97316', borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#f97316', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 20, marginBottom: 35 },
                            animatedIconStyle
                        ]}
                    >
                        <Text style={{ fontSize: 60 }}>✨</Text>
                        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: 40, height: '150%', backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '25deg' }] as any }, animatedShineStyle]} />
                    </Animated.View>

                    {/* Brand Name */}
                    <Text style={{ fontSize: 36, fontWeight: '900', color: '#111827', letterSpacing: 10, textTransform: 'uppercase' }}>
                        JC GOLD
                    </Text>

                    {/* Elegant Accents */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                        <View style={{ width: 30, height: 1.5, backgroundColor: '#f97316', opacity: 0.3 }} />
                        <Text style={{ fontSize: 12, color: '#f97316', fontWeight: '800', marginHorizontal: 15, textTransform: 'uppercase', letterSpacing: 4 }}>
                            Digital Vault
                        </Text>
                        <View style={{ width: 30, height: 1.5, backgroundColor: '#f97316', opacity: 0.3 }} />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }

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
                        <Stack.Screen name="transactions_history" options={{ headerShown: false }} />
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
