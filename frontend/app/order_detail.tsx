import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import Skeleton from '../components/Skeleton';

interface OrderItem {
    product: {
        _id: string;
        name: string;
        images: string[];
        price: number;
    };
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    orderNumber: string;
    orderItems: OrderItem[];
    totalAmount: number;
    taxAmount: number;
    shippingAmount: number;
    subtotalAmount: number;
    orderStatus: string;
    isFinanceConfirmed: boolean;
    isPriority: boolean;
    paymentMethod: string;
    createdAt: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        phoneNumber: string;
    };
}

export default function OrderDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_ORDERS}/${id}`, { headers });
            const data = await response.json();
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            console.error('Fetch Order Detail Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED': return { text: 'text-green-600', icon: 'checkmark-circle' };
            case 'CANCELLED': return { text: 'text-red-600', icon: 'close-circle' };
            case 'SHIPPED': return { text: 'text-blue-600', icon: 'airplane' };
            default: return { text: 'text-orange-600', icon: 'time' };
        }
    };

    const renderSkeleton = () => (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center h-16">
                <Skeleton width={48} height={48} style={{ borderRadius: 16 }} />
                <Skeleton width={100} height={20} />
                <Skeleton width={48} height={48} style={{ borderRadius: 16 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
                <View className="items-center mt-6 mb-10">
                    <Skeleton width={80} height={80} style={{ borderRadius: 28 }} className="mb-6" />
                    <Skeleton width={150} height={40} className="mb-4" />
                    <Skeleton width={100} height={20} />
                </View>
                <View className="flex-row justify-between mb-10">
                    <Skeleton width="48%" height={100} style={{ borderRadius: 28 }} />
                    <Skeleton width="48%" height={100} style={{ borderRadius: 28 }} />
                </View>
                <Skeleton width="100%" height={250} style={{ borderRadius: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );

    if (loading) return renderSkeleton();

    if (!order) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-10">
                <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
                <Text className="text-xl font-black text-gray-900 mt-6">Order Missing</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6">
                    <Text className="text-primary-600 font-bold">Return to History</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusStyle = getStatusStyle(order.orderStatus);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center justify-between z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100"
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-base font-black text-gray-900">Order Details</Text>
                <TouchableOpacity className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                    <Ionicons name="help-circle-outline" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
                {/* Transaction Header */}
                <View className="mt-6 mb-10 items-center">
                    <View className="w-20 h-20 bg-primary-50 rounded-[28px] items-center justify-center mb-6 shadow-sm">
                        <Ionicons name="diamond-outline" size={36} color="#f97316" />
                    </View>
                    <Text className="text-3xl font-black text-gray-900 mb-2">₹{order.totalAmount.toLocaleString()}</Text>
                    <View className="flex-row items-center">
                        <Ionicons name={statusStyle.icon as any} size={14} color={statusStyle.text.replace('text-', '#')} />
                        <Text className={`ml-2 text-xs font-black uppercase tracking-widest ${statusStyle.text}`}>
                            {order.orderStatus === 'PENDING' && !order.isFinanceConfirmed ? 'Processing By Finance' : (order.orderStatus || 'PENDING')}
                        </Text>
                    </View>
                    {order.orderStatus === 'PENDING' && order.isPriority && (
                        <View className="mt-4 bg-red-50 px-4 py-2 rounded-2xl border border-red-100 flex-row items-center">
                            <Ionicons name="flash" size={12} color="#ef4444" />
                            <Text className="text-red-600 font-black text-[10px] ml-2 uppercase tracking-widest">Priority Processing Active</Text>
                        </View>
                    )}
                </View>

                {/* Info Grid */}
                <View className="flex-row flex-wrap justify-between mb-10">
                    <View className="bg-gray-50 rounded-[28px] p-6 w-[48%] mb-4 border border-gray-100">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order ID</Text>
                        <Text className="text-gray-900 font-bold">#{order.orderNumber}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-[28px] p-6 w-[48%] mb-4 border border-gray-100">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Placed On</Text>
                        <Text className="text-gray-900 font-bold" numberOfLines={1}>{formatDate(order.createdAt).split('at')[0]}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-[28px] p-6 w-full border border-gray-100">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Method</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="card-outline" size={16} color="#9ca3af" />
                            <Text className="text-gray-900 font-bold ml-2 uppercase tracking-tighter">{order.paymentMethod}</Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View className="mb-10">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6">Masterpieces Ordered</Text>
                    {order.orderItems.map((item, idx) => (
                        <View key={idx} className="flex-row items-center mb-6 bg-white border border-gray-50 rounded-[32px] p-4 shadow-sm">
                            <View className="w-20 h-20 bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100">
                                <Image source={{ uri: item.product?.images?.[0] }} className="w-full h-full" resizeMode="cover" />
                            </View>
                            <View className="ml-5 flex-1">
                                <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>{item.product?.name}</Text>
                                <Text className="text-gray-400 text-xs font-bold mt-1">Quantity: {item.quantity}</Text>
                                <Text className="text-primary-600 font-black text-lg mt-2">₹{(item.price * item.quantity).toLocaleString()}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Delivery Information */}
                <View className="bg-gray-900 rounded-[40px] p-8 mb-10 shadow-2xl relative overflow-hidden">
                    <View className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-10 -mt-10" />
                    <Text className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-6">Destined To</Text>
                    <View className="flex-row mb-6">
                        <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-5">
                            <Ionicons name="location-outline" size={20} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold leading-6">{order.shippingAddress.street}</Text>
                            <Text className="text-white/60 text-sm mt-1">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center pt-6 border-t border-white/10">
                        <Ionicons name="call-outline" size={16} color="white" />
                        <Text className="text-white font-bold ml-3">{order.shippingAddress.phoneNumber}</Text>
                    </View>
                </View>

                {/* Price Breakdown */}
                <View className="mb-32 px-4">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6">Valuation Summary</Text>
                    <View className="space-y-4">
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-gray-400 font-bold">Subtotal</Text>
                            <Text className="text-gray-900 font-bold text-lg">₹{((order.totalAmount - (order.taxAmount || 0)) - (order.shippingAmount || 0)).toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-gray-400 font-bold">Estimated GST (3%)</Text>
                            <Text className="text-gray-900 font-bold text-lg">₹{(order.taxAmount || 0).toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-gray-400 font-bold">Shipping</Text>
                            <Text className="text-gray-900 font-bold text-lg">FREE</Text>
                        </View>
                        <View className="h-[1px] bg-gray-100 my-4 " />
                        <View className="flex-row justify-between">
                            <Text className="text-gray-900 font-black text-xl">Total Commitment</Text>
                            <Text className="text-primary-600 font-black text-2xl">₹{order.totalAmount.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Support Action */}
            <View className="absolute bottom-6 left-6 right-6">
                <TouchableOpacity
                    onPress={() => router.push(`/order_support?orderId=${order._id}`)}
                    className="bg-primary-600 h-16 rounded-3xl items-center justify-center flex-row shadow-xl shadow-primary-500/30"
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                    <Text className="text-white font-black uppercase tracking-widest text-xs ml-3">Support Regarding this Order</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
