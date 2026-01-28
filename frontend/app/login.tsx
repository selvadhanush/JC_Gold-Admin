import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS } from '../api';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    React.useEffect(() => {
        if (!isNavigating) {
            checkStoredToken();
        }
    }, []);

    const checkStoredToken = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const userType = await SecureStore.getItemAsync('userType');
            const userDataString = await SecureStore.getItemAsync('userData');

            if (token && userType && userDataString) {
                setIsNavigating(true);
                const userData = JSON.parse(userDataString);

                if (userType === 'admin') {
                    const role = userData.role;
                    switch (role) {
                        case 'SUPER_ADMIN':
                            router.replace('/Superadmin');
                            break;
                        case 'PRODUCT_ADMIN':
                            router.replace('/Productadmin');
                            break;
                        case 'ORDER_ADMIN':
                            router.replace('/Orderadmin');
                            break;
                        case 'FINANCE_ADMIN':
                            router.replace('/Financeadmin');
                            break;
                        default:
                            router.replace('/dashboard');
                    }
                } else {
                    router.replace('/buyer_dashboard');
                }
            }
        } catch (err) {
            console.error('Error checking stored session:', err);
        }
    };

    const fetchWithTimeout = async (url: string, options: any, timeout = 15000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Checking Credentials...');

            // 1. First attempt Admin Login (Multi-Role)
            const adminResponse = await fetchWithTimeout(API_ENDPOINTS.ADMIN_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const adminData = await adminResponse.json();

            if (adminResponse.ok && adminData.success) {
                const role = adminData.admin.role;
                console.log('Admin logged in as:', role);

                // Store token and user data
                await SecureStore.setItemAsync('userToken', adminData.token);
                await SecureStore.setItemAsync('userData', JSON.stringify(adminData.admin));
                await SecureStore.setItemAsync('userType', 'admin');
                await SecureStore.deleteItemAsync('mpinVerified');

                setLoading(false);

                // Role-Based Redirection
                switch (role) {
                    case 'SUPER_ADMIN':
                        router.replace('/Superadmin');
                        break;
                    case 'PRODUCT_ADMIN':
                        router.replace('/Productadmin');
                        break;
                    case 'ORDER_ADMIN':
                        router.replace('/Orderadmin');
                        break;
                    case 'FINANCE_ADMIN':
                        router.replace('/Financeadmin');
                        break;
                    default:
                        router.replace('/dashboard');
                }
                return;
            }

            // 2. If not an Admin, attempt Buyer Login
            const buyerResponse = await fetchWithTimeout(API_ENDPOINTS.BUYER_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const buyerData = await buyerResponse.json();

            if (buyerResponse.ok && buyerData.success) {
                console.log('Buyer Login Success');

                // Store token and user data
                await SecureStore.setItemAsync('userToken', buyerData.data.token);
                await SecureStore.setItemAsync('userData', JSON.stringify(buyerData.data.user));
                await SecureStore.setItemAsync('userType', 'buyer');
                await SecureStore.deleteItemAsync('mpinVerified');

                setLoading(false);
                router.replace('/buyer_dashboard');
                return;
            }

            // 3. If both fail
            setLoading(false);
            setError(buyerData.message || adminData.message || 'Invalid credentials');
        } catch (err: any) {
            setLoading(false);
            if (err.name === 'AbortError') {
                setError('Server timed out. Check if server is running.');
            } else {
                setError('Server connection failed. Check your network.');
            }
            console.error('Login Error:', err);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-8 pt-8">
                        {/* Branding */}
                        <View className="items-center mb-10">
                            <View className="w-20 h-20 bg-primary-600 rounded-3xl items-center justify-center shadow-xl shadow-primary-500/50 mb-4">
                                <Text className="text-4xl">✨</Text>
                            </View>
                            <Text className="text-3xl font-bold text-gray-900 tracking-tight">JC GOLD</Text>
                            <Text className="text-gray-500 font-medium">Premier Jewellery Experience</Text>
                        </View>

                        {/* Welcome Text */}
                        <View className="mb-8">
                            <Text className="text-3xl font-bold text-gray-900 mb-2">Login</Text>
                            <Text className="text-gray-500">Sign in to continue to your portal</Text>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 flex-row items-center">
                                <Text className="text-red-500 mr-2 text-lg">⚠️</Text>
                                <Text className="text-red-600 font-medium flex-1">{error}</Text>
                            </View>
                        ) : null}

                        {/* Form */}
                        <View className="space-y-4">
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                icon="📧"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <View>
                                <Input
                                    label="Password"
                                    placeholder="Enter your password"
                                    icon="🔒"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 bottom-4"
                                >
                                    <Text className="text-primary-600 font-bold text-sm">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity className="self-end py-2">
                                <Text className="text-gray-400 font-medium text-sm">Forgot Password?</Text>
                            </TouchableOpacity>

                            <Button
                                title="Sign In"
                                onPress={handleLogin}
                                loading={loading}
                                size="lg"
                                className="mt-4 shadow-lg shadow-primary-500/40"
                            />
                        </View>

                        {/* New User Section */}
                        <View className="mt-auto pb-10 items-center">
                            <View className="flex-row items-center">
                                <Text className="text-gray-500">Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/signup')}>
                                    <Text className="text-primary-600 font-bold">Sign Up</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-6 flex-row items-center opacity-30">
                                <View className="h-[1px] bg-gray-300 flex-1" />
                                <Text className="mx-4 text-xs font-bold text-gray-500">JC GOLD SYSTEMS</Text>
                                <View className="h-[1px] bg-gray-300 flex-1" />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
