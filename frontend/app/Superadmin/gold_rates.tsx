import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';

export default function GoldRates() {
    const router = useRouter();
    const [goldRates, setGoldRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const headers = await getAuthHeaders();
            const ratesRes = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const ratesData = await ratesRes.json();
            if (ratesData.success) {
                setGoldRates(ratesData.data || []);
            }
        } catch (error) {
            console.error('Error fetching rates:', error);
            setGoldRates([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRates();
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 py-5 flex-row items-center justify-between border-b border-gray-100">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 mr-4"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-[10px] font-black uppercase tracking-[3px] text-amber-600 mb-1">View Only Mode</Text>
                        <Text className="text-2xl font-black text-gray-900">Gold Rate History</Text>
                    </View>
                </View>
                <View className="bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                    <Text className="text-amber-700 text-[9px] font-black uppercase tracking-wider">Read Only</Text>
                </View>
            </View>

            {/* Info Banner */}
            <View className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex-row items-center">
                <View className="bg-blue-100 w-10 h-10 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="information-circle" size={24} color="#2563eb" />
                </View>
                <View className="flex-1">
                    <Text className="text-blue-900 font-black text-xs mb-1">Super Admin View</Text>
                    <Text className="text-blue-700 text-[10px] font-medium">You can view gold rate history but cannot modify rates</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />}
            >
                <View className="p-6">
                    <Text className="text-black font-black text-lg mb-4">Rate History</Text>
                    {loading ? (
                        <Text className="text-gray-400 text-center py-10">Loading...</Text>
                    ) : goldRates.length === 0 ? (
                        <View className="items-center justify-center py-16">
                            <View className="bg-gray-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ionicons name="trending-up" size={40} color="#f59e0b" />
                            </View>
                            <Text className="text-gray-900 font-black text-base mb-2">No Rates Found</Text>
                            <Text className="text-gray-400 text-sm">No rate history available</Text>
                        </View>
                    ) : (
                        goldRates.map(rate => (
                            <View key={rate._id} className="bg-gray-50 p-5 rounded-[24px] mb-4 border border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{rate.metalType}</Text>
                                        <Text className="text-gray-900 font-black text-2xl">₹{rate.ratePerGram?.toLocaleString()}</Text>
                                        <Text className="text-gray-500 text-xs mt-1">per gram</Text>
                                    </View>
                                    {rate.isActive && (
                                        <View className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                                            <View className="flex-row items-center">
                                                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                                <Text className="text-green-700 text-[9px] font-black uppercase">Active</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View className="bg-white rounded-xl p-3 mb-3">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-500 text-xs">Updated:</Text>
                                        <Text className="text-gray-900 text-xs font-bold">
                                            {new Date(rate.updatedAt).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-500 text-xs">Created:</Text>
                                        <Text className="text-gray-900 text-xs font-bold">
                                            {new Date(rate.createdAt).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center">
                                    <Ionicons name="lock-closed" size={16} color="#d97706" />
                                    <Text className="text-amber-700 text-xs font-bold ml-2">View Only - Cannot Modify Rates</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
