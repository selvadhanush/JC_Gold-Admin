import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
    Alert,
    TextInput,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';

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
                const keys = ['MAINTENANCE_MODE', 'LOW_STOCK_THRESHOLD', 'ORDER_TIMEOUT_MINUTES', 'MAX_ORDER_AMOUNT'];
                const existingSettings = data.data || [];

                const finalSettings = keys.map(key => {
                    const found = existingSettings.find((s: any) => s.key === key);
                    return found || { key, value: key === 'MAINTENANCE_MODE' ? false : '10' };
                });

                setSettings(finalSettings);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load system settings');
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
        setSaving(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.SUPER_SETTINGS, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ settings }),
            });

            if (response.ok) {
                Alert.alert('Success', 'System configuration updated successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#000" className="mt-20" />
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
                stickyHeaderIndices={[0]}
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
                        onPress={saveSettings}
                        disabled={saving}
                        className="bg-black px-6 py-3 rounded-2xl shadow-xl shadow-black/20"
                    >
                        {saving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Deploy Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="p-6">
                    {/* Maintenance Card */}
                    <View className="bg-red-50 rounded-[32px] p-6 mb-8 border border-red-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-1 pr-6">
                                <Text className="text-red-900 font-black text-xl mb-1">Maintenance Mode</Text>
                                <Text className="text-red-600/60 text-[10px] font-bold uppercase tracking-widest">Global Override</Text>
                            </View>
                            <Switch
                                value={settings.find(s => s.key === 'MAINTENANCE_MODE')?.value || false}
                                onValueChange={() => handleToggle('MAINTENANCE_MODE')}
                                trackColor={{ false: '#fca5a5', true: '#dc2626' }}
                            />
                        </View>
                        <Text className="text-red-900/60 text-xs font-medium leading-5">
                            When active, only Super Admins can access the platform. Buyers will see a service down page.
                        </Text>
                    </View>

                    <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[4px] mb-6 ml-1">Core Thresholds</Text>

                    {/* Setting Item */}
                    <View className="bg-gray-50 rounded-[32px] p-6 mb-5 border border-gray-100">
                        <Text className="text-black font-black text-base mb-4">Inventory Alert Level</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={settings.find(s => s.key === 'LOW_STOCK_THRESHOLD')?.value?.toString()}
                            onChangeText={(v) => handleInputChange('LOW_STOCK_THRESHOLD', v)}
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
                            className="bg-white p-5 rounded-2xl font-black text-black border border-gray-100 text-lg"
                        />
                        <Text className="text-gray-400 text-[9px] font-bold mt-4 uppercase tracking-widest">Global spending limit per transaction for all users.</Text>
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
