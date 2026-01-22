import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import Skeleton from '../../components/Skeleton';
import { showToast } from '../../utils/toast';

interface Order {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
    };
    orderStatus: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    orderItems: any[];
    shippingAddress?: any;
}

export default function ShippedOrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchShippedOrders();
    }, []);

    const fetchShippedOrders = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders`, { headers });
            const data = await response.json();

            if (data.success) {
                const shippedOrders = (data.data || []).filter((order: Order) => order.orderStatus === 'SHIPPED');
                setOrders(shippedOrders);
            }
        } catch (error) {
            console.error('Failed to fetch shipped orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchShippedOrders();
    };

    const handleMarkAsDelivered = async (orderId: string) => {
        Alert.alert(
            'Confirm Delivery',
            'Has this order been successfully delivered?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setProcessingOrderId(orderId);
                            const headers = await getAuthHeaders();

                            const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/status`, {
                                method: 'PATCH',
                                headers: {
                                    ...headers,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ status: 'DELIVERED' }),
                            });

                            const data = await response.json();

                            if (data.success) {
                                showToast.success('Order has been marked as delivered successfully.');
                                fetchShippedOrders();
                            } else {
                                showToast.error(data.message || 'Could not update order status.');
                            }
                        } catch (error) {
                            console.error('Failed to update order:', error);
                            showToast.error('An unexpected error occurred while updating status.');
                        } finally {
                            setProcessingOrderId(null);
                            setShowActionModal(false);
                            setSelectedOrder(null);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getDaysSinceShipped = (dateString: string) => {
        const now = new Date();
        const shipDate = new Date(dateString);
        const diffMs = now.getTime() - shipDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header Skeleton */}
                <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row items-center">
                        <Skeleton width={40} height={40} className="rounded-xl mr-4" />
                        <View>
                            <Skeleton width={80} height={10} className="mb-2" />
                            <Skeleton width={150} height={24} />
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} className="mb-4 bg-white rounded-[28px] p-5 border border-gray-100">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-row items-center">
                                    <Skeleton width={44} height={44} className="rounded-2xl mr-3" />
                                    <View>
                                        <Skeleton width={100} height={16} className="mb-2" />
                                        <Skeleton width={60} height={12} />
                                    </View>
                                </View>
                                <Skeleton width={60} height={24} className="rounded-full" />
                            </View>
                            <View className="h-px bg-gray-50 mb-4" />
                            <View className="flex-row justify-between items-center">
                                <Skeleton width={80} height={14} />
                                <Skeleton width={100} height={20} />
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">In Transit</Text>
                        <Text className="text-2xl font-black text-black">SHIPPED ORDERS</Text>
                    </View>
                    <View className="bg-blue-100 px-4 py-2 rounded-full">
                        <Text className="text-blue-700 font-black text-lg">{orders.length}</Text>
                    </View>
                </View>
            </View>

            {/* Action Modal */}
            <Modal visible={showActionModal} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[32px] p-6 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-black font-black text-xl">Delivery Actions</Text>
                            <TouchableOpacity onPress={() => {
                                setShowActionModal(false);
                                setSelectedOrder(null);
                            }}>
                                <Ionicons name="close" size={28} color="black" />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <View className="mb-6">
                                <Text className="text-gray-500 text-sm mb-1">Order Number</Text>
                                <Text className="text-black font-black text-lg">#{selectedOrder.orderNumber}</Text>
                            </View>
                        )}

                        {/* Mark as Delivered */}
                        <TouchableOpacity
                            onPress={() => selectedOrder && handleMarkAsDelivered(selectedOrder._id)}
                            disabled={processingOrderId !== null}
                            className="bg-teal-600 p-5 rounded-2xl mb-3 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="checkmark-done-circle" size={24} color="white" />
                                <Text className="text-white font-black text-base ml-3">Mark as Delivered</Text>
                            </View>
                            {processingOrderId === selectedOrder?._id && (
                                <ActivityIndicator color="white" />
                            )}
                        </TouchableOpacity>

                        {/* View Details */}
                        <TouchableOpacity
                            onPress={() => {
                                setShowActionModal(false);
                                router.push(`/Orderadmin/order_detail?id=${selectedOrder?._id}`);
                            }}
                            className="bg-blue-600 p-5 rounded-2xl mb-3 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="eye" size={24} color="white" />
                                <Text className="text-white font-black text-base ml-3">View Full Details</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="white" />
                        </TouchableOpacity>

                        {/* Generate Invoice */}
                        <TouchableOpacity
                            onPress={() => {
                                setShowActionModal(false);
                                Alert.alert('Invoice', 'Invoice generation feature coming soon');
                            }}
                            className="bg-gray-100 p-5 rounded-2xl flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="document-text" size={24} color="#374151" />
                                <Text className="text-gray-700 font-black text-base ml-3">Generate Invoice</Text>
                            </View>
                            <Ionicons name="download" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Orders List */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
            >
                <View className="p-6">
                    {orders.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <View className="bg-blue-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ionicons name="airplane-outline" size={40} color="#2563eb" />
                            </View>
                            <Text className="text-gray-700 font-black text-xl mb-2">No Shipped Orders</Text>
                            <Text className="text-gray-400 text-sm text-center px-8">
                                Orders marked as shipped will appear here
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Info Notice */}
                            <View className="bg-blue-50 rounded-[28px] p-5 mb-6 border border-blue-100">
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="airplane" size={20} color="#2563eb" />
                                    <Text className="text-blue-700 font-black ml-2 text-base">In Transit</Text>
                                </View>
                                <Text className="text-blue-900/70 text-sm font-medium">
                                    Track these orders and mark them as delivered once confirmed.
                                </Text>
                            </View>

                            {orders.map((order) => {
                                const daysSinceShipped = getDaysSinceShipped(order.createdAt);
                                const isDelayed = daysSinceShipped > 7;

                                return (
                                    <TouchableOpacity
                                        key={order._id}
                                        onPress={() => {
                                            setSelectedOrder(order);
                                            setShowActionModal(true);
                                        }}
                                        disabled={processingOrderId === order._id}
                                        className={`bg-white border-2 rounded-[28px] p-5 mb-4 shadow-sm ${isDelayed ? 'border-orange-200' : 'border-blue-200'
                                            }`}
                                    >
                                        {/* Order Header */}
                                        <View className="flex-row justify-between items-start mb-4">
                                            <View className="flex-1">
                                                <Text className="text-black font-black text-lg mb-1">
                                                    #{order.orderNumber}
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                                    <Text className="text-gray-500 text-xs font-medium ml-1">
                                                        Shipped {formatDate(order.createdAt)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className={`px-3 py-1.5 rounded-full flex-row items-center ${isDelayed ? 'bg-orange-100' : 'bg-blue-100'
                                                }`}>
                                                <Ionicons
                                                    name={isDelayed ? 'warning' : 'airplane'}
                                                    size={14}
                                                    color={isDelayed ? '#ea580c' : '#2563eb'}
                                                />
                                                <Text className={`text-[10px] font-black uppercase ml-1 ${isDelayed ? 'text-orange-700' : 'text-blue-700'
                                                    }`}>
                                                    {isDelayed ? 'DELAYED' : 'SHIPPED'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Transit Time */}
                                        {isDelayed && (
                                            <View className="bg-orange-50 rounded-xl p-3 mb-4 flex-row items-center">
                                                <Ionicons name="time" size={16} color="#ea580c" />
                                                <Text className="text-orange-700 text-xs font-bold ml-2">
                                                    In transit for {daysSinceShipped} days - Check status
                                                </Text>
                                            </View>
                                        )}

                                        {/* Customer Info */}
                                        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="person" size={16} color="#6b7280" />
                                                <Text className="text-gray-700 font-bold ml-2">{order.user.name}</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Ionicons name="mail" size={16} color="#6b7280" />
                                                <Text className="text-gray-500 text-xs ml-2">{order.user.email}</Text>
                                            </View>
                                        </View>

                                        {/* Order Summary */}
                                        <View className="flex-row justify-between items-center mb-4">
                                            <View>
                                                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Total Amount</Text>
                                                <Text className="text-black font-black text-xl">₹{order.totalAmount.toFixed(2)}</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Items</Text>
                                                <Text className="text-gray-700 font-black text-lg">{order.orderItems?.length || 0}</Text>
                                            </View>
                                        </View>

                                        {/* Quick Actions */}
                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsDelivered(order._id);
                                                }}
                                                disabled={processingOrderId === order._id}
                                                className="flex-1 bg-teal-600 py-3 rounded-xl flex-row items-center justify-center"
                                            >
                                                {processingOrderId === order._id ? (
                                                    <ActivityIndicator color="white" size="small" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="checkmark-done" size={18} color="white" />
                                                        <Text className="text-white font-black text-xs ml-2">DELIVERED</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/Orderadmin/order_detail?id=${order._id}`);
                                                }}
                                                className="bg-blue-100 px-4 py-3 rounded-xl items-center justify-center"
                                            >
                                                <Ionicons name="eye" size={18} color="#2563eb" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}
                </View>

                {/* Bottom Padding for Nav */}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
