import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';

export default function RedeemPhysicalGoldScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [wallet, setWallet] = useState<any>({ goldBalance: 0 });
    const [currentRate, setCurrentRate] = useState<number>(0);
    const [redeemGrams, setRedeemGrams] = useState('');
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch wallet
            const walletRes = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_WALLET, { headers });
            const walletData = await walletRes.json();
            if (walletData.success) setWallet(walletData.data.wallet);

            // Fetch current rate
            const rateRes = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const rateData = await rateRes.json();
            if (rateData.success && rateData.data.length > 0) {
                const activeRate = rateData.data.find((r: any) => r.isActive && r.metalType === 'GOLD');
                if (activeRate) setCurrentRate(activeRate.ratePerGram);
            }

            // Fetch addresses
            const addressRes = await fetch(API_ENDPOINTS.BUYER_ADDRESSES, { headers });
            const addressData = await addressRes.json();
            if (addressData.success) {
                setAddresses(addressData.data);
                const defaultAddr = addressData.data.find((a: any) => a.isDefault);
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        const grams = Number(redeemGrams);
        if (!redeemGrams || isNaN(grams) || grams <= 0) {
            return Alert.alert('Invalid Amount', 'Please enter a valid amount of gold to redeem.');
        }

        // Fix floating-point comparison by rounding to 6 decimal places
        const roundedGrams = Number(grams.toFixed(6));
        const roundedBalance = Number((wallet.goldBalance || 0).toFixed(6));

        if (roundedGrams > roundedBalance) {
            return Alert.alert('Insufficient Balance', 'You do not have enough gold balance.');
        }

        if (!selectedAddress) {
            return Alert.alert('Address Required', 'Please select a delivery address.');
        }

        try {
            setSubmitting(true);
            const headers = await getAuthHeaders();

            const payload = {
                redeemType: 'PHYSICAL_GOLD',
                goldGrams: grams,
                deliveryAddress: {
                    street: selectedAddress.street,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    zipCode: selectedAddress.zipCode,
                    phoneNumber: selectedAddress.phoneNumber
                }
            };

            const response = await fetch(API_ENDPOINTS.BUYER_PHYSICAL_GOLD_REDEEM, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Redemption request submitted successfully!');
                router.back();
            } else {
                showToast.error(data.message || 'Failed to submit redemption request');
            }
        } catch (error) {
            console.error('Redeem Error:', error);
            showToast.error('Something went wrong');
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
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f97316" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Redeem Gold</Text>
                    <Text className="text-xl font-black text-gray-900">Physical Gold 🪙</Text>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-6">
                    {/* Balance Card */}
                    <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] p-6 mb-6">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Available Balance</Text>
                        <Text className="text-amber-900 text-4xl font-black mb-2">{wallet.goldBalance?.toFixed(3)}g</Text>
                        <Text className="text-gray-600 text-sm font-bold">Worth ₹{((wallet.goldBalance || 0) * currentRate).toLocaleString()}</Text>
                    </View>

                    {/* Redemption Type Info */}
                    <View className="bg-blue-50 rounded-[28px] p-5 mb-6 border border-blue-100">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-blue-600 rounded-2xl items-center justify-center mr-3">
                                <Ionicons name="cube" size={20} color="white" />
                            </View>
                            <Text className="text-blue-900 font-black text-lg">Physical Gold Delivery</Text>
                        </View>
                        <Text className="text-blue-700 text-sm font-medium leading-relaxed">
                            Redeem your digital gold for physical gold. We'll deliver it to your selected address.
                        </Text>
                    </View>

                    {/* Amount Input */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Weight to Redeem (grams)</Text>
                        <View className={`bg-white rounded-2xl border p-4 mb-2 ${Number(Number(redeemGrams).toFixed(6)) > Number((wallet.goldBalance || 0).toFixed(6)) ? 'border-red-500' : 'border-gray-100'}`}>
                            <View className="flex-row items-center justify-between">
                                <TextInput
                                    placeholder="0.000"
                                    keyboardType="numeric"
                                    value={redeemGrams}
                                    onChangeText={setRedeemGrams}
                                    className="flex-1 text-gray-900 text-2xl font-black"
                                />
                                <TouchableOpacity
                                    onPress={() => setRedeemGrams(wallet.goldBalance?.toString())}
                                    className="bg-primary-50 px-4 py-2 rounded-xl"
                                >
                                    <Text className="text-primary-600 font-black text-xs">MAX</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {Number(Number(redeemGrams).toFixed(6)) > Number((wallet.goldBalance || 0).toFixed(6)) && (
                            <Text className="text-red-600 text-xs font-bold mt-2">Insufficient balance</Text>
                        )}

                        <View className="bg-gray-50 rounded-2xl p-4 mt-4 flex-row justify-between items-center">
                            <Text className="text-gray-500 text-xs font-bold">Estimated Gold Worth:</Text>
                            <Text className="text-gray-900 text-xl font-black">₹{calculateValue()}</Text>
                        </View>
                    </View>

                    {/* Delivery Address */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Delivery Address</Text>

                        {selectedAddress ? (
                            <TouchableOpacity
                                onPress={() => setShowAddressModal(true)}
                                className="bg-white rounded-2xl border border-gray-100 p-5"
                            >
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="location" size={20} color="#f97316" />
                                        <Text className="text-gray-900 font-black text-base ml-2">Selected Address</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                </View>
                                <Text className="text-gray-900 font-bold text-sm mb-1">{selectedAddress.street}</Text>
                                <Text className="text-gray-600 text-xs">{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipCode}</Text>
                                {selectedAddress.phoneNumber && (
                                    <Text className="text-blue-600 font-bold text-xs mt-2">📞 {selectedAddress.phoneNumber}</Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => setShowAddressModal(true)}
                                className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 items-center"
                            >
                                <Ionicons name="add-circle-outline" size={32} color="#9ca3af" />
                                <Text className="text-gray-500 font-bold mt-2">Select Delivery Address</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleRedeem}
                        disabled={submitting || Number(Number(redeemGrams).toFixed(6)) > Number((wallet.goldBalance || 0).toFixed(6)) || !selectedAddress}
                        className={`bg-primary-600 py-4 rounded-2xl items-center shadow-lg shadow-primary-200 ${(submitting || Number(Number(redeemGrams).toFixed(6)) > Number((wallet.goldBalance || 0).toFixed(6)) || !selectedAddress) ? 'opacity-50' : ''}`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-black uppercase tracking-widest">Submit Redemption Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Address Selection Modal */}
            <Modal
                visible={showAddressModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddressModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] px-6 pt-6 pb-10 max-h-[80%]">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-2xl font-black text-gray-900">Select Address</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddressModal(false)}
                                className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center"
                            >
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {addresses.map((address) => (
                                <TouchableOpacity
                                    key={address._id}
                                    onPress={() => {
                                        setSelectedAddress(address);
                                        setShowAddressModal(false);
                                    }}
                                    className={`bg-white rounded-2xl border p-5 mb-3 ${selectedAddress?._id === address._id ? 'border-primary-600 bg-primary-50' : 'border-gray-100'}`}
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="location" size={16} color={selectedAddress?._id === address._id ? '#f97316' : '#6b7280'} />
                                            <Text className={`font-black text-sm ml-2 ${selectedAddress?._id === address._id ? 'text-primary-900' : 'text-gray-900'}`}>
                                                {address.label || 'Address'}
                                            </Text>
                                        </View>
                                        {address.isDefault && (
                                            <View className="bg-green-100 px-2 py-1 rounded-full">
                                                <Text className="text-green-700 text-[9px] font-black">DEFAULT</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-gray-900 font-bold text-sm mb-1">{address.street}</Text>
                                    <Text className="text-gray-600 text-xs">{address.city}, {address.state} - {address.zipCode}</Text>
                                    {address.phoneNumber && (
                                        <Text className="text-blue-600 font-bold text-xs mt-2">📞 {address.phoneNumber}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}

                            {addresses.length === 0 && (
                                <View className="py-10 items-center">
                                    <Ionicons name="location-outline" size={48} color="#d1d5db" />
                                    <Text className="text-gray-400 font-bold mt-4">No addresses found</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowAddressModal(false);
                                            router.push('/addresses');
                                        }}
                                        className="bg-primary-600 px-6 py-3 rounded-2xl mt-4"
                                    >
                                        <Text className="text-white font-black text-sm">Add Address</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
