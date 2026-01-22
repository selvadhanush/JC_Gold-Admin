import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Alert,
    Modal,
    Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Payment {
    _id: string;
    orderId?: string;
    order?: { _id: string; orderNumber?: string; totalAmount?: number; isPriority?: boolean; isFinanceConfirmed?: boolean };
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    user?: { name: string; email: string };
}

export default function PaymentsManagement() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // UI Enhancement States
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/payments`, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch payments: ${response.status}`);
            }

            const data = await response.json();
            console.log('Payments API Response:', JSON.stringify(data, null, 2));

            if (data.success) {
                const payments = data.data || [];
                console.log('First payment data:', payments[0]);
                console.log('Total payments:', payments.length);
                setPayments(payments);
            } else {
                console.error('Failed to fetch payments:', data.message);
                setPayments([]);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayments();
    };

    const handleStatusUpdate = (paymentId: string) => {
        setUpdatingPaymentId(paymentId);
        setIsModalVisible(true);
    };

    const updateStatus = async (newStatus: string) => {
        if (!updatingPaymentId) return;

        setIsUpdating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/payments/${updatingPaymentId}/status`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Status Updated',
                    text2: `Payment marked as ${newStatus} successfully.`,
                    visibilityTime: 3000,
                    autoHide: true,
                });
                setIsModalVisible(false);
                fetchPayments(); // Refresh the list
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: data.message || 'Could not update payment status.',
                });
            }
        } catch (error) {
            console.error('Update Status Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'A connection error occurred.',
            });
        } finally {
            setIsUpdating(false);
            setUpdatingPaymentId(null);
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
                fetchPayments();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
            case 'PENDING': return { bg: 'bg-amber-50', text: 'text-amber-600' };
            case 'FAILED': return { bg: 'bg-red-50', text: 'text-red-600' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600' };
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || payment.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Finance Admin</Text>
                        <Text className="text-2xl font-black text-black">Payments</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-gray-50 rounded-2xl px-4 py-3 flex-row items-center mb-3">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-base"
                        placeholder="Search by order ID or email..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === status ? 'bg-emerald-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`font-bold text-xs ${filterStatus === status ? 'text-white' : 'text-gray-600'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    {loading ? (
                        <Text className="text-center text-gray-500">Loading payments...</Text>
                    ) : filteredPayments.length === 0 ? (
                        <View className="items-center py-20">
                            <Ionicons name="card-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No payments found</Text>
                        </View>
                    ) : (
                        filteredPayments.map((payment) => {
                            const statusColor = getStatusColor(payment.status);
                            return (
                                <TouchableOpacity
                                    key={payment._id}
                                    className={`bg-white border ${payment.order?.isPriority ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} rounded-[24px] p-5 mb-4 shadow-sm`}
                                >
                                    {payment.order?.isPriority && (
                                        <View className="flex-row items-center mb-3 bg-red-100 self-start px-3 py-1 rounded-full">
                                            <Ionicons name="flash" size={12} color="#ef4444" />
                                            <Text className="text-red-600 font-bold text-[10px] ml-1 uppercase">Verify Fast Requested</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <Text className="text-black font-black text-lg">₹{payment.amount}</Text>
                                            <Text className="text-gray-500 text-sm mt-1">
                                                {payment.user?.email || 'N/A'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleStatusUpdate(payment._id)}
                                            className={`px-4 py-1.5 rounded-full ${statusColor.bg} flex-row items-center shadow-sm`}
                                        >
                                            <Text className={`text-xs font-black ${statusColor.text} mr-1.5`}>
                                                {payment.status}
                                            </Text>
                                            <Ionicons name="chevron-down" size={14} color={statusColor.text.replace('text-', '')} />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-50">
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Method</Text>
                                            <Text className="text-black font-bold text-sm">{payment.paymentMethod}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Date</Text>
                                            <Text className="text-black font-bold text-sm">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        {payment.order && (
                                            <View>
                                                <Text className="text-gray-400 text-xs font-bold uppercase">Order Amount</Text>
                                                <Text className="text-emerald-600 font-bold text-sm">
                                                    ₹{payment.order.totalAmount || payment.amount}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {payment.status === 'COMPLETED' && payment.order && !payment.order.isFinanceConfirmed && (
                                        <TouchableOpacity
                                            onPress={() => handleConfirmOrder(payment.order?._id || '')}
                                            className="mt-4 bg-gray-900 py-3 rounded-xl items-center flex-row justify-center"
                                        >
                                            <Ionicons name="checkmark-done" size={18} color="white" />
                                            <Text className="text-white font-black text-xs ml-2 uppercase tracking-widest">Confirm Order to Order Admin</Text>
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>

            {/* Premium Status Selection Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-end"
                    onPress={() => !isUpdating && setIsModalVisible(false)}
                >
                    <Pressable className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
                        <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-8" />

                        <Text className="text-2xl font-black text-black mb-2">Update Status</Text>
                        <Text className="text-gray-500 mb-8 font-medium">Select the new state for this transaction</Text>

                        <View className="space-y-3">
                            {[
                                { status: 'PENDING', icon: 'time', color: '#f59e0b', bg: '#fef3c7' },
                                { status: 'COMPLETED', icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
                                { status: 'FAILED', icon: 'close-circle', color: '#ef4444', bg: '#fee2e2' },
                                { status: 'REFUNDED', icon: 'refresh-circle', color: '#3b82f6', bg: '#dbeafe' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.status}
                                    onPress={() => updateStatus(item.status)}
                                    disabled={isUpdating}
                                    className="flex-row items-center p-5 rounded-[24px] bg-gray-50 mb-3 border border-gray-100"
                                >
                                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: item.bg }}>
                                        <Ionicons name={item.icon as any} size={24} color={item.color} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-lg">{item.status}</Text>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Mark as {item.status.toLowerCase()}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {isUpdating && (
                            <View className="absolute inset-0 bg-white/80 justify-center items-center rounded-t-[40px]">
                                <Text className="text-emerald-600 font-black text-lg">Updating...</Text>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
