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
import * as SecureStore from 'expo-secure-store';
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
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [isSimulating, setIsSimulating] = useState(false);
    const [shopAddress, setShopAddress] = useState('JC Gold & Jewels showroom.');
    const [showShopModal, setShowShopModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Razorpay States
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [rzpData, setRzpData] = useState<any>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    const initData = useCallback(async () => {
        try {
            const storedUserType = await SecureStore.getItemAsync('userType');
            setUserType(storedUserType);
            console.log('[Auth Debug] Current User Type:', storedUserType);

            const headers = await getAuthHeaders();

            // Fetch rate history (to get current rate)
            const rateResponse = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const rateData = await rateResponse.json();
            console.log('[Rate Debug] Success:', rateData.success, 'Status:', rateResponse.status);
            if (rateData.success && rateData.data.length > 0) {
                const activeRate = rateData.data.find((r: any) => r.isActive && r.metalType === 'GOLD');
                if (activeRate) setCurrentRate(activeRate.ratePerGram);
            }

            // Fetch Wallet
            const walletResponse = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_WALLET, { headers });
            const walletData = await walletResponse.json();
            console.log('[Wallet Debug] Success:', walletData.success, 'Status:', walletResponse.status);
            if (walletResponse.status === 401) setIsUnauthorized(true);
            if (walletData.success) setWallet(walletData.data.wallet);

            // Fetch Transactions
            const transResponse = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_TRANSACTIONS, { headers });
            const transData = await transResponse.json();
            console.log('[Transaction Debug] Success:', transData.success, 'Status:', transResponse.status);
            if (transData.success) {
                setTransactions(transData.data);
            }

            // Fetch KYC Status
            const kycResponse = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const kycData = await kycResponse.json();
            console.log('[KYC Debug] Success:', kycData.success, 'Status:', kycResponse.status);
            if (kycData.success) {
                setKycStatus(kycData.data.status);
            } else {
                console.error('[KYC Debug] API Error:', kycData.message);
                if (kycResponse.status === 401) setIsUnauthorized(true);
            }

            // Fetch Shop Address
            const shopResponse = await fetch(API_ENDPOINTS.BUYER_SHOP_ADDRESS, { headers });
            const shopData = await shopResponse.json();
            if (shopData.success) {
                setShopAddress(shopData.data);
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
        if (!buyAmount || Number(buyAmount) < 100) {
            showToast.error('Minimum purchase amount is ₹100');
            return;
        }

        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();
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
                setRzpData(data);
                setShowRazorpayModal(true);
            } else {
                showToast.error(data.message || 'Payment initialization failed');
            }
        } catch (error) {
            showToast.error('Failed to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyPayment = async (rzpOrderId: string, rzpPaymentId: string) => {
        try {
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
                showToast.success('Gold purchased successfully! ✨');
                setBuyAmount('');
                initData();
                setShowRazorpayModal(false);
            } else {
                showToast.error(data.message || 'Payment verification failed');
            }
        } catch (error) {
            showToast.error('Verification failed');
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
                <TouchableOpacity
                    onPress={() => setShowHelpModal(true)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-orange-50"
                >
                    <Ionicons name="help-circle-outline" size={24} color="#f97316" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
            >
                <View className="px-6 py-6 pb-24">
                    {isUnauthorized ? (
                        <View className="bg-red-50 rounded-[32px] p-8 border border-red-100 items-center">
                            <View className="w-16 h-16 bg-red-100 rounded-2xl items-center justify-center mb-4">
                                <Ionicons name="lock-closed" size={32} color="#ef4444" />
                            </View>
                            <Text className="text-xl font-black text-gray-900 mb-2">Access Restricted</Text>
                            <Text className="text-gray-500 text-center text-sm mb-6">
                                {userType === 'admin'
                                    ? "You are logged in as an Admin. This page is only accessible to Buyer accounts."
                                    : "Your session has expired or you are not authorized to view this page."}
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.replace('/login')}
                                className="bg-gray-900 px-8 py-4 rounded-2xl"
                            >
                                <Text className="text-white font-black uppercase text-xs tracking-widest">
                                    {userType === 'admin' ? "Switch to Buyer" : "Log In Again"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>

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
                                                <Text className="text-white/40 text-[8px]">@ ₹{((wallet.totalInvested || 0) / (wallet.goldBalance || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/g</Text>
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

                                <TouchableOpacity
                                    onPress={() => setShowShopModal(true)}
                                    activeOpacity={0.7}
                                    className="bg-white/10 py-4 px-4 rounded-2xl border border-white/20 mt-4"
                                >
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="location-outline" size={16} color="white" />
                                        <Text className="text-white font-black text-xs ml-2 uppercase tracking-widest">Visit Store to Redeem</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-white/70 text-[10px] leading-relaxed flex-1" numberOfLines={1}>{shopAddress}</Text>
                                        <Ionicons name="chevron-forward" size={12} color="white" />
                                    </View>
                                </TouchableOpacity>

                                <View className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full" />
                            </View>

                            {/* Quick Buy Section */}
                            <View className="mt-8">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Invest in Gold</Text>

                                {kycStatus === 'APPROVED' ? (
                                    <View className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                                        <View className="flex-row justify-between items-center mb-6">
                                            <View>
                                                <Text className="text-gray-900 font-black text-xl">Buy Digital Gold</Text>
                                                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Instant Vault Update</Text>
                                            </View>
                                            <View className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                                                <Text className="text-green-700 text-[10px] font-black uppercase">₹{currentRate}/g</Text>
                                            </View>
                                        </View>

                                        <View className="bg-gray-50 rounded-3xl p-6 mb-6">
                                            <View className="flex-row justify-between items-center mb-4">
                                                <Text className="text-gray-400 font-black text-[9px] uppercase tracking-widest">Entry Amount</Text>
                                                <View className="flex-row items-baseline">
                                                    <Text className="text-orange-600 font-black text-sm">{calculateGrams()}</Text>
                                                    <Text className="text-orange-400 text-[10px] font-bold ml-1 uppercase">grams</Text>
                                                </View>
                                            </View>

                                            <View className="flex-row items-center">
                                                <Text className="text-4xl font-black text-gray-300 mr-2">₹</Text>
                                                <TextInput
                                                    placeholder="0.00"
                                                    keyboardType="numeric"
                                                    className="flex-1 text-4xl font-black text-gray-900 h-16"
                                                    value={buyAmount}
                                                    onChangeText={setBuyAmount}
                                                    maxLength={8}
                                                />
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between mb-8 gap-2">
                                            {[500, 1000, 5000, 10000].map((amount) => (
                                                <TouchableOpacity
                                                    key={amount}
                                                    onPress={() => setBuyAmount(amount.toString())}
                                                    className={`flex-1 py-3 rounded-xl border ${buyAmount === amount.toString() ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-100'}`}
                                                >
                                                    <Text className={`text-[10px] font-black text-center ${buyAmount === amount.toString() ? 'text-white' : 'text-gray-500'}`}>₹{amount.toLocaleString()}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleBuyGold}
                                            disabled={isProcessing}
                                            activeOpacity={0.8}
                                            className={`bg-gray-900 w-full py-5 rounded-[24px] flex-row items-center justify-center shadow-xl shadow-gray-200 ${isProcessing ? 'opacity-50' : ''}`}
                                        >
                                            {isProcessing ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <>
                                                    <Text className="text-white font-black text-sm uppercase tracking-[2px] mr-2">Complete Purchase</Text>
                                                    <Ionicons name="arrow-forward-circle" size={20} color="white" />
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        {Number(buyAmount) > 0 && Number(buyAmount) < 100 && (
                                            <Text className="text-red-500 text-[9px] font-black uppercase text-center mt-4 tracking-widest">Minimum purchase is ₹100</Text>
                                        )}
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
                                            <TouchableOpacity
                                                key={item._id}
                                                onPress={() => router.push('/transactions_history')}
                                                className="bg-white rounded-[28px] overflow-hidden border border-gray-100 mb-4"
                                                style={{
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.04,
                                                    shadowRadius: 8,
                                                    elevation: 2
                                                }}
                                                activeOpacity={0.8}
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

                                                        {/* Rejection Reason Display */}
                                                        {item.status === 'REJECTED' && item.rejectionReason && (
                                                            <View className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                                                                <View className="flex-row items-center mb-1">
                                                                    <Ionicons name="alert-circle" size={12} color="#dc2626" />
                                                                    <Text className="text-red-700 font-black text-[8px] uppercase tracking-widest ml-2">Rejection Reason</Text>
                                                                </View>
                                                                <Text className="text-red-600 text-[10px] font-bold">
                                                                    {item.rejectionReason}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            <BottomNav />

            {/* Premium Shop Details Modal */}
            <Modal
                visible={showShopModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowShopModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="bg-white rounded-[40px] w-full p-8 shadow-2xl overflow-hidden relative">
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full" />

                        <View className="items-center mb-6">
                            <View className="w-20 h-20 bg-orange-100 rounded-3xl items-center justify-center mb-4 border-4 border-white shadow-sm">
                                <Ionicons name="storefront" size={40} color="#f97316" />
                            </View>
                            <Text className="text-2xl font-black text-gray-900">Visit Our Shop 🛍️</Text>
                            <View className="h-1 w-12 bg-orange-500 rounded-full mt-2" />
                        </View>

                        <View className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="location" size={16} color="#f97316" />
                                <Text className="text-[10px] font-black uppercase tracking-widest text-orange-600 ml-2">Showroom Address</Text>
                            </View>
                            <Text className="text-gray-900 font-bold text-base leading-6">
                                {shopAddress || 'Visit our JC Gold & Jewels showroom.'}
                            </Text>
                        </View>

                        <Text className="text-gray-500 text-xs text-center leading-5 mb-8 px-4">
                            Our specialists will assist you with the purchase and update your digital wallet instantly.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowShopModal(false)}
                            className="bg-primary-600 w-full py-5 rounded-[24px] items-center shadow-lg shadow-primary-300"
                        >
                            <Text className="text-white font-black text-base uppercase tracking-widest">OK, Understood</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Premium Help Modal */}
            <Modal
                visible={showHelpModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowHelpModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="bg-white rounded-[40px] w-full p-8 shadow-2xl overflow-hidden relative">
                        <View className="absolute -top-10 -left-10 w-40 h-40 bg-orange-50 rounded-full" />

                        <View className="items-center mb-6">
                            <View className="w-20 h-20 bg-orange-100 rounded-3xl items-center justify-center mb-4 border-4 border-white shadow-sm">
                                <Ionicons name="information-circle" size={40} color="#f97316" />
                            </View>
                            <Text className="text-2xl font-black text-gray-900">Digital Gold Help 💡</Text>
                            <View className="h-1 w-12 bg-orange-500 rounded-full mt-2" />
                        </View>

                        <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                            <View className="space-y-6">
                                <View className="flex-row items-start space-x-4">
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mt-1">
                                        <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-black text-sm mb-1">100% Secured</Text>
                                        <Text className="text-gray-500 text-xs leading-5">Your gold is stored in high-security, insured vaults and is audited regularly.</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start space-x-4">
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mt-1">
                                        <Ionicons name="stats-chart" size={20} color="#f97316" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-black text-sm mb-1">Live Rates</Text>
                                        <Text className="text-gray-500 text-xs leading-5">Buy gold at real-time market rates. The value of your vault updates instantly.</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start space-x-4">
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mt-1">
                                        <Ionicons name="gift" size={20} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-black text-sm mb-1">Redeem Anywhere</Text>
                                        <Text className="text-gray-500 text-xs leading-5">Redeem your digital gold for physical jewelry at our showroom or request delivery.</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-start space-x-4">
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mt-1">
                                        <Ionicons name="diamond" size={20} color="#8b5cf6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-black text-sm mb-1">No Storage Fees</Text>
                                        <Text className="text-gray-500 text-xs leading-5">Own gold without the worry of storage or insurance costs. We handle it all.</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setShowHelpModal(false)}
                            className="bg-gray-900 w-full py-5 rounded-[24px] items-center shadow-lg shadow-gray-300 mt-8"
                        >
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Close Guide</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
