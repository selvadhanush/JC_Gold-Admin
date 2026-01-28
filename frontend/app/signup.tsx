import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS } from '../api';

export default function Signup() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !phone) {
            setError('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            console.log('Attempting User Registration...');
            const response = await fetch(API_ENDPOINTS.BUYER_REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone }),
            });

            const data = await response.json();

            setLoading(false);
            if (response.ok && data.success) {
                console.log('Registration Success');

                // Store token and user data
                await SecureStore.setItemAsync('userToken', data.data.token);
                await SecureStore.setItemAsync('userData', JSON.stringify(data.data.user));
                await SecureStore.setItemAsync('userType', 'buyer');

                router.replace('/mpin_setup');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setLoading(false);
            setError('Server connection failed. Check your network.');
            console.error('Signup Error:', err);
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
                    <View className="flex-1 px-8 pt-6 pb-10">
                        {/* Header Section */}
                        <View className="mb-10 items-center">
                            <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-4">
                                <Text className="text-3xl">👋</Text>
                            </View>
                            <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
                            <Text className="text-gray-500 mt-1">Join the JC Gold community</Text>
                        </View>

                        {/* Form Section */}
                        <View>
                            {error ? (
                                <View className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                                    <Text className="text-red-600 text-sm font-medium">{error}</Text>
                                </View>
                            ) : null}

                            <Input
                                label="Full Name"
                                placeholder="Enter your full name"
                                icon="👤"
                                value={name}
                                onChangeText={setName}
                                containerClassName="mb-4"
                            />

                            <Input
                                label="Email Address"
                                placeholder="name@example.com"
                                icon="📧"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                containerClassName="mb-4"
                            />

                            <Input
                                label="Phone Number"
                                placeholder="+91 00000 00000"
                                icon="📱"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                containerClassName="mb-4"
                            />

                            <Input
                                label="Password"
                                placeholder="••••••••"
                                icon="🔒"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                containerClassName="mb-4"
                            />

                            <Input
                                label="Confirm Password"
                                placeholder="••••••••"
                                icon="🛡️"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                containerClassName="mb-8"
                            />

                            <Button
                                title="Sign Up"
                                onPress={handleSignup}
                                loading={loading}
                                size="lg"
                                className="shadow-lg shadow-primary-500/30"
                            />
                        </View>

                        {/* Footer Section */}
                        <View className="mt-8 items-center">
                            <Text className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <TouchableOpacity onPress={() => router.push('/login')}>
                                    <Text className="text-primary-600 font-bold top-[3px]">Login</Text>
                                </TouchableOpacity>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
