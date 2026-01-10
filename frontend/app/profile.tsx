import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import * as SecureStore from 'expo-secure-store';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Password change fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, { headers });
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
                setName(data.data.name);
                setPhoneNumber(data.data.phoneNumber || '');
            }
        } catch (error) {
            console.error('Fetch Profile Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name, phoneNumber }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Profile updated successfully');
                setUser(data.data);
            } else {
                Alert.alert('Error', data.message || 'Update failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Connection failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setUpdating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PROFILE}/password`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', data.message || 'Password change failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Connection failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to exit?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('userToken');
                        await SecureStore.deleteItemAsync('userData');
                        await SecureStore.deleteItemAsync('userType');
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const renderSkeleton = () => (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50 h-16">
                <Skeleton width={100} height={24} />
            </View>
            <View className="px-6 mt-10">
                <Skeleton width="100%" height={200} style={{ borderRadius: 40 }} className="mb-10" />
                <Skeleton width={120} height={12} className="mb-6" />
                <Skeleton width="100%" height={300} style={{ borderRadius: 32 }} />
            </View>
        </SafeAreaView>
    );

    if (loading) return renderSkeleton();

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Minimal Header */}
            <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                <View className="w-10" />
                <Text className="text-xl font-black text-gray-900">Setting & Profile</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="px-6" contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Premium Profile ID Card */}
                    <View className="mt-4 mb-10">
                        <View className="bg-gray-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                            {/* Decorative gold gradient substitute */}
                            <View className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-10 -mt-10" />
                            <View className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

                            <View className="flex-row items-center mb-6">
                                <View className="w-20 h-20 bg-white/10 rounded-3xl items-center justify-center border border-white/20">
                                    <Text className="text-4xl">🤴</Text>
                                </View>
                                <View className="ml-5">
                                    <Text className="text-2xl font-black text-white">{user?.name || 'Gold Member'}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />
                                        <Text className="text-white/50 text-xs font-bold uppercase tracking-widest leading-none">Premium Buyer</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="h-[1px] bg-white/10 w-full mb-6" />

                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</Text>
                                    <Text className="text-white text-sm font-medium">{user?.email}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Member Since</Text>
                                    <Text className="text-white text-sm font-medium">Jan 2024</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Navigation Menu */}
                    <View className="mb-10">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-6">Account Settings</Text>

                        <View className="space-y-4">
                            <View className="bg-gray-50 rounded-[32px] p-6 mb-4">
                                <View className="flex-row items-center justify-between mb-6">
                                    <Text className="text-lg font-black text-gray-900">Personal Info</Text>
                                    <Ionicons name="person-outline" size={20} color="#f97316" />
                                </View>
                                <Input
                                    label="Full Name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={setName}
                                    containerClassName="mb-4"
                                />
                                <Input
                                    label="Phone Number"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    containerClassName="mb-6"
                                />
                                <Button
                                    title="Save Changes"
                                    onPress={handleUpdateProfile}
                                    loading={updating}
                                    variant="primary"
                                    className="rounded-2xl"
                                />
                            </View>

                            <View className="bg-gray-50 rounded-[32px] p-6 mb-4">
                                <View className="flex-row items-center justify-between mb-6">
                                    <Text className="text-lg font-black text-gray-900">Security & Sign-in</Text>
                                    <Ionicons name="lock-closed-outline" size={20} color="#f97316" />
                                </View>
                                <Input
                                    label="Current Password"
                                    placeholder="••••••••"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                    containerClassName="mb-4"
                                />
                                <Input
                                    label="New Password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    containerClassName="mb-4"
                                />
                                <Input
                                    label="Confirm New Password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    containerClassName="mb-6"
                                />
                                <Button
                                    title="Update Password"
                                    onPress={handleChangePassword}
                                    loading={updating}
                                    variant="primary"
                                    className="rounded-2xl"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View className="pb-20">
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="bg-red-50 py-5 rounded-[28px] items-center flex-row justify-center border border-red-100"
                        >
                            <Ionicons name="log-out-outline" size={22} color="#ef4444" className="mr-3" />
                            <Text className="text-red-500 font-black text-lg ml-2">Logout Account</Text>
                        </TouchableOpacity>

                        <Text className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-[4px] mt-8">JC Gold Version 1.0.4</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <BottomNav activeTab="profile" />
        </SafeAreaView>
    );
}
