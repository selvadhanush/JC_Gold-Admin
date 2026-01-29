import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
    TextInput,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import { Skeleton } from '../../components/Skeleton';
import MaintenanceScheduler from '../../components/MaintenanceScheduler';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

export default function SystemSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.SUPER_SETTINGS, { headers });
            const data = await response.json();
            if (data.success) {
                const keys = ['MAINTENANCE_MODE', 'LOW_STOCK_THRESHOLD', 'ORDER_TIMEOUT_MINUTES', 'MAX_ORDER_AMOUNT', 'SHOP_ADDRESS'];
                const existingSettings = data.data || [];

                const finalSettings = keys.map(key => {
                    const found = existingSettings.find((s: any) => s.key === key);
                    return found || { key, value: key === 'MAINTENANCE_MODE' ? false : '10' };
                });

                setSettings(finalSettings);
            }
        } catch (error) {
            showToast.error('Failed to load system settings', 'LOAD ERROR');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string) => {
        setSettings(prev => prev.map(s =>
            s.key === key ? { ...s, value: !s.value } : s
        ));
    };

    const handleInputChange = (key: string, val: string) => {
        setSettings(prev => prev.map(s =>
            s.key === key ? { ...s, value: val } : s
        ));
    };

    const saveSettings = async () => {
        console.log('🔵 [DEBUG] Deploy Changes button clicked!');
        console.log('🔵 [DEBUG] Current settings state:', settings);

        setSaving(true);
        try {
            console.log('🔵 [DEBUG] Getting auth headers...');
            const headers = await getAuthHeaders();
            console.log('🔵 [DEBUG] Headers obtained:', headers);

            console.log('🔵 [DEBUG] Preparing to send PATCH request to:', API_ENDPOINTS.SUPER_SETTINGS);
            console.log('🔵 [DEBUG] Request body:', JSON.stringify({ settings }));

            const response = await fetch(API_ENDPOINTS.SUPER_SETTINGS, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ settings }),
            });

            console.log('🔵 [DEBUG] Save response status:', response.status);
            console.log('🔵 [DEBUG] Save response ok:', response.ok);

            if (response.ok) {
                console.log('✅ [SUCCESS] Settings saved successfully!');
                console.log('🔵 [DEBUG] Showing success toast...');
                showToast.success('System configuration updated successfully', 'DEPLOYED');
            } else {
                const data = await response.json();
                console.log('❌ [ERROR] Save failed with data:', data);
                console.log('🔵 [DEBUG] Showing error toast...');
                showToast.error(data.message || 'Failed to save settings', 'SAVE FAILED');
            }
        } catch (error) {
            console.log('❌ [ERROR] Exception caught:', error);
            console.log('🔵 [DEBUG] Showing connection error toast...');
            showToast.error('Failed to save settings', 'CONNECTION ERROR');
        } finally {
            console.log('🔵 [DEBUG] Setting saving state to false');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" />

                {/* Header Skeleton */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                        <Skeleton width={150} height={28} />
                    </View>
                    <Skeleton width={120} height={40} borderRadius={16} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                    {/* Maintenance Card Skeleton */}
                    <View style={{ backgroundColor: '#fef2f2', borderRadius: 32, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: '#fee2e2' }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-1">
                                <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                                <Skeleton width="40%" height={10} />
                            </View>
                            <Skeleton width={50} height={30} borderRadius={15} />
                        </View>
                        <Skeleton width="100%" height={40} borderRadius={8} />
                    </View>

                    <Skeleton width={150} height={12} style={{ marginBottom: 24, marginLeft: 4 }} />

                    {/* Setting Item Skeletons */}
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ backgroundColor: '#f9fafb', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6' }}>
                            <Skeleton width="50%" height={20} style={{ marginBottom: 16 }} />
                            <Skeleton width="100%" height={56} borderRadius={16} style={{ marginBottom: 16 }} />
                            <Skeleton width="80%" height={10} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <View className="flex-row items-center">
                            <Ionicons name="construct" size={14} color="#4f46e5" className="mr-2" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                        </View>
                        <Text className="text-2xl font-black text-black">SYSTEM CONFIG</Text>
                    </View>
                    <TouchableOpacity
                        onPressOut={() => {
                            console.log('🟢 [BUTTON] Deploy Changes button onPressOut triggered!');
                            if (!saving) {
                                saveSettings();
                            }
                        }}
                        onPressIn={() => console.log('🟡 [BUTTON] Deploy Changes button touched (onPressIn)')}
                        disabled={saving}
                        activeOpacity={0.7}
                        style={{
                            backgroundColor: saving ? '#6b7280' : '#000000',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Deploy Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="p-6">
                    {/* Maintenance Mode Scheduler */}
                    <MaintenanceScheduler />

                    <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[4px] mb-6 ml-1">Core Thresholds</Text>

                    {/* Setting Item */}
                    <View className="bg-gray-50 rounded-[32px] p-6 mb-5 border border-gray-100">
                        <Text className="text-black font-black text-base mb-4">Inventory Alert Level</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={settings.find(s => s.key === 'LOW_STOCK_THRESHOLD')?.value?.toString()}
                            onChangeText={(v) => handleInputChange('LOW_STOCK_THRESHOLD', v)}
                            placeholder="Enter threshold value"
                            placeholderTextColor="#9ca3af"
                            editable={true}
                            selectTextOnFocus={true}
                            className="bg-white p-5 rounded-2xl font-black text-black border border-gray-100 text-lg"
                        />
                        <Text className="text-gray-400 text-[9px] font-bold mt-4 uppercase tracking-widest">Lower limit before system triggers "Critical Stock" flags.</Text>
                    </View>

                    <View className="bg-gray-50 rounded-[32px] p-6 mb-5 border border-gray-100">
                        <Text className="text-black font-black text-base mb-4">Order Expiry (Minutes)</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={settings.find(s => s.key === 'ORDER_TIMEOUT_MINUTES')?.value?.toString()}
                            onChangeText={(v) => handleInputChange('ORDER_TIMEOUT_MINUTES', v)}
                            placeholder="Enter timeout in minutes"
                            placeholderTextColor="#9ca3af"
                            editable={true}
                            selectTextOnFocus={true}
                            className="bg-white p-5 rounded-2xl font-black text-black border border-gray-100 text-lg"
                        />
                        <Text className="text-gray-400 text-[9px] font-bold mt-4 uppercase tracking-widest">Time-to-Live for pending checkout sessions.</Text>
                    </View>

                    <View className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                        <Text className="text-black font-black text-base mb-4">Max Transaction Cap</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={settings.find(s => s.key === 'MAX_ORDER_AMOUNT')?.value?.toString()}
                            onChangeText={(v) => handleInputChange('MAX_ORDER_AMOUNT', v)}
                            placeholder="Enter maximum amount"
                            placeholderTextColor="#9ca3af"
                            editable={true}
                            selectTextOnFocus={true}
                            className="bg-white p-5 rounded-2xl font-black text-black border border-gray-100 text-lg"
                        />
                        <Text className="text-gray-400 text-[9px] font-bold mt-4 uppercase tracking-widest">Global spending limit per transaction for all users.</Text>
                    </View>

                    <View className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                        <Text className="text-black font-black text-base mb-4">Shop Physical Address</Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            value={settings.find(s => s.key === 'SHOP_ADDRESS')?.value?.toString()}
                            onChangeText={(v) => handleInputChange('SHOP_ADDRESS', v)}
                            placeholder="Enter showroom address"
                            placeholderTextColor="#9ca3af"
                            style={{ textAlignVertical: 'top', minHeight: 120 }}
                            className="bg-white p-5 rounded-2xl font-black text-black border border-gray-100 text-sm leading-6"
                        />
                        <Text className="text-gray-400 text-[9px] font-bold mt-4 uppercase tracking-widest">This address is displayed to buyers in the Gold Wallet section for offline visits.</Text>
                    </View>

                    <View className="bg-amber-50 p-6 rounded-[28px] border border-amber-100 flex-row items-start">
                        <Ionicons name="alert-circle" size={20} color="#d97706" />
                        <View className="flex-1 ml-4">
                            <Text className="text-amber-900 font-black text-xs uppercase tracking-widest mb-1">Architecture Warning</Text>
                            <Text className="text-amber-700/60 text-[10px] font-bold leading-4">
                                These variables govern core application logic. Modifying them will affect live transaction flows immediately.
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
