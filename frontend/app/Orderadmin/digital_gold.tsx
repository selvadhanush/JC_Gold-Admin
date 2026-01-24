import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';

export default function OrderDigitalGold() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemptions?status=REQUESTED`, { headers });
            const data = await response.json();
            if (data.success) {
                // Order admin specifically cares about GOLD (physical) redemptions
                setPendingRedemptions(data.data.filter((r: any) => r.redeemType === 'GOLD'));
            }
        } catch (error) {
            console.error('Error fetching order gold data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_REDEMPTION_APPROVE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', `Redemption ${status.toLowerCase()}`);
                fetchData();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{
                headerShown: true,
                title: 'Gold Delivery Requests',
                headerTitleStyle: { fontWeight: '900' }
            }} />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                contentContainerStyle={{ padding: 20 }}
            >
                <Text className="text-black font-black text-xl mb-6">Pending Deliveries 📦</Text>

                {pendingRedemptions.length === 0 ? (
                    <View className="bg-gray-50 p-10 rounded-[32px] items-center border border-gray-100 border-dashed">
                        <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                        <Text className="text-gray-400 mt-4 font-bold">No pending gold deliveries</Text>
                    </View>
                ) : (
                    pendingRedemptions.map(item => (
                        <View key={item._id} className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm">
                            <View className="flex-row justify-between mb-4">
                                <View>
                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Grams to Deliver</Text>
                                    <Text className="text-gray-900 text-2xl font-black">{item.goldGrams}g</Text>
                                </View>
                                <View className="bg-blue-50 px-3 py-1 rounded-full self-start">
                                    <Text className="text-blue-600 text-[10px] font-black uppercase">{item.redeemType}</Text>
                                </View>
                            </View>

                            <View className="bg-gray-50 p-4 rounded-2xl mb-6">
                                <Text className="text-gray-400 text-[9px] font-black uppercase mb-2">Shipping Details</Text>
                                <Text className="text-gray-900 font-bold mb-1">{item.user?.name || 'Customer'}</Text>
                                <Text className="text-gray-600 text-xs">{item.deliveryAddress?.street}, {item.deliveryAddress?.city}</Text>
                                <Text className="text-gray-600 text-xs">{item.deliveryAddress?.state}, {item.deliveryAddress?.zipCode}</Text>
                                <Text className="text-blue-600 font-bold text-xs mt-2">{item.deliveryAddress?.phoneNumber}</Text>
                            </View>

                            <View className="flex-row gap-x-3">
                                <TouchableOpacity
                                    onPress={() => handleApprove(item._id, 'APPROVED')}
                                    className="flex-1 bg-blue-600 py-4 rounded-2xl items-center"
                                >
                                    <Text className="text-white font-black uppercase tracking-widest">Confirm Order</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleApprove(item._id, 'REJECTED')}
                                    className="bg-red-50 px-5 rounded-2xl items-center justify-center border border-red-100"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
