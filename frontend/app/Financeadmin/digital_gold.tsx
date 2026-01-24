import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';

export default function AdminDigitalGold() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
    const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
    const [newRate, setNewRate] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'rates' | 'purchases' | 'redemptions'>('rates');
    const [ratesHistory, setRatesHistory] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();

            // 1. Fetch Rates
            const ratesRes = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const ratesData = await ratesRes.json();
            if (ratesData.success) setRatesHistory(ratesData.data);

            // 2. Fetch Pending Purchases (Technically we filter transactions)
            // In a real app, you'd have an endpoint for pending gold transactions
            const transRes = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/transactions?status=PENDING`, { headers });
            const transData = await transRes.json();
            if (transData.success) {
                setPendingPurchases(transData.data.filter((t: any) => t.type === 'BUY'));
                // setPendingRedemptions(transData.data.filter((t: any) => t.type !== 'BUY'));
            }

            // 3. Fetch Pending Redemptions
            const redeemRes = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemptions?status=REQUESTED`, { headers });
            const redeemData = await redeemRes.json();
            if (redeemData.success) setPendingRedemptions(redeemData.data);

        } catch (error) {
            console.error('Error fetching admin digital gold data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSetRate = async () => {
        if (!newRate || isNaN(Number(newRate))) {
            return Alert.alert('Invalid Rate', 'Please enter a valid rate per gram');
        }

        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    metalType: 'GOLD',
                    ratePerGram: Number(newRate),
                    source: 'MANUAL'
                })
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Gold rate updated successfully');
                setNewRate('');
                fetchData();
            } else {
                Alert.alert('Error', data.message || 'Failed to update rate');
            }
        } catch (error) {
            Alert.alert('Error', 'API Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprovePurchase = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_APPROVE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', `Transaction ${status.toLowerCase()}`);
                fetchData();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process');
        }
    };

    const handleApproveRedemption = async (id: string, status: 'APPROVED' | 'REJECTED') => {
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
                title: 'Gold Wallet Admin',
                headerTitleStyle: { fontWeight: '900' }
            }} />

            <View className="flex-row border-b border-gray-100">
                {(['rates', 'purchases', 'redemptions'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 py-4 items-center ${activeTab === tab ? 'border-b-2 border-emerald-600' : ''}`}
                    >
                        <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                contentContainerStyle={{ padding: 20 }}
            >
                {activeTab === 'rates' && (
                    <View>
                        <View className="bg-emerald-50 p-6 rounded-[24px] mb-8 border border-emerald-100">
                            <Text className="text-emerald-800 font-black mb-1">Set Today's Gold Rate</Text>
                            <Text className="text-emerald-600 text-[10px] uppercase font-bold mb-4">Market Rate (Per Gram)</Text>

                            <View className="bg-white rounded-2xl p-4 mb-4 border border-emerald-100 flex-row items-center">
                                <Text className="text-2xl font-black mr-2">₹</Text>
                                <TextInput
                                    placeholder="Enter Rate"
                                    keyboardType="numeric"
                                    value={newRate}
                                    onChangeText={setNewRate}
                                    className="flex-1 text-2xl font-black py-0"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleSetRate}
                                disabled={isProcessing}
                                className="bg-emerald-600 py-4 rounded-2xl items-center"
                            >
                                {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase">Update Rate</Text>}
                            </TouchableOpacity>
                        </View>

                        <Text className="text-black font-black text-lg mb-4">Rate History</Text>
                        {ratesHistory.map(rate => (
                            <View key={rate._id} className="flex-row justify-between items-center py-4 border-b border-gray-50">
                                <View>
                                    <Text className="text-gray-900 font-bold">₹{rate.ratePerGram}</Text>
                                    <Text className="text-gray-400 text-[10px] uppercase">{new Date(rate.date).toLocaleDateString()}</Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${rate.isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                    <Text className={`text-[8px] font-black uppercase ${rate.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                                        {rate.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {activeTab === 'purchases' && (
                    <View>
                        <Text className="text-black font-black text-lg mb-4">Pending Purchases</Text>
                        {pendingPurchases.length === 0 ? (
                            <Text className="text-gray-400 text-center py-10">No pending purchase requests</Text>
                        ) : (
                            pendingPurchases.map(item => (
                                <View key={item._id} className="bg-gray-50 p-5 rounded-[24px] mb-4 border border-gray-100">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-900 font-black">₹{item.amountPaid}</Text>
                                        <Text className="text-emerald-600 font-black">{item.goldGrams}g</Text>
                                    </View>
                                    <Text className="text-gray-500 text-[10px] mb-4">User ID: {item.user}</Text>

                                    <View className="flex-row gap-x-2">
                                        <TouchableOpacity
                                            onPress={() => handleApprovePurchase(item._id, 'APPROVED')}
                                            className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
                                        >
                                            <Text className="text-white font-black text-[10px] uppercase">Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleApprovePurchase(item._id, 'REJECTED')}
                                            className="flex-1 bg-red-100 py-3 rounded-xl items-center"
                                        >
                                            <Text className="text-red-600 font-black text-[10px] uppercase">Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'redemptions' && (
                    <View>
                        <Text className="text-black font-black text-lg mb-4">Redemption Requests</Text>
                        {pendingRedemptions.length === 0 ? (
                            <Text className="text-gray-400 text-center py-10">No pending redemption requests</Text>
                        ) : (
                            pendingRedemptions.map(item => (
                                <View key={item._id} className="bg-gray-50 p-5 rounded-[24px] mb-4 border border-gray-100">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-900 font-black uppercase tracking-widest">{item.redeemType}</Text>
                                        <Text className="text-amber-600 font-black">{item.goldGrams}g</Text>
                                    </View>
                                    <Text className="text-gray-500 text-[10px] mb-1">Value: ₹{item.equivalentAmount}</Text>
                                    <Text className="text-gray-400 text-[10px] mb-4">User: {item.user?.name || item.user}</Text>

                                    <View className="flex-row gap-x-2">
                                        <TouchableOpacity
                                            onPress={() => handleApproveRedemption(item._id, 'APPROVED')}
                                            className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
                                        >
                                            <Text className="text-white font-black text-[10px] uppercase">Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleApproveRedemption(item._id, 'REJECTED')}
                                            className="flex-1 bg-red-100 py-3 rounded-xl items-center"
                                        >
                                            <Text className="text-red-600 font-black text-[10px] uppercase">Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
