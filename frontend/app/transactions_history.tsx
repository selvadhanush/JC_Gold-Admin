import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

export default function TransactionsHistory() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_TRANSACTIONS, { headers });
            const data = await response.json();

            console.log('[Transactions Debug] Full data:', JSON.stringify(data.data[0]));

            if (data.success) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [fetchTransactions])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
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
                            {transactions.map((item, index) => (
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
                                                    {item.type === 'BUY' ? 'Gold Purchase' : item.type.includes('REDEEM') ? 'Gold Redemption' : 'Transaction'}
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
                                                    item.status === 'COMPLETED' ? '#dcfce7' :
                                                        item.status === 'PENDING' ? '#fff7ed' :
                                                            item.status === 'APPROVED' ? '#dbeafe' : '#fee2e2'
                                            }}
                                        >
                                            <View
                                                className="w-2 h-2 rounded-full mr-2"
                                                style={{
                                                    backgroundColor:
                                                        item.status === 'COMPLETED' ? '#16a34a' :
                                                            item.status === 'PENDING' ? '#f97316' :
                                                                item.status === 'APPROVED' ? '#3b82f6' : '#ef4444'
                                                }}
                                            />
                                            <Text
                                                className="text-[10px] font-black uppercase tracking-wider"
                                                style={{
                                                    color:
                                                        item.status === 'COMPLETED' ? '#15803d' :
                                                            item.status === 'PENDING' ? '#ea580c' :
                                                                item.status === 'APPROVED' ? '#1d4ed8' : '#dc2626'
                                                }}
                                            >
                                                {item.status}
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
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Amount</Text>
                                                    <Text className="text-gray-900 text-xl font-black">
                                                        ₹{item.amountPaid?.toLocaleString() || (item.goldGrams * item.goldRateAtTime)?.toLocaleString() || '0'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Additional Details */}
                                            <View className="pt-3 border-t border-gray-200 space-y-2">
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-1">
                                                        <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Rate/gram (at time)</Text>
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

                                                {item.notes && (
                                                    <View className="pt-2">
                                                        <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Notes</Text>
                                                        <Text className="text-gray-600 text-xs">
                                                            {item.notes}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
