import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../utils/toast';
import Button from '../components/Button';

import KycRestriction from '../components/KycRestriction';

const { width } = Dimensions.get('window');

type RedemptionType = 'CASH' | 'PHYSICAL_GOLD';

export default function RedeemGoldScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [wallet, setWallet] = useState<any>({ goldBalance: 0 });
    const [currentRate, setCurrentRate] = useState<number>(0);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [bankData, setBankData] = useState<any>(null);
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');

    const [redeemType, setRedeemType] = useState<RedemptionType>('CASH');
    const [redeemGrams, setRedeemGrams] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch current rate
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

            // Fetch Addresses for Physical Delivery
            const addrResponse = await fetch(API_ENDPOINTS.BUYER_ADDRESSES, { headers });
            const addrData = await addrResponse.json();
            if (addrData.success) {
                setAddresses(addrData.data);
                const defaultAddr = addrData.data.find((a: any) => a.isDefault);
                if (defaultAddr) setSelectedAddress(defaultAddr);
                else if (addrData.data.length > 0) setSelectedAddress(addrData.data[0]);
            }

            // Fetch KYC Status
            const kycResponse = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const kycData = await kycResponse.json();
            if (kycData.success) setKycStatus(kycData.data.status);

            // Fetch Bank Details
            const bankResponse = await fetch(API_ENDPOINTS.BUYER_BANK_ACCOUNT, { headers });
            const bankResData = await bankResponse.json();
            if (bankResData.success) setBankData(bankResData.data);

        } catch (error) {
            console.error('Error fetching redemption data:', error);
            showToast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRedeem = async () => {
        const grams = Number(redeemGrams);
        if (!redeemGrams || isNaN(grams) || grams <= 0) {
            return Alert.alert('Invalid Amount', 'Please enter a valid amount of gold to redeem.');
        }

        if (grams > wallet.goldBalance) {
            return Alert.alert('Insufficient Balance', 'You do not have enough gold in your wallet.');
        }

        if (redeemType === 'PHYSICAL_GOLD' && !selectedAddress) {
            return Alert.alert('Address Required', 'Please select a delivery address for physical gold.');
        }

        if (redeemType === 'CASH' && !bankData) {
            return Alert.alert('Bank Details Required', 'Please add your bank account details to receive cash.');
        }

        try {
            setSubmitting(true);
            const headers = await getAuthHeaders();

            const payload: any = {
                redeemType,
                goldGrams: grams
            };

            if (redeemType === 'PHYSICAL_GOLD') {
                payload.deliveryAddress = {
                    street: selectedAddress.addressLine1 + (selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''),
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    zipCode: selectedAddress.pincode,
                    phoneNumber: selectedAddress.phone
                };
            } else if (redeemType === 'CASH') {
                payload.bankDetails = {
                    accountHolderName: bankData.accountHolderName,
                    accountNumber: bankData.accountNumber,
                    ifscCode: bankData.ifscCode,
                    bankName: bankData.bankName,
                    branchName: bankData.branchName,
                    accountType: bankData.accountType
                };
            }

            const response = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_REDEEM, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Redemption request submitted successfully!');
                router.replace('/digital_gold');
            } else {
                showToast.error(data.message || 'Redemption failed');
            }
        } catch (error) {
            console.error('Redeem Error:', error);
            showToast.error('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const calculateValue = () => {
        if (!redeemGrams || !currentRate) return '0.00';
        return (Number(redeemGrams) * currentRate).toLocaleString();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4">
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Skeleton width={150} height={20} />
                </View>
                <View className="p-6">
                    <Skeleton width="100%" height={120} style={{ borderRadius: 24 }} />
                    <Skeleton width={150} height={24} style={{ marginTop: 24 }} />
                    <Skeleton width="100%" height={200} style={{ borderRadius: 24, marginTop: 12 }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50 bg-white">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Digital Assets</Text>
                    <Text className="text-xl font-black text-gray-900">Redeem Gold 🪙</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="px-6 py-6 pb-20">

                    {kycStatus === 'APPROVED' ? (
                        <>
                            {/* Balance Info */}
                            <View className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 mb-8">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Available Balance</Text>
                                <View className="flex-row items-end">
                                    <Text className="text-gray-900 text-3xl font-black">{wallet.goldBalance?.toFixed(3)}g</Text>
                                    <Text className="text-gray-500 text-sm font-bold ml-2 mb-1">≈ ₹{((wallet.goldBalance || 0) * currentRate).toLocaleString()}</Text>
                                </View>
                            </View>

                            {/* Redemption Type Selection */}
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-4">Choose Redemption Mode</Text>
                            <View className="flex-row gap-x-4 mb-8">
                                <TouchableOpacity
                                    onPress={() => setRedeemType('CASH')}
                                    className={`flex-1 p-4 rounded-3xl border ${redeemType === 'CASH' ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100'}`}
                                >
                                    <View className={`w-10 h-10 rounded-2xl items-center justify-center mb-3 ${redeemType === 'CASH' ? 'bg-primary-100' : 'bg-gray-50'}`}>
                                        <Ionicons name="cash-outline" size={20} color={redeemType === 'CASH' ? '#f97316' : '#9ca3af'} />
                                    </View>
                                    <Text className={`font-black text-sm ${redeemType === 'CASH' ? 'text-primary-900' : 'text-gray-500'}`}>Convert to Cash</Text>
                                    <Text className="text-[10px] text-gray-400 mt-1">Sells gold at market rate</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setRedeemType('PHYSICAL_GOLD')}
                                    className={`flex-1 p-4 rounded-3xl border ${redeemType === 'PHYSICAL_GOLD' ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100'}`}
                                >
                                    <View className={`w-10 h-10 rounded-2xl items-center justify-center mb-3 ${redeemType === 'PHYSICAL_GOLD' ? 'bg-primary-100' : 'bg-gray-50'}`}>
                                        <Ionicons name="cube-outline" size={20} color={redeemType === 'PHYSICAL_GOLD' ? '#f97316' : '#9ca3af'} />
                                    </View>
                                    <Text className={`font-black text-sm ${redeemType === 'PHYSICAL_GOLD' ? 'text-primary-900' : 'text-gray-500'}`}>Physical Gold</Text>
                                    <Text className="text-[10px] text-gray-400 mt-1">Get coins delivered</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Bank Details Display (Only for CASH) */}
                            {redeemType === 'CASH' && (
                                <View className="mb-8">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Payout Bank Account</Text>
                                        <TouchableOpacity onPress={() => router.push('/bank_details')}>
                                            <Text className="text-primary-600 text-[10px] font-black uppercase">{bankData ? 'Change Account' : 'Add Bank Account'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {!bankData ? (
                                        <TouchableOpacity
                                            onPress={() => router.push('/bank_details')}
                                            className="bg-gray-50 rounded-3xl p-6 items-center border border-gray-100 border-dashed"
                                        >
                                            <Ionicons name="card-outline" size={32} color="#d1d5db" />
                                            <Text className="text-gray-500 mt-2 font-bold">Add bank details to continue</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                                            <View className="flex-row items-center mb-4">
                                                <View className="bg-white w-12 h-12 rounded-2xl items-center justify-center shadow-sm">
                                                    <Ionicons name="business" size={24} color="#f97316" />
                                                </View>
                                                <View className="ml-4">
                                                    <Text className="font-black text-gray-900">{bankData.bankName}</Text>
                                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{bankData.branchName}</Text>
                                                </View>
                                            </View>

                                            <View className="bg-white rounded-2xl p-4 shadow-sm">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Account Number</Text>
                                                    <Text className="text-gray-900 font-bold">
                                                        •••• •••• {bankData.accountNumber.slice(-4)}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">IFSC Code</Text>
                                                    <Text className="text-gray-900 font-bold">{bankData.ifscCode}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Amount Input */}
                            <View className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 mb-8">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Weight to Redeem (grams)</Text>
                                <View className={`bg-white rounded-2xl border p-4 mb-2 ${Number(redeemGrams) > wallet.goldBalance ? 'border-red-500' : 'border-gray-100'}`}>
                                    <View className="flex-row items-center justify-between">
                                        <TextInput
                                            placeholder="0.000"
                                            keyboardType="numeric"
                                            value={redeemGrams}
                                            onChangeText={setRedeemGrams}
                                            className="flex-1 text-gray-900 text-3xl font-black py-0"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setRedeemGrams(wallet.goldBalance?.toString())}
                                            className="bg-primary-50 px-3 py-2 rounded-xl"
                                        >
                                            <Text className="text-primary-600 font-bold text-[10px] uppercase">Max</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {Number(redeemGrams) > wallet.goldBalance && (
                                    <Text className="text-red-500 text-[10px] font-bold mb-4 px-1">
                                        Please add a correct value; your vault balance is lower than the amount entered.
                                    </Text>
                                )}

                                <View className="flex-row justify-between items-center">
                                    <Text className="text-gray-500 text-xs font-bold">Estimated {redeemType === 'CASH' ? 'Value' : 'Gold Worth'}:</Text>
                                    <Text className="text-primary-600 font-black text-xl">₹{calculateValue()}</Text>
                                </View>
                            </View>

                            {/* Address Selection (Only for Physical) */}
                            {redeemType === 'PHYSICAL_GOLD' && (
                                <View className="mb-8">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Delivery Address</Text>
                                        <TouchableOpacity onPress={() => router.push('/addresses')}>
                                            <Text className="text-primary-600 text-[10px] font-black uppercase">+ New Address</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {addresses.length === 0 ? (
                                        <TouchableOpacity
                                            onPress={() => router.push('/addresses')}
                                            className="bg-gray-50 rounded-3xl p-6 items-center border border-gray-100 border-dashed"
                                        >
                                            <Ionicons name="location-outline" size={32} color="#d1d5db" />
                                            <Text className="text-gray-500 mt-2 font-bold">Add an address to continue</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                                            <View className="flex-row">
                                                {addresses.map((addr) => (
                                                    <TouchableOpacity
                                                        key={addr._id}
                                                        onPress={() => setSelectedAddress(addr)}
                                                        className={`w-64 p-5 rounded-3xl border mr-4 ${selectedAddress?._id === addr._id ? 'bg-white border-primary-500' : 'bg-gray-50 border-gray-100'}`}
                                                    >
                                                        <View className="flex-row justify-between items-start mb-2">
                                                            <Text className="font-bold text-gray-900" numberOfLines={1}>{addr.fullName}</Text>
                                                            {selectedAddress?._id === addr._id && (
                                                                <View className="bg-primary-500 w-5 h-5 rounded-full items-center justify-center">
                                                                    <Ionicons name="checkmark" size={12} color="white" />
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text className="text-gray-500 text-xs mb-1" numberOfLines={2}>{addr.addressLine1}, {addr.city}</Text>
                                                        <Text className="text-gray-500 text-xs font-bold">{addr.pincode}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    )}
                                </View>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleRedeem}
                                disabled={submitting || Number(redeemGrams) > wallet.goldBalance || (redeemType === 'CASH' && !bankData) || (redeemType === 'PHYSICAL_GOLD' && !selectedAddress)}
                                className={`bg-primary-600 h-16 rounded-[24px] items-center justify-center mt-4 ${(submitting || Number(redeemGrams) > wallet.goldBalance || (redeemType === 'CASH' && !bankData) || (redeemType === 'PHYSICAL_GOLD' && !selectedAddress)) ? 'opacity-70' : ''}`}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest">Confirm Redemption</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View className="mt-4">
                            <KycRestriction
                                title="Redemption Access Locked"
                                message="Anti-money laundering regulations require a verified identity for all digital gold redemptions and sells."
                                buttonTitle="Complete KYC to Unlock"
                            />
                        </View>
                    )}

                    <Text className="text-center text-gray-400 text-[10px] mt-6 px-4">
                        * Redemption requests are processed within 24-48 working hours. For physical delivery, processing and transit times may vary by location.
                    </Text>

                    <Text className="text-center text-gray-400 text-[10px] mt-6 px-4">
                        * Redemption requests are processed within 24-48 working hours. For physical delivery, processing and transit times may vary by location.
                    </Text>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
