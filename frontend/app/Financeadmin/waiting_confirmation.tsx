
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import Toast from 'react-native-toast-message';

interface Order {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    isPriority: boolean;
    isFinanceConfirmed: boolean;
    orderStatus: string;
    createdAt: string;
    user: { name: string; email: string };
}

export default function WaitingConfirmation() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders?orderStatus=PENDING&isFinanceConfirmed=false`, { headers });
            const data = await response.json();
            if (data.success) {
                // Filter manually just in case backend query doesn't support all params yet
                const pending = data.data.filter((o: Order) => o.orderStatus === 'PENDING' && !o.isFinanceConfirmed);
                // Sort: Priority first
                pending.sort((a: Order, b: Order) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
                setOrders(pending);
            }
        } catch (error) {
            console.error('Fetch Orders error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleConfirmOrder = async (orderId: string) => {
        setIsUpdating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/finance-confirm`, {
                method: 'PATCH',
                headers,
            });

            const data = await response.json();
            if (data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Order Confirmed',
                    text2: 'Order has been released to Order Admin.',
                });
                fetchOrders();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Confirmation Failed',
                    text2: data.message || 'Could not confirm order.',
                });
            }
        } catch (error) {
            console.error('Confirm Order Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'A connection error occurred.',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const renderOrderCard = ({ item }: { item: Order }) => (
        <View className={`bg-white border ${item.isPriority ? 'border-red-200 bg-red-50/20' : 'border-gray-100'} rounded-[24px] p-5 mb-4 shadow-sm`}>
            {item.isPriority && (
                <View className="flex-row items-center mb-3 bg-red-100 self-start px-3 py-1 rounded-full">
                    <Ionicons name="flash" size={12} color="#ef4444" />
                    <Text className="text-red-600 font-bold text-[10px] ml-1 uppercase">Verify Fast Requested</Text>
                </View>
            )}
            <View className="flex-row justify-between mb-4">
                <View>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Order ID</Text>
                    <Text className="text-black font-black text-base">#{item.orderNumber}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Amount</Text>
                    <Text className="text-emerald-600 font-black text-base">₹{item.totalAmount}</Text>
                </View>
            </View>

            <View className="flex-row items-center mb-4 pt-4 border-t border-gray-50">
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="person" size={14} color="#6b7280" />
                </View>
                <View>
                    <Text className="text-gray-900 font-bold text-xs">{item.user?.name || 'Customer'}</Text>
                    <Text className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => handleConfirmOrder(item._id)}
                disabled={isUpdating}
                className="bg-gray-900 py-3 rounded-xl items-center flex-row justify-center"
            >
                <Ionicons name="checkmark-done" size={18} color="white" />
                <Text className="text-white font-black text-xs ml-2 uppercase tracking-widest">Confirm & Release</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-6 border-b border-gray-100 flex-row justify-between items-center">
                <View>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Finance Admin</Text>
                    <Text className="text-2xl font-black text-black">WAITING CONFIRMATION</Text>
                </View>
                {orders.length > 0 && (
                    <View className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
                        <Text className="text-red-600 font-black text-xs">{orders.length}</Text>
                    </View>
                )}
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#10b981" />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <View className="w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-6">
                                <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
                            </View>
                            <Text className="text-gray-900 text-xl font-black mb-2 text-center">All Clear!</Text>
                            <Text className="text-gray-400 text-center font-medium">No orders are currently waiting for finance confirmation.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
