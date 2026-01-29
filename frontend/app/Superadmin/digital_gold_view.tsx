import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import Toast from 'react-native-toast-message';

export default function SuperAdminDigitalGoldView() {
    const router = useRouter();
    const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch pending purchases
            try {
                const purchasesRes = await fetch(`${API_ENDPOINTS.ADMIN_GOLD_RATE.replace('/gold-rate', '')}/transactions?status=PENDING&type=BUY`, { headers });
                const purchasesData = await purchasesRes.json();
                if (purchasesData.success) {
                    setPendingPurchases(purchasesData.data || []);
                }
            } catch (err) {
                console.log('Could not fetch purchases:', err);
                setPendingPurchases([]);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
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
                        <Text className="text-2xl font-black text-gray-900">Digital Gold Vault</Text>
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
                    <Text className="text-blue-700 text-[10px] font-medium">You can view all transactions but cannot approve or reject them</Text>
                </View>
            </View>

            <View className="px-6 mt-6 gap-4">
                <TouchableOpacity
                    onPress={() => router.push('/Superadmin/gold_rates')}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 flex-row items-center justify-between"
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center flex-1">
                        <View className="bg-blue-100 w-12 h-12 rounded-xl items-center justify-center mr-4">
                            <Ionicons name="trending-up" size={24} color="#2563eb" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-black text-base mb-1">Gold Rate History</Text>
                            <Text className="text-gray-600 text-xs">View rate history and updates</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />}
            >
                <View className="p-6">
                    {/* Purchases Section */}
                    <View>
                        <Text className="text-black font-black text-lg mb-4">Pending Purchases</Text>
                        {pendingPurchases.length === 0 ? (
                            <Text className="text-gray-400 text-center py-10">No pending purchase requests</Text>
                        ) : (
                            pendingPurchases.map(item => (
                                <View key={item._id} className="bg-gray-50 p-5 rounded-[24px] mb-4 border border-gray-200">
                                    <View className="flex-row justify-between mb-3">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Amount Paid</Text>
                                            <Text className="text-gray-900 font-black text-xl">₹{item.amountPaid?.toLocaleString()}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Gold Grams</Text>
                                            <Text className="text-emerald-600 font-black text-xl">{item.goldGrams}g</Text>
                                        </View>
                                    </View>

                                    <View className="bg-white rounded-xl p-3 mb-3">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-500 text-xs">User:</Text>
                                            <Text className="text-gray-900 text-xs font-bold">{item.user?.name || item.user?._id || 'Unknown'}</Text>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-500 text-xs">Rate/gram:</Text>
                                            <Text className="text-gray-900 text-xs font-bold">₹{item.goldRateAtTime?.toLocaleString()}</Text>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-500 text-xs">Payment Method:</Text>
                                            <Text className="text-gray-900 text-xs font-bold">{item.paymentMethod || 'N/A'}</Text>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <Text className="text-gray-500 text-xs">Transaction ID:</Text>
                                            <Text className="text-gray-900 text-xs font-mono font-bold">{item.transactionId || 'N/A'}</Text>
                                        </View>
                                    </View>

                                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center">
                                        <Ionicons name="lock-closed" size={16} color="#d97706" />
                                        <Text className="text-amber-700 text-xs font-bold ml-2">View Only - Cannot Approve/Reject</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
