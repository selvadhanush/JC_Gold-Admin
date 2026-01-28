import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Alert,
    StatusBar,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL, API_ENDPOINTS } from '../../api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface GoldTransaction {
    _id: string;
    user: { name: string; email: string; phoneNumber: string };
    amountPaid: number;
    goldGrams: number;
    goldRateAtTime: number;
    paymentMethod: string;
    transactionId: string;
    createdAt: string;
}

interface Installment {
    _id: string;
    user: { name: string; email: string };
    userScheme: { scheme: { name: string } };
    amount: number;
    dueDate: string;
    status: string;
}

export default function GoldSchemesHub() {
    const scrollRef = useRef<ScrollView>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Gold State
    const [goldPurchases, setGoldPurchases] = useState<GoldTransaction[]>([]);

    // Schemes State
    const [installments, setInstallments] = useState<Installment[]>([]);

    // Redemption State
    const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
    const [approvedRedemptions, setApprovedRedemptions] = useState<any[]>([]);

    // Rejection Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [rejectionType, setRejectionType] = useState<'PURCHASE' | 'REDEMPTION' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch Gold Purchases
            const goldRes = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/transactions?status=PENDING&type=BUY`, { headers });
            const goldData = await goldRes.json();
            if (goldData.success) setGoldPurchases(goldData.data);

            // Fetch Scheme Installments
            const schemeRes = await fetch(`${BASE_URL}/api/v1/schemes/installments?status=PENDING`, { headers });
            const schemeData = await schemeRes.json();
            if (schemeData.success) setInstallments(schemeData.data);

            // Fetch Pending Redemptions (Step 1)
            const redeemRes1 = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemptions?status=REQUESTED`, { headers });
            const redeemData1 = await redeemRes1.json();
            if (redeemData1.success) setPendingRedemptions(redeemData1.data);

            // Fetch Approved Redemptions (Step 2: Pending Payment)
            const redeemRes2 = await fetch(`${BASE_URL}/api/v1/admin/digital-gold/redemptions?status=APPROVED&redeemType=CASH`, { headers });
            const redeemData2 = await redeemRes2.json();
            if (redeemData2.success) setApprovedRedemptions(redeemData2.data);

        } catch (error) {
            console.error('Fetch error:', error);
            Toast.show({ type: 'error', text1: 'Connection Error', text2: 'Failed to fetch latest records.' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApproveGold = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
        try {
            const headers = await getAuthHeaders();
            const body: any = { status };
            if (status === 'REJECTED' && reason) {
                body.rejectionReason = reason;
            }

            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_APPROVE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                Toast.show({ type: 'success', text1: `Gold Purchase ${status}` });
                fetchData();
                if (status === 'REJECTED') {
                    setRejectModalVisible(false);
                    setRejectionReason('');
                    setSelectedItemId(null);
                    setRejectionType(null);
                }
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action Failed' });
        }
    };

    const handleApproveRedemption = async (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', reason?: string) => {
        try {
            const headers = await getAuthHeaders();
            const body: any = { status };
            if (status === 'REJECTED' && reason) {
                body.rejectionReason = reason;
            }

            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_REDEMPTION_APPROVE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                const msg = status === 'COMPLETED' ? 'Payment Processed' : `Redemption ${status}`;
                Toast.show({ type: 'success', text1: msg });
                fetchData();
                setRejectModalVisible(false);
                setRejectionReason('');
                setSelectedItemId(null);
                setRejectionType(null);
            } else {
                Toast.show({ type: 'error', text1: data.message || 'Action Failed' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action Failed' });
        }
    };

    const initiateRejection = (id: string, type: 'PURCHASE' | 'REDEMPTION') => {
        setSelectedItemId(id);
        setRejectionType(type);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const confirmRejection = () => {
        if (!selectedItemId) return;
        if (!rejectionReason.trim()) {
            Toast.show({ type: 'error', text1: 'Please provide a rejection reason' });
            return;
        }

        if (rejectionType === 'PURCHASE') {
            handleApproveGold(selectedItemId, 'REJECTED', rejectionReason);
        } else {
            handleApproveRedemption(selectedItemId, 'REJECTED', rejectionReason);
        }
    };

    const handleRecordInstallment = async (id: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.FINANCE_INSTALLMENT_PAY(id), {
                method: 'PATCH',
                headers
            });
            const data = await response.json();
            if (data.success) {
                Toast.show({ type: 'success', text1: 'Payment Recorded' });
                fetchData();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action Failed' });
        }
    };

    const scrollToTab = (index: number) => {
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
        setActiveTab(index);
    };

    const onScroll = (event: any) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / width);
        if (index !== activeTab) setActiveTab(index);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header Area */}
            <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View>
                        <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>Finance Control</Text>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: 'black', letterSpacing: -0.5 }}>GOLD & SCHEMES</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setRefreshing(true);
                            fetchData();
                        }}
                        style={{ width: 44, height: 44, backgroundColor: '#f9fafb', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}
                    >
                        <Ionicons name="refresh" size={20} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Professional Tab Switcher */}
                <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 20, padding: 6, position: 'relative' }}>
                    {/* Sliding Background Indicator */}
                    <View style={{
                        position: 'absolute',
                        width: (width - 60) / 3,
                        height: 48,
                        backgroundColor: 'white',
                        borderRadius: 16,
                        top: 6,
                        left: activeTab === 0 ? 6 : (activeTab === 1 ? (width - 60) / 3 + 6 : ((width - 60) / 3) * 2 + 6),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                    }} />

                    <TouchableOpacity
                        onPress={() => scrollToTab(0)}
                        style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="trending-up" size={16} color={activeTab === 0 ? '#059669' : '#9ca3af'} style={{ marginRight: 8 }} />
                            <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', color: activeTab === 0 ? '#111827' : '#9ca3af' }}>Digital Gold</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => scrollToTab(1)}
                        style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="diamond-outline" size={16} color={activeTab === 1 ? '#059669' : '#9ca3af'} style={{ marginRight: 8 }} />
                            <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', color: activeTab === 1 ? '#111827' : '#9ca3af' }}>Schemes</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => scrollToTab(2)}
                        style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="card-outline" size={16} color={activeTab === 2 ? '#059669' : '#9ca3af'} style={{ marginRight: 8 }} />
                            <Text style={{ fontWeight: '900', fontSize: 11, textTransform: 'uppercase', color: activeTab === 2 ? '#111827' : '#9ca3af' }}>Redeem</Text>
                        </View>
                    </TouchableOpacity>
                </View>


                {/* Swipe Hint */}
                <View style={{ position: 'absolute', right: 24, bottom: -10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.3 }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#9ca3af', marginRight: 4 }}>SWIPE</Text>
                        <Ionicons name="arrow-forward" size={10} color="#9ca3af" />
                    </View>
                </View>
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            >
                {/* Slide 1: Digital Gold */}
                <View style={{ width }}>
                    <ScrollView
                        className="flex-1 px-6"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#10b981" />}
                        contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-gray-900 font-black text-xl">Gold Requests</Text>
                            <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                <Text className="text-emerald-700 font-black text-[10px] uppercase">{goldPurchases.length} PENDING</Text>
                            </View>
                        </View>

                        {loading ? (
                            <View className="py-20"><ActivityIndicator size="large" color="#10b981" /></View>
                        ) : goldPurchases.length === 0 ? (
                            <View className="items-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                                <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm mb-4">
                                    <Ionicons name="checkmark-done" size={32} color="#10b981" />
                                </View>
                                <Text className="text-gray-900 font-black text-lg">All Cleared</Text>
                                <Text className="text-gray-400 font-medium mt-1">No pending gold purchases</Text>
                            </View>
                        ) : (
                            goldPurchases.map((item) => (
                                <View key={item._id} className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm overflow-hidden relative">
                                    {/* Accent background element */}
                                    <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, backgroundColor: '#10b98108', borderRadius: 40 }} />

                                    <View className="flex-row justify-between items-start mb-6">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Buy Amount</Text>
                                            <Text className="text-gray-950 font-black text-3xl">₹{item.amountPaid.toLocaleString()}</Text>
                                        </View>
                                        <View className="items-end bg-emerald-50 px-4 py-2 rounded-2xl">
                                            <Text className="text-emerald-600 font-black text-xl">{item.goldGrams}g</Text>
                                            <Text className="text-emerald-600/60 text-[8px] font-black uppercase tracking-tighter">Gold Weight</Text>
                                        </View>
                                    </View>

                                    <View className="bg-gray-50/80 rounded-2xl p-5 mb-6 border border-gray-100">
                                        <View className="flex-row items-center mb-4">
                                            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 shadow-sm">
                                                <Ionicons name="person" size={14} color="#059669" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">Customer</Text>
                                                <Text className="text-gray-900 font-black text-xs" numberOfLines={1}>{item.user?.name || 'Guest User'}</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">ID</Text>
                                                <Text className="text-gray-900 font-black text-[10px]">#{item.transactionId?.slice(-6).toUpperCase() || 'N/A'}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between pt-4 border-t border-gray-100">
                                            <View>
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">Payment Method</Text>
                                                <View className="flex-row items-center mt-1">
                                                    <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                                    <Text className="text-gray-900 font-bold text-[10px]">{item.paymentMethod}</Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">Date</Text>
                                                <Text className="text-gray-900 font-bold text-[10px] mt-1">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="flex-row gap-x-3">
                                        <TouchableOpacity
                                            onPress={() => handleApproveGold(item._id, 'APPROVED')}
                                            className="flex-1 bg-gray-950 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-gray-400/20"
                                        >
                                            <Ionicons name="checkmark-circle" size={18} color="white" />
                                            <Text className="text-white font-black text-[10px] uppercase ml-2 tracking-widest">Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => initiateRejection(item._id, 'PURCHASE')}
                                            className="w-14 bg-red-600 rounded-2xl items-center justify-center shadow-sm"
                                        >
                                            <Ionicons name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* Slide 2: Schemes */}
                <View style={{ width }}>
                    <ScrollView
                        className="flex-1 px-6"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#10b981" />}
                        contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                    >
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-gray-900 font-black text-xl">Scheme Payments</Text>
                            <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                <Text className="text-blue-700 font-black text-[10px] uppercase">{installments.length} PENDING</Text>
                            </View>
                        </View>

                        {loading ? (
                            <View className="py-20"><ActivityIndicator size="large" color="#10b981" /></View>
                        ) : installments.length === 0 ? (
                            <View className="items-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                                <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm mb-4">
                                    <Ionicons name="calendar-outline" size={32} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-900 font-black text-lg">No Pending Dues</Text>
                                <Text className="text-gray-400 font-medium mt-1">All installment records are up to date</Text>
                            </View>
                        ) : (
                            installments.map((item) => (
                                <View key={item._id} className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm relative overflow-hidden">
                                    {/* Accent background element */}
                                    <View style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, backgroundColor: '#3b82f608', borderRadius: 40 }} />

                                    <View className="flex-row justify-between items-start mb-6">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Installment</Text>
                                            <Text className="text-blue-600 font-black text-3xl">₹{item.amount.toLocaleString()}</Text>
                                        </View>
                                        <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 items-end">
                                            <Text className="text-blue-600 font-black text-[10px] uppercase">{item.status}</Text>
                                        </View>
                                    </View>

                                    <View className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                                        <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-200/50">
                                            <View className="flex-1">
                                                <Text className="text-gray-400 text-[8px] font-black uppercase mb-1">Scheme Name</Text>
                                                <Text className="text-gray-900 font-black text-xs" numberOfLines={1}>
                                                    {item.userScheme?.scheme?.name || 'Gold Savings Scheme'}
                                                </Text>
                                            </View>
                                            <View className="items-end bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">Due Date</Text>
                                                <Text className="text-gray-950 font-black text-[10px]">{new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                                                <Ionicons name="person" size={14} color="#3b82f6" />
                                            </View>
                                            <View>
                                                <Text className="text-gray-400 text-[8px] font-black uppercase">Customer</Text>
                                                <Text className="text-gray-900 font-black text-xs">{item.user?.name || 'Customer'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => handleRecordInstallment(item._id)}
                                        className="bg-gray-950 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-400/10"
                                    >
                                        <Ionicons name="cash-outline" size={18} color="white" />
                                        <Text className="text-white font-black text-[10px] uppercase ml-2 tracking-widest">Record Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
                {/* Slide 3: Redemptions (Approval & Payment) */}
                <View style={{ width }}>
                    <ScrollView
                        className="flex-1 px-6"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#10b981" />}
                        contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                    >
                        {/* SECTION 1: APPROVAL */}
                        <View className="mb-8">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-gray-900 font-black text-xl">Approval Required</Text>
                                <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                    <Text className="text-orange-700 font-black text-[10px] uppercase">{pendingRedemptions.length} PENDING</Text>
                                </View>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="small" color="#f97316" />
                            ) : pendingRedemptions.length === 0 ? (
                                <View className="p-6 bg-gray-50 border border-gray-100 border-dashed rounded-2xl mb-4">
                                    <Text className="text-gray-400 text-center text-xs">No redemptions waiting for approval</Text>
                                </View>
                            ) : (
                                pendingRedemptions.map((item) => (
                                    <View key={item._id} className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-900 font-black uppercase tracking-widest">{item.redeemType}</Text>
                                            <Text className="text-orange-600 font-black">{item.goldGrams}g</Text>
                                        </View>
                                        <Text className="text-gray-500 text-[10px] mb-1">Value: ₹{item.equivalentAmount.toLocaleString()}</Text>
                                        <Text className="text-gray-400 text-[10px] mb-4">User: {item.user?.name || item.user}</Text>

                                        {item.redeemType === 'CASH' && item.bankDetails && (
                                            <View className="bg-gray-50 p-3 rounded-xl mb-4">
                                                <Text className="text-gray-500 text-[9px] font-bold uppercase">Bank: {item.bankDetails.bankName}</Text>
                                                <Text className="text-gray-400 text-[9px]">IFSC: {item.bankDetails.ifscCode}</Text>
                                            </View>
                                        )}

                                        <View className="flex-row gap-x-3">
                                            <TouchableOpacity
                                                onPress={() => handleApproveRedemption(item._id, 'APPROVED')}
                                                className="flex-1 bg-gray-900 py-3 rounded-xl items-center"
                                            >
                                                <Text className="text-white font-black text-[10px] uppercase">Approve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => initiateRejection(item._id, 'REDEMPTION')}
                                                className="w-12 bg-red-600 rounded-xl items-center justify-center"
                                            >
                                                <Ionicons name="close" size={18} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* SECTION 2: PAYMENT */}
                        <View>
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-gray-900 font-black text-xl">Pending Payments</Text>
                                <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <Text className="text-emerald-700 font-black text-[10px] uppercase">{approvedRedemptions.length} APPROVED</Text>
                                </View>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="small" color="#10b981" />
                            ) : approvedRedemptions.length === 0 ? (
                                <View className="p-6 bg-gray-50 border border-gray-100 border-dashed rounded-2xl">
                                    <Text className="text-gray-400 text-center text-xs">No approved redemptions pending payment</Text>
                                </View>
                            ) : (
                                approvedRedemptions.map((item) => (
                                    <View key={item._id} className="bg-white border border-emerald-100 rounded-[32px] p-6 mb-4 shadow-sm relative overflow-hidden">
                                        <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: '#10b981' }} />

                                        <Text className="text-emerald-600 text-[10px] font-black uppercase mb-2">Ready for Payout</Text>
                                        <Text className="text-gray-900 font-black text-2xl mb-1">₹{item.equivalentAmount.toLocaleString()}</Text>
                                        <Text className="text-gray-400 text-xs mb-4">For {item.goldGrams}g Gold</Text>

                                        {item.bankDetails && (
                                            <View className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-200">
                                                <Text className="text-gray-400 text-[9px] font-black uppercase mb-2">Transfer To</Text>
                                                <Text className="text-gray-900 font-bold mb-1">{item.bankDetails.accountHolderName}</Text>
                                                <Text className="text-gray-700 text-xs">{item.bankDetails.bankName}</Text>
                                                <Text className="text-gray-500 text-xs mt-1">{item.bankDetails.accountNumber}</Text>
                                                <Text className="text-gray-500 text-[10px] mt-1 font-mono">{item.bankDetails.ifscCode}</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => handleApproveRedemption(item._id, 'COMPLETED')}
                                            className="bg-emerald-600 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-emerald-600/20"
                                        >
                                            <Ionicons name="checkmark-done-circle" size={20} color="white" />
                                            <Text className="text-white font-black text-[10px] uppercase ml-2 tracking-widest">Mark Paid & Complete</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                </View >
            </ScrollView >

            <Toast />

            {/* Rejection Reason Modal */}
            <Modal
                transparent
                visible={rejectModalVisible}
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }}>
                    <View className="bg-white w-full p-6 rounded-3xl shadow-lg">
                        <Text className="text-xl font-black text-gray-900 mb-2">
                            Reject {rejectionType === 'PURCHASE' ? 'Gold Purchase' : 'Redemption Request'}
                        </Text>
                        <Text className="text-gray-500 text-xs mb-4">Please provide a reason for rejection:</Text>

                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 mb-6 h-32 text-top"
                            multiline
                            placeholder="Type reason here..."
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            textAlignVertical="top"
                        />

                        <View className="flex-row gap-x-3">
                            <TouchableOpacity
                                onPress={() => setRejectModalVisible(false)}
                                className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmRejection}
                                className="flex-1 bg-red-600 py-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">Confirm Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );

}
