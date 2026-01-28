import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Dimensions } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

type TabKey = 'ALL' | 'REQUESTED' | 'APPROVED' | 'READY_FOR_PICKUP' | 'COMPLETED';

interface Tab {
    key: TabKey;
    label: string;
    status: string | null;
    icon: string;
    color: string;
}

const tabs: Tab[] = [
    { key: 'ALL', label: 'All', status: null, icon: 'list', color: '#6b7280' },
    { key: 'REQUESTED', label: 'Requested', status: 'REQUESTED', icon: 'time', color: '#f97316' },
    { key: 'APPROVED', label: 'Approved', status: 'APPROVED', icon: 'checkmark-circle', color: '#3b82f6' },
    { key: 'READY_FOR_PICKUP', label: 'Ready', status: 'READY_FOR_PICKUP', icon: 'cube', color: '#8b5cf6' },
    { key: 'COMPLETED', label: 'Completed', status: 'COMPLETED', icon: 'checkmark-done', color: '#10b981' },
];

export default function OrderDigitalGold() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allRedemptions, setAllRedemptions] = useState<any[]>([]);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
    const [pickupLocation, setPickupLocation] = useState({
        storeName: '',
        address: '',
        contactNumber: '',
        instructions: ''
    });

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            // Fetch all redemptions (both CASH and PHYSICAL_GOLD)
            const response = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemptions`, { headers });
            const data = await response.json();
            if (data.success) {
                setAllRedemptions(data.data);
            }
        } catch (error) {
            console.error('Error fetching order gold data:', error);
            showToast.error('Failed to load redemptions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getFilteredRedemptions = () => {
        if (activeTab === 'ALL') return allRedemptions;
        return allRedemptions.filter(r => r.status === tabs.find(t => t.key === activeTab)?.status);
    };

    const handleTabPress = (tabKey: TabKey, index: number) => {
        setActiveTab(tabKey);
        scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    };

    const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_REDEMPTION_APPROVE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success(`Redemption ${status.toLowerCase()}`);
                fetchData();
            } else {
                showToast.error(data.message || 'Failed to process');
            }
        } catch (error) {
            showToast.error('Failed to process redemption');
        }
    };

    const handleMarkReadyForPickup = async () => {
        if (!pickupLocation.storeName || !pickupLocation.address || !pickupLocation.contactNumber) {
            showToast.error('Please fill in all required fields');
            return;
        }

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemption/ready-for-pickup/${selectedRedemption._id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ pickupLocation })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Marked as ready for pickup');
                setShowPickupModal(false);
                setPickupLocation({ storeName: '', address: '', contactNumber: '', instructions: '' });
                fetchData();
            } else {
                showToast.error(data.message || 'Failed to update');
            }
        } catch (error) {
            showToast.error('Failed to mark ready for pickup');
        }
    };

    const handleMarkCollected = async (id: string) => {
        Alert.alert(
            'Confirm Collection',
            'Has the customer collected their physical gold?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemption/mark-collected/${id}`, {
                                method: 'PUT',
                                headers
                            });

                            const data = await response.json();
                            if (data.success) {
                                showToast.success('Marked as collected');
                                fetchData();
                            } else {
                                showToast.error(data.message || 'Failed to update');
                            }
                        } catch (error) {
                            showToast.error('Failed to mark as collected');
                        }
                    }
                }
            ]
        );
    };

    const handleMarkAsPaid = async (id: string) => {
        Alert.alert(
            'Confirm Payment',
            'Has the cash payment been transferred to the customer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_REDEMPTION_APPROVE(id), {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify({ status: 'COMPLETED' })
                            });

                            const data = await response.json();
                            if (data.success) {
                                showToast.success('Marked as paid and completed');
                                fetchData();
                            } else {
                                showToast.error(data.message || 'Failed to update');
                            }
                        } catch (error) {
                            showToast.error('Failed to mark as paid');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REQUESTED': return { bg: '#fff7ed', text: '#ea580c', dot: '#f97316' };
            case 'APPROVED': return { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' };
            case 'READY_FOR_PICKUP': return { bg: '#f3e8ff', text: '#7c3aed', dot: '#8b5cf6' };
            case 'COMPLETED': return { bg: '#dcfce7', text: '#15803d', dot: '#10b981' };
            case 'REJECTED': return { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' };
            default: return { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRedemptionCard = (item: any) => {
        const statusColors = getStatusColor(item.status);

        return (
            <View
                key={item._id}
                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2
                }}
            >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Customer</Text>
                        <Text className="text-gray-900 text-lg font-black">{item.user?.name || 'Customer'}</Text>
                        <Text className="text-gray-500 text-xs font-bold mt-0.5">{item.user?.phoneNumber}</Text>
                    </View>
                    <View>
                        {/* Redemption Type Badge */}
                        <View
                            className="px-3 py-1.5 rounded-full mb-2"
                            style={{ backgroundColor: item.redeemType === 'PHYSICAL_GOLD' ? '#fef3c7' : '#dbeafe' }}
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={item.redeemType === 'PHYSICAL_GOLD' ? 'cube' : 'cash'}
                                    size={12}
                                    color={item.redeemType === 'PHYSICAL_GOLD' ? '#f59e0b' : '#3b82f6'}
                                />
                                <Text
                                    className="text-[9px] font-black uppercase tracking-wider ml-1"
                                    style={{ color: item.redeemType === 'PHYSICAL_GOLD' ? '#f59e0b' : '#3b82f6' }}
                                >
                                    {item.redeemType === 'PHYSICAL_GOLD' ? 'Physical' : 'Cash'}
                                </Text>
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
                                {item.status.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Gold Details */}
                <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Gold Amount</Text>
                            <Text className="text-amber-900 text-3xl font-black">{item.goldGrams?.toFixed(3)}g</Text>
                        </View>
                        <View className="w-px h-12 bg-gray-200 mx-4" />
                        <View className="flex-1 items-end">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Value</Text>
                            <Text className="text-gray-900 text-xl font-black">₹{item.equivalentAmount?.toLocaleString()}</Text>
                            <Text className="text-gray-500 text-[9px] font-bold mt-0.5">@₹{item.goldRateAtRedemption}/g</Text>
                        </View>
                    </View>
                </View>

                {/* Address Details - Only for Physical Gold */}
                {item.redeemType === 'PHYSICAL_GOLD' && item.deliveryAddress && (
                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="location" size={14} color="#6b7280" />
                            <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest ml-1">Delivery Address</Text>
                        </View>
                        <Text className="text-gray-900 font-bold text-sm">{item.deliveryAddress.street}</Text>
                        <Text className="text-gray-600 text-xs">{item.deliveryAddress.city}, {item.deliveryAddress.state} - {item.deliveryAddress.zipCode}</Text>
                        {item.deliveryAddress.phoneNumber && (
                            <Text className="text-blue-600 font-bold text-xs mt-1">📞 {item.deliveryAddress.phoneNumber}</Text>
                        )}
                    </View>
                )}

                {/* Bank Details - Only for Cash Redemptions */}
                {item.redeemType === 'CASH' && item.bankDetails && (
                    <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="card" size={14} color="#3b82f6" />
                            <Text className="text-blue-600 text-[9px] font-black uppercase tracking-widest ml-1">Bank Details</Text>
                        </View>
                        <View className="space-y-2">
                            <View>
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Account Holder</Text>
                                <Text className="text-gray-900 font-bold text-sm">{item.bankDetails.accountHolderName}</Text>
                            </View>
                            <View className="flex-row gap-x-4 mt-2">
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Account Number</Text>
                                    <Text className="text-gray-900 font-bold text-sm">****{item.bankDetails.accountNumber?.slice(-4)}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">IFSC Code</Text>
                                    <Text className="text-gray-900 font-bold text-sm">{item.bankDetails.ifscCode}</Text>
                                </View>
                            </View>
                            <View className="mt-2">
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Bank Name</Text>
                                <Text className="text-gray-900 font-bold text-sm">{item.bankDetails.bankName}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Pickup Location (if ready for pickup) */}
                {item.status === 'READY_FOR_PICKUP' && item.pickupLocation && (
                    <View className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-100">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="storefront" size={14} color="#8b5cf6" />
                            <Text className="text-purple-600 text-[9px] font-black uppercase tracking-widest ml-1">Pickup Location</Text>
                        </View>
                        <Text className="text-gray-900 font-black text-sm mb-1">{item.pickupLocation.storeName}</Text>
                        <Text className="text-gray-600 text-xs mb-1">{item.pickupLocation.address}</Text>
                        <Text className="text-purple-600 font-bold text-xs">📞 {item.pickupLocation.contactNumber}</Text>
                        {item.pickupLocation.instructions && (
                            <Text className="text-gray-500 text-xs italic mt-2">{item.pickupLocation.instructions}</Text>
                        )}
                    </View>
                )}

                {/* Timestamps */}
                <View className="flex-row items-center mb-4">
                    <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                    <Text className="text-gray-400 text-[9px] font-bold ml-1">
                        Requested: {formatDate(item.createdAt)}
                    </Text>
                </View>

                {/* Action Buttons */}
                {item.status === 'REQUESTED' && (
                    <View className="flex-row gap-x-3">
                        <TouchableOpacity
                            onPress={() => handleApprove(item._id, 'APPROVED')}
                            className="flex-1 bg-blue-600 py-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-black uppercase tracking-widest text-xs">Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleApprove(item._id, 'REJECTED')}
                            className="bg-red-50 px-5 rounded-2xl items-center justify-center border border-red-100"
                        >
                            <Ionicons name="close-circle" size={24} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                )}

                {item.status === 'APPROVED' && (
                    <>
                        {item.redeemType === 'PHYSICAL_GOLD' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedRedemption(item);
                                    setShowPickupModal(true);
                                }}
                                className="bg-purple-600 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Mark Ready for Pickup</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => handleMarkAsPaid(item._id)}
                                className="bg-green-600 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Mark as Paid</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {item.status === 'READY_FOR_PICKUP' && (
                    <TouchableOpacity
                        onPress={() => handleMarkCollected(item._id)}
                        className="bg-green-600 py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-black uppercase tracking-widest text-xs">Mark as Collected</Text>
                    </TouchableOpacity>
                )}

                {item.status === 'COMPLETED' && (
                    <View className="bg-green-50 rounded-2xl p-3 border border-green-100">
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text className="text-green-700 text-xs font-bold ml-2">
                                {item.redeemType === 'PHYSICAL_GOLD' && item.collectionDate
                                    ? `Collected on ${formatDate(item.collectionDate)}`
                                    : item.completionDate
                                        ? `Payment completed on ${formatDate(item.completionDate)}`
                                        : 'Completed'}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderEmptyState = () => {
        const currentTab = tabs.find(t => t.key === activeTab);
        return (
            <View className="items-center justify-center py-20 px-6">
                <View
                    className="w-24 h-24 rounded-full items-center justify-center mb-6"
                    style={{ backgroundColor: currentTab?.color + '20' }}
                >
                    <Ionicons name={currentTab?.icon as any} size={48} color={currentTab?.color} />
                </View>
                <Text className="text-gray-900 text-xl font-black mb-2 text-center">No {currentTab?.label} Redemptions</Text>
                <Text className="text-gray-400 text-center font-medium leading-6">
                    {activeTab === 'ALL' ? 'No physical gold redemption requests yet' : `No redemptions in ${currentTab?.label.toLowerCase()} status`}
                </Text>
            </View>
        );
    };

    const filteredRedemptions = getFilteredRedemptions();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{
                headerShown: true,
                title: 'Gold Redemptions',
                headerTitleStyle: { fontWeight: '900' }
            }} />

            {/* Tab Headers */}
            <View className="bg-white border-b border-gray-100">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
                >
                    {tabs.map((tab, index) => {
                        const isActive = activeTab === tab.key;
                        const count = tab.status ? allRedemptions.filter(r => r.status === tab.status).length : allRedemptions.length;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => handleTabPress(tab.key, index)}
                                className={`mr-3 px-5 py-3 rounded-2xl flex-row items-center ${isActive ? 'bg-primary-600' : 'bg-gray-50'}`}
                                style={isActive ? {
                                    shadowColor: '#f97316',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 4
                                } : {}}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={18}
                                    color={isActive ? '#ffffff' : tab.color}
                                />
                                <Text className={`ml-2 font-black text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>
                                    {tab.label}
                                </Text>
                                {count > 0 && (
                                    <View className={`ml-2 px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-200'}`}>
                                        <Text className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                ref={scrollViewRef}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {loading && !refreshing ? (
                    <View className="py-20 items-center">
                        <Text className="text-gray-400 font-bold">Loading redemptions...</Text>
                    </View>
                ) : filteredRedemptions.length === 0 ? (
                    renderEmptyState()
                ) : (
                    filteredRedemptions.map(renderRedemptionCard)
                )}
            </ScrollView>

            {/* Pickup Location Modal */}
            <Modal
                visible={showPickupModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPickupModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] px-6 pt-6 pb-10">
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1">Pickup Details</Text>
                                <Text className="text-2xl font-black text-gray-900">Set Pickup Location</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowPickupModal(false)}
                                className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center"
                            >
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Store Name */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-bold mb-2 text-sm">Store Name *</Text>
                                <TextInput
                                    value={pickupLocation.storeName}
                                    onChangeText={(text) => setPickupLocation({ ...pickupLocation, storeName: text })}
                                    placeholder="e.g., JC Gold - Main Branch"
                                    className="bg-gray-50 rounded-2xl px-4 py-4 text-gray-900 font-bold border border-gray-200"
                                />
                            </View>

                            {/* Address */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-bold mb-2 text-sm">Store Address *</Text>
                                <TextInput
                                    value={pickupLocation.address}
                                    onChangeText={(text) => setPickupLocation({ ...pickupLocation, address: text })}
                                    placeholder="Full store address"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-gray-50 rounded-2xl px-4 py-4 text-gray-900 font-bold border border-gray-200"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </View>

                            {/* Contact Number */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-bold mb-2 text-sm">Contact Number *</Text>
                                <TextInput
                                    value={pickupLocation.contactNumber}
                                    onChangeText={(text) => setPickupLocation({ ...pickupLocation, contactNumber: text })}
                                    placeholder="Store contact number"
                                    keyboardType="phone-pad"
                                    className="bg-gray-50 rounded-2xl px-4 py-4 text-gray-900 font-bold border border-gray-200"
                                />
                            </View>

                            {/* Instructions */}
                            <View className="mb-6">
                                <Text className="text-gray-700 font-bold mb-2 text-sm">Special Instructions (Optional)</Text>
                                <TextInput
                                    value={pickupLocation.instructions}
                                    onChangeText={(text) => setPickupLocation({ ...pickupLocation, instructions: text })}
                                    placeholder="Any special instructions for the customer"
                                    multiline
                                    numberOfLines={2}
                                    className="bg-gray-50 rounded-2xl px-4 py-4 text-gray-900 font-bold border border-gray-200"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleMarkReadyForPickup}
                                className="bg-purple-600 py-4 rounded-2xl items-center shadow-lg shadow-purple-200"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Confirm & Notify Customer</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
