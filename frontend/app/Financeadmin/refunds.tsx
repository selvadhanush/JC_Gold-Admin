import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Refund {
    _id: string;
    paymentId: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
    processedAt?: string;
}

export default function RefundsManagement() {
    const router = useRouter();
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/payments/refunds`, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch refunds: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const mappedRefunds = (data.data || []).map((item: any) => ({
                    ...item,
                    paymentId: item.payment?._id || item.payment,
                }));
                setRefunds(mappedRefunds);
            } else {
                console.error('Failed to fetch refunds:', data.message);
                setRefunds([]);
            }
        } catch (error) {
            console.error('Failed to fetch refunds:', error);
            setRefunds([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRefunds();
    };

    const handleProcessRefund = async (refundId: string) => {
        Alert.alert(
            'Process Refund',
            'Are you sure you want to process this refund?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Process',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/payments/${refundId}/refund`, {
                                method: 'POST',
                                headers,
                            });

                            const data = await response.json();

                            if (response.ok && data.success) {
                                Alert.alert('Success', 'Refund processed successfully');
                                fetchRefunds();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to process refund');
                            }
                        } catch (error) {
                            console.error('Refund processing error:', error);
                            Alert.alert('Error', 'Failed to process refund');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PROCESSED': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
            case 'PENDING': return { bg: 'bg-amber-50', text: 'text-amber-600' };
            case 'REJECTED': return { bg: 'bg-red-50', text: 'text-red-600' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600' };
        }
    };

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
                        <Text className="text-2xl font-black text-black">Refunds</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    {loading ? (
                        <Text className="text-center text-gray-500">Loading refunds...</Text>
                    ) : refunds.length === 0 ? (
                        <View className="items-center py-20">
                            <Ionicons name="return-down-back-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No refunds found</Text>
                        </View>
                    ) : (
                        refunds.map((refund) => {
                            const statusColor = getStatusColor(refund.status);
                            return (
                                <View
                                    key={refund._id}
                                    className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <Text className="text-black font-black text-lg">₹{refund.amount}</Text>
                                            <Text className="text-gray-500 text-sm mt-1">
                                                Payment: {refund.paymentId}
                                            </Text>
                                        </View>
                                        <View className={`px-3 py-1 rounded-full ${statusColor.bg}`}>
                                            <Text className={`text-xs font-bold ${statusColor.text}`}>
                                                {refund.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Reason</Text>
                                        <Text className="text-gray-700 text-sm">{refund.reason}</Text>
                                    </View>

                                    <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Requested</Text>
                                            <Text className="text-black font-bold text-sm">
                                                {new Date(refund.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        {refund.status === 'PENDING' && (
                                            <TouchableOpacity
                                                onPress={() => handleProcessRefund(refund._id)}
                                                className="bg-emerald-600 px-6 py-3 rounded-full"
                                            >
                                                <Text className="text-white font-black text-sm">Process</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
