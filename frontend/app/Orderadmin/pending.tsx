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
import OrderAdminNav from '../../components/OrderAdminNav';
import { BlurView } from 'expo-blur';

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
}

export default function PendingOrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders?status=PENDING`, { headers });
            const data = await response.json();

            if (data.success) {
                const pendingOrders = (data.data || []).filter((order: Order) => order.orderStatus === 'PENDING');
                setOrders(pendingOrders);
            }
        } catch (error) {
            console.error('Failed to fetch pending orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingOrders();
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            setProcessingOrderId(orderId);
            const headers = await getAuthHeaders();

            const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert('Success', `Order updated to ${newStatus}`);
                fetchPendingOrders();
            } else {
                Alert.alert('Error', data.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Failed to update order:', error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setProcessingOrderId(null);
            setShowActionModal(false);
            setSelectedOrder(null);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order? This will trigger a refund request.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingOrderId(orderId);
                            const headers = await getAuthHeaders();

                            const response = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/cancel`, {
                                method: 'PATCH',
                                headers,
                            });

                            const data = await response.json();

                            if (data.success) {
                                Alert.alert('Success', 'Order cancelled successfully');
                                fetchPendingOrders();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to cancel order');
                            }
                        } catch (error) {
                            console.error('Failed to cancel order:', error);
                            Alert.alert('Error', 'Failed to cancel order');
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

    const getTimeSinceOrder = (dateString: string) => {
        const now = new Date();
        const orderDate = new Date(dateString);
        const diffMs = now.getTime() - orderDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return `${diffMins}m ago`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />
                <View className="px-6 pt-10 pb-6 border-b border-gray-50">
                    <Skeleton width={150} height={32} className="rounded-lg" />
                </View>

                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} className="mb-6 bg-white rounded-[32px] p-6 border border-gray-100 h-48 justify-between">
                            <Skeleton width="60%" height={24} className="rounded-lg" />
                            <Skeleton width="100%" height={60} className="rounded-2xl" />
                            <View className="flex-row gap-4">
                                <Skeleton width="70%" height={48} className="rounded-2xl" />
                                <Skeleton width="20%" height={48} className="rounded-2xl" />
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
            <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-50/50">
                <View className="flex-row items-center justify-between">
                    <View>
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="hourglass-outline" size={14} color="#64748b" />
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] ml-1.5">Attention</Text>
                        </View>
                        <Text className="text-3xl font-black text-slate-900">Pending</Text>
                    </View>
                    {orders.length > 0 && (
                        <View className="bg-amber-100 px-4 py-2 rounded-2xl shadow-sm border border-amber-200/50">
                            <Text className="text-amber-700 font-black text-xl">{orders.length}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Action Modal (Bottom Sheet Style) */}
            <Modal visible={showActionModal} transparent animationType="slide">
                <View className="flex-1 bg-black/40 justify-end">
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => {
                            setShowActionModal(false);
                            setSelectedOrder(null);
                        }}
                    />
                    <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
                        <View className="w-12 h-1.5 bg-gray-100 rounded-full self-center mb-8" />

                        <View className="flex-row justify-between items-center mb-10">
                            <View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Selected Order</Text>
                                <Text className="text-2xl font-black text-slate-900">#{selectedOrder?.orderNumber}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowActionModal(false);
                                    setSelectedOrder(null);
                                }}
                                className="bg-gray-50 w-10 h-10 rounded-full items-center justify-center border border-gray-100"
                            >
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <TouchableOpacity
                                onPress={() => selectedOrder && handleUpdateStatus(selectedOrder._id, 'CONFIRMED')}
                                disabled={processingOrderId !== null}
                                className="bg-indigo-600 p-6 rounded-[28px] flex-row items-center justify-between shadow-xl shadow-indigo-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mr-4">
                                        <Ionicons name="checkmark-sharp" size={20} color="white" />
                                    </View>
                                    <Text className="text-white font-black text-base">Confirm Receipt</Text>
                                </View>
                                {processingOrderId === selectedOrder?._id && <ActivityIndicator color="white" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setShowActionModal(false);
                                    router.push(`/Orderadmin/order_detail?id=${selectedOrder?._id}`);
                                }}
                                className="bg-slate-50 border border-slate-100 p-6 rounded-[28px] flex-row items-center justify-between"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white w-10 h-10 rounded-xl items-center justify-center mr-4 border border-slate-100">
                                        <Ionicons name="eye-outline" size={20} color="#1e293b" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base">View Full Invoice</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => selectedOrder && handleCancelOrder(selectedOrder._id)}
                                disabled={processingOrderId !== null}
                                className="bg-red-50 border border-red-100 p-6 rounded-[28px] flex-row items-center"
                            >
                                <View className="bg-white w-10 h-10 rounded-xl items-center justify-center mr-4 border border-red-100">
                                    <Ionicons name="ban-outline" size={20} color="#dc2626" />
                                </View>
                                <Text className="text-red-600 font-black text-base">Reject & Cancel Order</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Orders List */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4338ca" />
                }
                contentContainerStyle={{ paddingBottom: 110 }}
            >
                <View className="p-6">
                    {orders.length === 0 ? (
                        <View className="items-center justify-center py-24 px-10">
                            <View className="w-48 h-48 bg-slate-50 rounded-full items-center justify-center mb-10 border border-slate-100/50">
                                <View className="bg-white w-32 h-32 rounded-3xl items-center justify-center shadow-2xl shadow-slate-200">
                                    <Ionicons name="shield-checkmark" size={64} color="#6366f1" />
                                </View>
                                <View className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-lg">
                                    <Ionicons name="sunny" size={24} color="#eab308" />
                                </View>
                            </View>
                            <Text className="text-slate-900 font-black text-2xl mb-3 text-center">Clear Skies</Text>
                            <Text className="text-slate-400 text-sm text-center leading-5 px-4 font-bold">
                                You've cleared all pending orders. Everything is running smoothly.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View className="bg-indigo-50 rounded-[32px] p-6 mb-8 border border-indigo-100/50 flex-row items-center">
                                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                                    <Ionicons name="flash" size={24} color="#6366f1" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-indigo-900 font-black text-base">Immediate Action</Text>
                                    <Text className="text-indigo-400 text-xs font-bold leading-4 mt-0.5">
                                        These orders must be verified before moving to production.
                                    </Text>
                                </View>
                            </View>

                            {orders.map((order) => (
                                <TouchableOpacity
                                    key={order._id}
                                    onPress={() => {
                                        setSelectedOrder(order);
                                        setShowActionModal(true);
                                    }}
                                    activeOpacity={0.8}
                                    className="bg-white border-2 border-slate-50 rounded-[36px] p-6 mb-6 shadow-sm shadow-slate-100 overflow-hidden"
                                >
                                    {/* Order ID & Time */}
                                    <View className="flex-row justify-between items-start mb-6">
                                        <View>
                                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Serial</Text>
                                            <Text className="text-black font-black text-xl">#{order.orderNumber}</Text>
                                        </View>
                                        <View className="bg-amber-50 px-3 py-1.5 rounded-xl flex-row items-center border border-amber-100">
                                            <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                                            <Text className="text-amber-700 text-[10px] font-bold">{getTimeSinceOrder(order.createdAt)}</Text>
                                        </View>
                                    </View>

                                    {/* Customer Card */}
                                    <View className="bg-slate-50/50 rounded-[28px] p-5 mb-6 border border-slate-50">
                                        <View className="flex-row items-center mb-3">
                                            <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3 border border-slate-100">
                                                <Ionicons name="person-outline" size={16} color="#1e293b" />
                                            </View>
                                            <Text className="text-slate-900 font-bold text-sm tracking-tight">{order.user.name}</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 bg-white rounded-lg items-center justify-center mr-3 border border-slate-100">
                                                <Ionicons name="mail-outline" size={16} color="#64748b" />
                                            </View>
                                            <Text className="text-slate-400 text-xs font-medium">{order.user.email}</Text>
                                        </View>
                                    </View>

                                    {/* Financials & Action */}
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Checkout</Text>
                                            <Text className="text-slate-900 font-black text-2xl">₹{order.totalAmount.toLocaleString()}</Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(order._id, 'CONFIRMED');
                                            }}
                                            disabled={processingOrderId === order._id}
                                            activeOpacity={0.7}
                                            className="bg-indigo-600 px-6 py-4 rounded-2xl flex-row items-center shadow-lg shadow-indigo-100"
                                        >
                                            {processingOrderId === order._id ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <>
                                                    <Text className="text-white font-black text-xs mr-2 uppercase tracking-widest">Verify</Text>
                                                    <Ionicons name="chevron-forward" size={14} color="white" />
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            </ScrollView>

            <OrderAdminNav activeTab="orders" />
        </View>
    );
}
