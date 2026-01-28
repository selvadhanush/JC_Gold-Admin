import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

export default function TransactionsHistory() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [redemptionsMap, setRedemptionsMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch Transactions and Redemptions in parallel
            const [transRes, redeemRes] = await Promise.all([
                fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_TRANSACTIONS, { headers }),
                fetch(API_ENDPOINTS.BUYER_PHYSICAL_GOLD_REDEMPTIONS, { headers })
            ]);

            const transData = await transRes.json();
            const redeemData = await redeemRes.json();

            if (transData.success) {
                setTransactions(transData.data);
            }

            if (redeemData.success) {
                // Create a map of TransactionID -> RedemptionRequest
                const map: Record<string, any> = {};
                redeemData.data.forEach((r: any) => {
                    const transId = typeof r.transaction === 'object' ? r.transaction._id : r.transaction;
                    map[transId] = r;
                });
                setRedemptionsMap(map);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

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
                        <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-1">Transaction History</Text>
                        <Text className="text-2xl font-black text-gray-900">All Transactions</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />}
                className="flex-1"
            >
                <View className="px-6 py-6">
                    {loading ? (
                        <View className="items-center justify-center py-20">
                            <Text className="text-gray-400">Loading transactions...</Text>
                        </View>
                    ) : transactions.length === 0 ? (
                        <View className="bg-gray-50 rounded-[32px] p-12 items-center border border-gray-200 border-dashed">
                            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                                <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
                            </View>
                            <Text className="text-gray-900 font-black text-lg mb-2">No Transactions Yet</Text>
                            <Text className="text-gray-400 text-center text-sm">Your gold purchase and redemption history will appear here</Text>
                        </View>
                    ) : (
                        <View>
                            {transactions.map((item, index) => {
                                const redemption = redemptionsMap[item._id];
                                // Use redemption status if available (more granular)
                                const status = redemption ? redemption.status : item.status;

                                return (
                                    <View
                                        key={item._id}
                                        className="bg-white rounded-[28px] overflow-hidden border border-gray-100 mb-4"
                                        style={{
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.04,
                                            shadowRadius: 8,
                                            elevation: 2
                                        }}
                                    >
                                        {/* Transaction Header */}
                                        <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
                                            <View className="flex-row items-center flex-1">
                                                <View
                                                    className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                                                    style={{
                                                        backgroundColor: item.type === 'BUY' ? '#dcfce7' : item.type.includes('REDEEM') ? '#fef3c7' : '#fee2e2'
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={item.type === 'BUY' ? 'arrow-down-circle' : item.type.includes('REDEEM') ? 'arrow-up-circle' : 'close-circle'}
                                                        size={28}
                                                        color={item.type === 'BUY' ? '#16a34a' : item.type.includes('REDEEM') ? '#f59e0b' : '#ef4444'}
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-900 font-black text-base mb-1">
                                                        {item.type === 'BUY' ? 'Gold Purchase' :
                                                            redemption?.redeemType === 'PHYSICAL_GOLD' ? 'Physical Gold Redeem' :
                                                                item.type.includes('REDEEM') ? 'Gold Redemption' : 'Transaction'}
                                                    </Text>
                                                    <View className="flex-row items-center">
                                                        <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                                                        <Text className="text-gray-400 text-xs font-bold ml-1.5">
                                                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Status Badge */}
                                            <View
                                                className="px-3 py-2 rounded-full flex-row items-center"
                                                style={{
                                                    backgroundColor:
                                                        status === 'COMPLETED' ? '#dcfce7' :
                                                            status === 'READY_FOR_PICKUP' ? '#f0fdf4' :
                                                                status === 'APPROVED' ? '#dbeafe' :
                                                                    status === 'PENDING' || status === 'REQUESTED' ? '#fff7ed' : '#fee2e2'
                                                }}
                                            >
                                                <View
                                                    className="w-2 h-2 rounded-full mr-2"
                                                    style={{
                                                        backgroundColor:
                                                            status === 'COMPLETED' ? '#16a34a' :
                                                                status === 'READY_FOR_PICKUP' ? '#22c55e' :
                                                                    status === 'APPROVED' ? '#3b82f6' :
                                                                        status === 'PENDING' || status === 'REQUESTED' ? '#f97316' : '#ef4444'
                                                    }}
                                                />
                                                <Text
                                                    className="text-[10px] font-black uppercase tracking-wider"
                                                    style={{
                                                        color:
                                                            status === 'COMPLETED' ? '#15803d' :
                                                                status === 'READY_FOR_PICKUP' ? '#15803d' :
                                                                    status === 'APPROVED' ? '#1d4ed8' :
                                                                        status === 'PENDING' || status === 'REQUESTED' ? '#ea580c' : '#dc2626'
                                                    }}
                                                >
                                                    {status === 'READY_FOR_PICKUP' ? 'READY' : status}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Transaction Details */}
                                        <View className="px-5 pb-5">
                                            <View className="bg-gray-50 rounded-2xl p-4">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <View className="flex-1">
                                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Gold Amount</Text>
                                                        <View className="flex-row items-baseline">
                                                            <Text
                                                                className="text-2xl font-black"
                                                                style={{
                                                                    color: item.type === 'BUY' ? '#16a34a' : '#f59e0b'
                                                                }}
                                                            >
                                                                {item.type === 'BUY' ? '+' : '-'}{item.goldGrams?.toFixed(3) || '0'}
                                                            </Text>
                                                            <Text className="text-gray-500 text-sm font-bold ml-1">grams</Text>
                                                        </View>
                                                    </View>
                                                    <View className="w-px h-12 bg-gray-200 mx-4" />
                                                    <View className="flex-1 items-end">
                                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Value</Text>
                                                        <Text className="text-gray-900 text-xl font-black">
                                                            ₹{item.amountPaid?.toLocaleString() || (item.goldGrams * item.goldRateAtTime)?.toLocaleString() || '0'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Pickup Location Display */}
                                                {redemption?.pickupLocation && (
                                                    <View className="mb-3 bg-white border border-green-100 rounded-xl p-3">
                                                        <View className="flex-row items-center mb-2">
                                                            <Ionicons name="storefront" size={16} color="#16a34a" />
                                                            <Text className="text-green-700 font-black text-xs uppercase tracking-widest ml-2">Pickup Location</Text>
                                                        </View>
                                                        <Text className="text-gray-900 font-bold text-sm">{redemption.pickupLocation.storeName}</Text>
                                                        <Text className="text-gray-600 text-xs mt-1">{redemption.pickupLocation.address}</Text>
                                                        {redemption.pickupLocation.contactNumber && (
                                                            <Text className="text-gray-500 text-xs mt-1">📞 {redemption.pickupLocation.contactNumber}</Text>
                                                        )}
                                                        {redemption.pickupLocation.instructions && (
                                                            <Text className="text-gray-400 text-[10px] italic mt-2">Note: {redemption.pickupLocation.instructions}</Text>
                                                        )}
                                                    </View>
                                                )}

                                                {/* Additional Details */}
                                                <View className="pt-3 border-t border-gray-200 space-y-2">
                                                    <View className="flex-row items-center justify-between">
                                                        <View className="flex-1">
                                                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Rate/gram</Text>
                                                            <Text className="text-gray-700 text-sm font-bold">
                                                                ₹{item.goldRateAtTime?.toLocaleString() || '0'}
                                                            </Text>
                                                        </View>
                                                        {item.paymentMethod && (
                                                            <View className="flex-1 items-end">
                                                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Payment Method</Text>
                                                                <Text className="text-gray-700 text-sm font-bold">
                                                                    {item.paymentMethod}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {item.transactionId && (
                                                        <View className="pt-2">
                                                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Transaction ID</Text>
                                                            <Text className="text-gray-700 text-xs font-mono font-bold">
                                                                {item.transactionId}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {/* Rejection Reason Display */}
                                                    {(status === 'REJECTED' && (item.rejectionReason || redemption?.rejectionReason)) && (
                                                        <View className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                                                            <View className="flex-row items-center mb-1">
                                                                <Ionicons name="alert-circle" size={14} color="#dc2626" />
                                                                <Text className="text-red-700 font-black text-[9px] uppercase tracking-widest ml-2">Rejection Reason</Text>
                                                            </View>
                                                            <Text className="text-red-600 text-[11px] font-bold">
                                                                {item.rejectionReason || redemption?.rejectionReason}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
