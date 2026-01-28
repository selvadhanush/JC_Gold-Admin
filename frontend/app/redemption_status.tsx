import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../utils/toast';

export default function RedemptionStatusScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [redemptions, setRedemptions] = useState<any[]>([]);

    const fetchRedemptions = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_REDEMPTIONS, { headers });
            const data = await response.json();

            if (data.success) {
                setRedemptions(data.data);
            } else {
                showToast.error('Failed to load redemptions');
            }
        } catch (error) {
            console.error('Error fetching redemptions:', error);
            showToast.error('Failed to load redemptions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRedemptions();
        }, [fetchRedemptions])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchRedemptions();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' };
            case 'READY_FOR_PICKUP':
                return { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' };
            case 'APPROVED':
                return { bg: '#e0e7ff', text: '#4338ca', dot: '#6366f1' };
            case 'REQUESTED':
                return { bg: '#fff7ed', text: '#ea580c', dot: '#f97316' };
            case 'REJECTED':
                return { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' };
            default:
                return { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' };
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'REQUESTED':
                return 'Pending Confirmation';
            case 'APPROVED':
                return 'Approved - Processing';
            case 'READY_FOR_PICKUP':
                return 'Ready for Pickup';
            case 'COMPLETED':
                return 'Completed';
            case 'REJECTED':
                return 'Rejected';
            default:
                return status;
        }
    };

    const handleContactHelp = () => {
        router.push('/support');
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
                <View className="p-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} width="100%" height={120} style={{ borderRadius: 24, marginBottom: 16 }} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50 bg-white">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Redemption Status</Text>
                    <Text className="text-xl font-black text-gray-900">My Requests 📋</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
                className="flex-1"
            >
                <View className="px-6 py-6 pb-24">
                    {redemptions.length === 0 ? (
                        <View className="bg-gray-50 rounded-[32px] p-12 items-center border border-gray-100 border-dashed mt-8">
                            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                                <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
                            </View>
                            <Text className="text-gray-900 font-black text-lg mb-2">No Redemptions Yet</Text>
                            <Text className="text-gray-400 text-center text-sm">Your redemption requests will appear here</Text>
                        </View>
                    ) : (
                        redemptions.map((redemption) => {
                            const statusColors = getStatusColor(redemption.status);
                            const isPhysicalGold = redemption.redeemType === 'PHYSICAL_GOLD';
                            const isReadyForPickup = redemption.status === 'READY_FOR_PICKUP';

                            return (
                                <View
                                    key={redemption._id}
                                    className="bg-white rounded-[28px] overflow-hidden border border-gray-100 mb-4"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.04,
                                        shadowRadius: 8,
                                        elevation: 2
                                    }}
                                >
                                    {/* Header */}
                                    <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View
                                                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                                                style={{ backgroundColor: isPhysicalGold ? '#fef3c7' : '#dbeafe' }}
                                            >
                                                <Ionicons
                                                    name={isPhysicalGold ? 'cube-outline' : 'cash-outline'}
                                                    size={28}
                                                    color={isPhysicalGold ? '#f59e0b' : '#3b82f6'}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-900 font-black text-base mb-1">
                                                    {isPhysicalGold ? 'Physical Gold' : 'Cash'} Redemption
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                                                    <Text className="text-gray-400 text-xs font-bold ml-1.5">
                                                        {new Date(redemption.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Status Badge */}
                                        <View
                                            className="px-3 py-2 rounded-full flex-row items-center"
                                            style={{ backgroundColor: statusColors.bg }}
                                        >
                                            <View
                                                className="w-2 h-2 rounded-full mr-2"
                                                style={{ backgroundColor: statusColors.dot }}
                                            />
                                            <Text
                                                className="text-[10px] font-black uppercase tracking-wider"
                                                style={{ color: statusColors.text }}
                                            >
                                                {getStatusText(redemption.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Details */}
                                    <View className="px-5 pb-5">
                                        <View className="bg-gray-50 rounded-2xl p-4">
                                            <View className="flex-row justify-between items-center mb-3">
                                                <View className="flex-1">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Gold Amount</Text>
                                                    <Text className="text-2xl font-black text-orange-600">
                                                        {redemption.goldGrams?.toFixed(3)}g
                                                    </Text>
                                                </View>
                                                <View className="w-px h-12 bg-gray-200 mx-4" />
                                                <View className="flex-1 items-end">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Value</Text>
                                                    <Text className="text-gray-900 text-xl font-black">
                                                        ₹{redemption.equivalentAmount?.toLocaleString()}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Pickup Location for Physical Gold */}
                                            {isReadyForPickup && redemption.pickupLocation && (
                                                <View className="mt-4 pt-4 border-t border-gray-200">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Pickup Location</Text>
                                                    <View className="bg-white rounded-xl p-3">
                                                        <Text className="text-gray-900 font-bold text-sm mb-1">
                                                            {redemption.pickupLocation.storeName}
                                                        </Text>
                                                        <Text className="text-gray-500 text-xs mb-2">
                                                            {redemption.pickupLocation.address}
                                                        </Text>
                                                        {redemption.pickupLocation.contactNumber && (
                                                            <TouchableOpacity
                                                                onPress={() => Linking.openURL(`tel:${redemption.pickupLocation.contactNumber}`)}
                                                                className="flex-row items-center"
                                                            >
                                                                <Ionicons name="call-outline" size={14} color="#f97316" />
                                                                <Text className="text-primary-600 text-xs font-bold ml-1">
                                                                    {redemption.pickupLocation.contactNumber}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        )}
                                                        {redemption.pickupLocation.instructions && (
                                                            <Text className="text-gray-400 text-xs mt-2 italic">
                                                                {redemption.pickupLocation.instructions}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Rejection Reason */}
                                            {redemption.status === 'REJECTED' && redemption.rejectionReason && (
                                                <View className="mt-4 pt-4 border-t border-gray-200">
                                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Rejection Reason</Text>
                                                    <Text className="text-red-600 text-sm">{redemption.rejectionReason}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Action Buttons */}
                                        {isReadyForPickup && (
                                            <View className="mt-4 flex-row gap-x-3">
                                                <TouchableOpacity
                                                    onPress={handleContactHelp}
                                                    className="flex-1 bg-gray-100 py-3 rounded-2xl items-center"
                                                >
                                                    <Text className="text-gray-700 font-bold text-xs">Contact Help</Text>
                                                </TouchableOpacity>
                                                {redemption.pickupLocation?.contactNumber && (
                                                    <TouchableOpacity
                                                        onPress={() => Linking.openURL(`tel:${redemption.pickupLocation.contactNumber}`)}
                                                        className="flex-1 bg-primary-600 py-3 rounded-2xl items-center"
                                                    >
                                                        <Text className="text-white font-bold text-xs">Call Store</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
