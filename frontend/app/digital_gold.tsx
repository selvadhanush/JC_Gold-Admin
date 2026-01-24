import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Dimensions, Image } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function DigitalGoldScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [wallet, setWallet] = useState<any>({ goldBalance: 0 });
    const [currentRate, setCurrentRate] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [buyAmount, setBuyAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const initData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch rate history (to get current rate)
            const rateResponse = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const rateData = await rateResponse.json();
            if (rateData.success && rateData.data.length > 0) {
                const activeRate = rateData.data.find((r: any) => r.isActive && r.metalType === 'GOLD');
                if (activeRate) setCurrentRate(activeRate.ratePerGram);
            }

            // Fetch Wallet
            const walletResponse = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_WALLET, { headers });
            const walletData = await walletResponse.json();
            if (walletData.success) setWallet(walletData.data.wallet);

            // Fetch Transactions
            const transResponse = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_TRANSACTIONS, { headers });
            const transData = await transResponse.json();
            if (transData.success) setTransactions(transData.data);

        } catch (error) {
            console.error('Error fetching digital gold data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        initData();
    }, [initData]);

    const onRefresh = () => {
        setRefreshing(true);
        initData();
    };

    const handleBuyGold = async () => {
        if (!buyAmount || isNaN(Number(buyAmount)) || Number(buyAmount) < 10) {
            return Alert.alert('Invalid Amount', 'Please enter a valid amount (Minimum ₹10)');
        }

        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_BUY, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: Number(buyAmount),
                    paymentMethod: 'ONLINE' // Simplified for now
                })
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Gold purchase request submitted. It will be added to your wallet after admin approval.');
                setBuyAmount('');
                initData();
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to process purchase');
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateGrams = () => {
        if (!buyAmount || !currentRate) return '0.000';
        return (Number(buyAmount) / currentRate).toFixed(3);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4">
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Skeleton width={150} height={20} />
                </View>
                <ScrollView className="px-6 py-6">
                    <Skeleton width="100%" height={160} style={{ borderRadius: 32 }} />
                    <Skeleton width={120} height={20} style={{ marginTop: 32 }} />
                    <Skeleton width="100%" height={100} style={{ borderRadius: 24, marginTop: 16 }} />
                    <Skeleton width={120} height={20} style={{ marginTop: 32 }} />
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} width="100%" height={70} style={{ borderRadius: 20, marginTop: 12 }} />
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">JC Digital Vault</Text>
                        <Text className="text-xl font-black text-gray-900">Gold Wallet 💰</Text>
                    </View>
                </View>
                <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-orange-50">
                    <Ionicons name="help-circle-outline" size={24} color="#f97316" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
            >
                <View className="px-6 py-6 pb-24">

                    {/* Wallet Balance Card */}
                    <View className="bg-primary-600 rounded-[32px] p-6 shadow-xl shadow-primary-200 overflow-hidden">
                        <View className="flex-row justify-between items-start mb-6">
                            <View>
                                <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Total Gold Balance</Text>
                                <Text className="text-white text-4xl font-black">{wallet.goldBalance?.toFixed(3)}g</Text>
                                <Text className="text-white/60 text-xs mt-1">Value: ₹{(wallet.goldBalance * currentRate).toLocaleString()}</Text>
                            </View>
                            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                                <Ionicons name="briefcase" size={24} color="white" />
                            </View>
                        </View>

                        <View className="flex-row gap-x-3">
                            <TouchableOpacity
                                onPress={() => router.push('/buyer_tickets')} // Or a dedicated redeem screen
                                className="flex-1 bg-white/20 py-3 rounded-2xl items-center border border-white/30"
                            >
                                <Text className="text-white font-bold text-xs">Redeem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-white py-3 rounded-2xl items-center">
                                <Text className="text-primary-600 font-bold text-xs">History</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
                    </View>

                    {/* Quick Buy Section */}
                    <View className="mt-8">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Invest in Gold</Text>
                        <View className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-gray-900 font-bold">Buy Gold</Text>
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                    <Text className="text-green-700 text-[10px] font-black">₹{currentRate}/g</Text>
                                </View>
                            </View>

                            <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2">Amount to Invest (₹)</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-900 text-2xl font-black mr-2">₹</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={buyAmount}
                                        onChangeText={setBuyAmount}
                                        className="flex-1 text-gray-900 text-2xl font-black py-0"
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-gray-500 text-xs">Estimated Gold:</Text>
                                <Text className="text-primary-600 font-black text-lg">{calculateGrams()}g</Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleBuyGold}
                                disabled={isProcessing}
                                className={`bg-primary-600 py-4 rounded-2xl items-center shadow-lg shadow-primary-200 ${isProcessing ? 'opacity-70' : ''}`}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest">Buy Now</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Transactions */}
                    <View className="mt-10">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Recent Transactions</Text>
                            <TouchableOpacity>
                                <Text className="text-primary-600 text-[10px] font-black uppercase">View All</Text>
                            </TouchableOpacity>
                        </View>

                        {transactions.length === 0 ? (
                            <View className="bg-gray-50 rounded-[24px] p-8 items-center border border-gray-100 border-dashed">
                                <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
                                <Text className="text-gray-400 mt-2 font-medium">No transactions yet</Text>
                            </View>
                        ) : (
                            transactions.slice(0, 5).map((item) => (
                                <View
                                    key={item._id}
                                    className="bg-white rounded-[24px] p-4 mb-3 border border-gray-50 shadow-sm flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${item.type === 'BUY' ? 'bg-green-50' : 'bg-red-50'
                                            }`}>
                                            <Ionicons
                                                name={item.type === 'BUY' ? 'arrow-down' : 'arrow-up'}
                                                size={18}
                                                color={item.type === 'BUY' ? '#10b981' : '#ef4444'}
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-gray-900 font-bold text-sm">
                                                {item.type === 'BUY' ? 'Gold Purchase' : 'Redemption'}
                                            </Text>
                                            <Text className="text-gray-400 text-[10px]">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className={`font-black text-sm ${item.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {item.type === 'BUY' ? '+' : '-'}{item.goldGrams}g
                                        </Text>
                                        <View className={`px-2 py-0.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-50' :
                                                item.status === 'PENDING' ? 'bg-orange-50' : 'bg-red-50'
                                            }`}>
                                            <Text className={`text-[8px] font-black ${item.status === 'COMPLETED' ? 'text-green-600' :
                                                    item.status === 'PENDING' ? 'text-orange-600' : 'text-red-600'
                                                }`}>
                                                {item.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                </View>
            </ScrollView>

            <BottomNav />
        </SafeAreaView>
    );
}
