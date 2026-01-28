import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Dimensions, Image, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../utils/toast';
import RazorpayModal from '../components/RazorpayModal';
import KycRestriction from '../components/KycRestriction';

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
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [rzpData, setRzpData] = useState<any>(null);
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [isSimulating, setIsSimulating] = useState(false);

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
            if (transData.success) {
                console.log('[Transaction Debug] First transaction:', JSON.stringify(transData.data[0]));
                console.log('[Transaction Debug] Rate at time:', transData.data[0]?.goldRateAtTime);
                console.log('[Transaction Debug] Current rate:', currentRate);
                setTransactions(transData.data);
            }

            // Fetch KYC Status
            const kycResponse = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const kycData = await kycResponse.json();
            console.log('[KYC Debug] Full Response:', JSON.stringify(kycData));
            if (kycData.success) {
                console.log('[KYC Debug] Status:', kycData.data.status);
                setKycStatus(kycData.data.status);
            } else {
                console.error('[KYC Debug] API Error:', kycData.message);
                // Don't set status if API fails - keep previous state
            }

        } catch (error) {
            console.error('Error fetching digital gold data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Only use useFocusEffect to prevent duplicate calls and rate limiting
    useFocusEffect(
        useCallback(() => {
            console.log('[KYC Debug] Page focused, refreshing data');
            initData();
        }, [initData])
    );

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

            // Create Razorpay Order
            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_ORDER, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'DIGITAL_GOLD',
                    amount: Number(buyAmount)
                })
            });

            const data = await response.json();
            if (data.success) {
                setRzpData(data); // Trust the amount from backend (paise)
                setShowRazorpayModal(true);
            } else {
                showToast.error(data.message || 'Failed to initialize payment');
            }
        } catch (error) {
            showToast.error('Failed to process purchase');
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyPayment = async (rzpOrderId: string, rzpPaymentId: string) => {
        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();

            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_VERIFY, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'DIGITAL_GOLD',
                    amount: rzpData.amount / 100,
                    razorpay_order_id: rzpOrderId,
                    razorpay_payment_id: rzpPaymentId,
                    razorpay_signature: 'SIMULATED_SIGNATURE'
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Gold purchase successful! Waiting for gram approval.');
                setBuyAmount('');
                initData();
                setShowRazorpayModal(false);
            } else {
                showToast.error(data.message || 'Payment verification failed');
            }
        } catch (error) {
            showToast.error('Something went wrong during verification');
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
                                <View className="flex-row items-center mt-2">
                                    <View>
                                        <Text className="text-white/60 text-[10px] uppercase font-bold">Current Value</Text>
                                        <Text className="text-white font-bold">₹{((wallet.goldBalance || 0) * currentRate).toLocaleString()}</Text>
                                    </View>
                                    <View className="mx-4 w-[1px] h-8 bg-white/20" />
                                    <View>
                                        <Text className="text-white/60 text-[10px] uppercase font-bold">Invested</Text>
                                        <Text className="text-white font-bold">₹{(wallet.totalInvested || 0).toLocaleString()}</Text>
                                    </View>
                                </View>
                                {wallet.totalProfit !== undefined && (
                                    <View className="mt-3 flex-row items-center">
                                        <View className={`px-2 py-1 rounded-lg ${wallet.totalProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            <Text className={`text-[10px] font-black ${wallet.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {wallet.totalProfit >= 0 ? '+' : ''}{wallet.profitPercentage?.toFixed(2)}% (₹{Math.abs(wallet.totalProfit).toLocaleString()})
                                            </Text>
                                        </View>
                                        <Text className="text-white/40 text-[9px] ml-2 uppercase font-black tracking-tighter">Total Performance</Text>
                                    </View>
                                )}
                            </View>
                            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                                <Ionicons name="briefcase" size={24} color="white" />
                            </View>
                        </View>

                        <View className="flex-row gap-x-3">
                            <TouchableOpacity
                                onPress={() => router.push('/redeem_gold')}
                                className="flex-1 bg-white/20 py-3 rounded-2xl items-center border border-white/30"
                            >
                                <Text className="text-white font-bold text-xs">Redeem</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/redemption_status')}
                                className="flex-1 bg-white py-3 rounded-2xl items-center"
                            >
                                <Text className="text-primary-600 font-bold text-xs">History</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
                    </View>

                    {/* Quick Buy Section */}
                    <View className="mt-8">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Invest in Gold</Text>

                        {kycStatus === 'APPROVED' ? (
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
                        ) : (
                            <KycRestriction
                                title="Gold Vault Access Locked"
                                message="Anti-money laundering regulations require a verified identity for all digital gold investments."
                                buttonTitle="Verify & Start Investing"
                            />
                        )}
                    </View>

                    {/* Recent Transactions */}
                    <View className="mt-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-2xl font-black text-gray-900">Recent Activity</Text>
                                <View className="h-1.5 w-12 bg-orange-600 rounded-full mt-2" />
                            </View>
                            <TouchableOpacity
                                className="flex-row items-center bg-gray-50 px-4 py-2.5 rounded-xl"
                                onPress={() => router.push('/transactions_history')}
                                activeOpacity={0.7}
                            >
                                <Text className="text-gray-700 text-xs font-black uppercase tracking-wider mr-1">View All</Text>
                                <Ionicons name="chevron-forward" size={14} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {transactions.length === 0 ? (
                            <View className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[32px] p-12 items-center border border-gray-200 border-dashed">
                                <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                                    <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
                                </View>
                                <Text className="text-gray-900 font-black text-lg mb-2">No Transactions Yet</Text>
                                <Text className="text-gray-400 text-center text-sm">Your gold purchase and redemption history will appear here</Text>
                            </View>
                        ) : (
                            <View>
                                {transactions.slice(0, 5).map((item, index) => (
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
                                                        backgroundColor: item.type === 'BUY' ? '#dcfce7' : item.type === 'REDEEM' ? '#fef3c7' : '#fee2e2'
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={item.type === 'BUY' ? 'arrow-down-circle' : item.type === 'REDEEM' ? 'arrow-up-circle' : 'close-circle'}
                                                        size={28}
                                                        color={item.type === 'BUY' ? '#16a34a' : item.type === 'REDEEM' ? '#f59e0b' : '#ef4444'}
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

                                                {/* Additional Details Row */}
                                                <View className="flex-row items-center pt-3 border-t border-gray-200">
                                                    <View className="flex-1">
                                                        <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Rate/gram</Text>
                                                        <Text className="text-gray-700 text-xs font-bold">
                                                            ₹{item.goldRateAtTime?.toLocaleString() || '0'}
                                                        </Text>
                                                    </View>
                                                    {item.transactionId && (
                                                        <View className="flex-1 items-end">
                                                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Transaction ID</Text>
                                                            <Text className="text-gray-700 text-xs font-mono font-bold">
                                                                {item.transactionId}
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

                </View>
            </ScrollView>

            <BottomNav />

            <RazorpayModal
                isVisible={showRazorpayModal}
                onClose={() => setShowRazorpayModal(false)}
                onSuccess={(oId, pId) => verifyPayment(oId, pId)}
                amount={rzpData?.amount || 0}
                orderId={rzpData?.order_id || ''}
            />
        </SafeAreaView>
    );
}
