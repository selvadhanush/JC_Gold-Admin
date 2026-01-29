import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    StatusBar,
    Modal,
    TextInput,
    Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import { Skeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');

const formatAmount = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num}`;
};

export default function UserDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'schemes'>('orders');

    // Vault Management State
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
    const [goldGrams, setGoldGrams] = useState('');
    const [goldRate, setGoldRate] = useState('');
    const [currentMarketRate, setCurrentMarketRate] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInsufficient, setIsInsufficient] = useState(false);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const toastAnim = useState(new Animated.Value(-100))[0];

    const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMsg(msg);
        setToastType(type);
        setShowToast(true);
        Animated.spring(toastAnim, {
            toValue: 20,
            useNativeDriver: true,
            tension: 50,
            friction: 7
        }).start();

        setTimeout(() => {
            Animated.timing(toastAnim, {
                toValue: -100,
                duration: 500,
                useNativeDriver: true
            }).start(() => setShowToast(false));
        }, 3000);
    };

    useEffect(() => {
        if (id) {
            fetchUserDetails();
            fetchCurrentGoldRate();
        }
    }, [id]);

    const fetchCurrentGoldRate = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_DASHBOARD_RATES);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                // Find 24K Gold rate from the array
                const gold24k = data.data.find((item: any) => item.metalType === 'GOLD' && item.purity === '24K');
                if (gold24k && gold24k.rate) {
                    const rate = gold24k.rate;
                    setCurrentMarketRate(rate);
                    if (!goldRate) setGoldRate(rate.toString());
                } else {
                    console.warn('24K Gold rate not found in dashboard data');
                }
            }
        } catch (error) {
            console.error('Failed to fetch gold rate:', error);
        }
    };

    const fetchUserDetails = async () => {
        try {
            const headers = await getAuthHeaders();
            const [userRes, orderRes, schemeRes] = await Promise.all([
                fetch(`${API_ENDPOINTS.USERS}/${id}`, { headers }),
                fetch(`${API_ENDPOINTS.USERS}/${id}/orders`, { headers }),
                fetch(`${API_ENDPOINTS.USERS}/${id}/schemes`, { headers }),
            ]);

            const userData = await userRes.json();
            const orderData = await orderRes.json();
            const schemeData = await schemeRes.json();

            if (userData.success) setUser(userData.data);
            if (orderData.success) setOrders(orderData.data || []);
            if (schemeData.success) setSchemes(schemeData.data || []);
        } catch (error) {
            console.error('Fetch Details Error:', error);
            triggerToast('Failed to fetch customer dossier', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const parsedGrams = parseFloat(goldGrams);
        const currentBalance = user?.wallet?.goldBalance || 0;
        if (adjustType === 'DEDUCT' && parsedGrams > currentBalance) {
            setIsInsufficient(true);
        } else {
            setIsInsufficient(false);
        }
    }, [goldGrams, adjustType, user]);

    const handleVaultAction = async () => {
        const parsedGrams = parseFloat(goldGrams);
        const parsedRate = parseFloat(goldRate) || currentMarketRate || 0;

        if (!parsedGrams || parsedGrams <= 0) {
            triggerToast('Please enter a valid amount of gold grams', 'error');
            return;
        }

        if (!parsedRate || parsedRate <= 0) {
            triggerToast('Please enter a valid gold rate', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_ADJUST_VAULT, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: id,
                    type: adjustType,
                    goldGrams: parsedGrams,
                    goldRateAtTime: parsedRate,
                    notes
                }),
            });

            const data = await response.json();
            if (data.success) {
                triggerToast(data.message || 'Vault adjusted successfully');
                setShowVaultModal(false);
                setGoldGrams('');
                setGoldRate('');
                setNotes('');
                fetchUserDetails(); // Refresh data
            } else {
                triggerToast(data.message || 'Failed to adjust vault', 'error');
            }
        } catch (error) {
            triggerToast('Network error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                {/* Header Skeleton */}
                <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                    <View className="flex-row items-center justify-between mb-6">
                        <Skeleton width={40} height={40} borderRadius={10} />
                        <Skeleton width={80} height={20} borderRadius={8} />
                    </View>
                    <Skeleton width={120} height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={200} height={32} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                    {/* Profile Card Skeleton */}
                    <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6' }}>
                        <View className="flex-row items-center">
                            <Skeleton width={64} height={64} borderRadius={16} style={{ marginRight: 20 }} />
                            <View className="flex-1">
                                <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                                <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
                                <Skeleton width={100} height={20} borderRadius={8} />
                            </View>
                        </View>
                    </View>

                    {/* Stats Grid Skeleton */}
                    <View className="flex-row justify-between mb-8">
                        <Skeleton width="31%" height={120} borderRadius={24} />
                        <Skeleton width="31%" height={120} borderRadius={24} />
                        <Skeleton width="31%" height={120} borderRadius={24} />
                    </View>

                    {/* Tabs Skeleton */}
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 6, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6' }}>
                        <View className="flex-row">
                            <Skeleton width="48%" height={48} borderRadius={16} />
                            <View style={{ width: '4%' }} />
                            <Skeleton width="48%" height={48} borderRadius={16} />
                        </View>
                    </View>

                    {/* List Item Skeletons */}
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' }}>
                            <Skeleton width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
                            <View className="flex-1">
                                <Skeleton width="50%" height={16} style={{ marginBottom: 8 }} />
                                <Skeleton width="30%" height={12} />
                            </View>
                            <Skeleton width={60} height={24} borderRadius={8} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (!user) return null;

    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />


            {/* Premium Header */}
            <View
                style={{
                    backgroundColor: 'white',
                    paddingHorizontal: 24,
                    paddingTop: 56,
                    paddingBottom: 24,
                    borderBottomLeftRadius: 32,
                    borderBottomRightRadius: 32,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                    zIndex: 20
                }}
            >
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={20} color="#1f2937" />
                    </TouchableOpacity>
                    <View className="px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                        <Text className="text-green-700 font-black text-[9px] uppercase tracking-widest">Active User</Text>
                    </View>
                </View>
                <View className="mt-4">
                    <Text style={{ color: 'rgba(234, 88, 12, 0.8)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>User Management</Text>
                    <Text className="text-3xl font-black text-gray-900 tracking-tight">User Profile</Text>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Profile Card */}
                <View className="mx-5 mt-6 mb-6">
                    <View
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 28,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: '#f3f4f6',
                            position: 'relative',
                            overflow: 'hidden',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100 mr-5">
                                <Ionicons name="person" size={28} color="#9ca3af" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-2xl font-black text-gray-900 mb-0.5" numberOfLines={1}>{user.name}</Text>
                                <Text className="text-gray-400 text-xs font-bold mb-3">{user.email}</Text>
                                <View className="bg-gray-100 px-3 py-1.5 rounded-lg self-start">
                                    <Text className="text-gray-500 font-black text-[9px] uppercase tracking-widest">
                                        Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Column */}
                        <View className="items-center space-y-2 ml-4">
                            <TouchableOpacity
                                onPress={() => {
                                    setAdjustType('ADD');
                                    setShowVaultModal(true);
                                }}
                                className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center border border-orange-400 shadow-sm mb-2"
                            >
                                <Ionicons name="add" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={fetchUserDetails}
                                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                            >
                                <Ionicons name="refresh" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Vault Info Card */}
                <View className="mx-5 mb-6">
                    <TouchableOpacity
                        onPress={() => setShowVaultModal(true)}
                        activeOpacity={0.9}
                        style={{
                            backgroundColor: '#111827',
                            borderRadius: 24,
                            padding: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 5
                        }}
                    >
                        <View className="w-12 h-12 bg-orange-500 rounded-2xl items-center justify-center mr-4">
                            <Ionicons name="cube" size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-400 font-black text-[9px] uppercase tracking-widest mb-1">User Gold Vault</Text>
                            <Text className="text-white text-xl font-black">{user.wallet?.goldBalance?.toFixed(3) || '0.000'} <Text className="text-orange-500 text-sm">Grams</Text></Text>
                        </View>
                        <View className="bg-white/10 px-3 py-2 rounded-xl">
                            <Text className="text-white font-black text-[9px] uppercase">Manage</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Statistics Grid */}
                <View className="px-5 mb-8 flex-row justify-between">
                    <View style={{ width: '31%', height: 120, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="cart" size={20} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-900 font-black text-xl leading-tight">{orders.length}</Text>
                        <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Orders</Text>
                    </View>
                    <View style={{ width: '31%', height: 120, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                        <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="diamond" size={20} color="#a855f7" />
                        </View>
                        <Text className="text-gray-900 font-black text-xl leading-tight">{schemes.length}</Text>
                        <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Schemes</Text>
                    </View>
                    <View style={{ width: '31%', height: 120, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                        <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="wallet" size={20} color="#22c55e" />
                        </View>
                        <Text className="text-gray-900 font-black text-sm leading-tight">{formatAmount(totalSpent)}</Text>
                        <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Spent</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="px-5 mb-6">
                    <View className="flex-row bg-white p-1.5 rounded-2xl border border-gray-100">
                        <TouchableOpacity
                            onPress={() => setActiveTab('orders')}
                            style={[{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, activeTab === 'orders' ? { backgroundColor: '#111827', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } : { backgroundColor: 'transparent' }]}
                        >
                            <Ionicons name="receipt" size={16} color={activeTab === 'orders' ? 'white' : '#9ca3af'} style={{ marginRight: 8 }} />
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'orders' ? 'text-white' : 'text-gray-400'}`}>Order History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('schemes')}
                            style={[{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, activeTab === 'schemes' ? { backgroundColor: '#111827', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } : { backgroundColor: 'transparent' }]}
                        >
                            <Ionicons name="star" size={16} color={activeTab === 'schemes' ? 'white' : '#9ca3af'} style={{ marginRight: 8 }} />
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === 'schemes' ? 'text-white' : 'text-gray-400'}`}>Active Schemes</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List Content */}
                <View className="px-5 min-h-[300px]">
                    {activeTab === 'orders' ? (
                        <>
                            {orders.length > 0 ? orders.map((order, i) => (
                                <View key={order._id} style={{
                                    backgroundColor: 'white',
                                    padding: 20,
                                    borderRadius: 24,
                                    marginBottom: 16,
                                    borderWidth: 1,
                                    borderColor: '#f9fafb',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }}>
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-4 border border-gray-100">
                                            <Ionicons name="receipt-outline" size={20} color="#4b5563" />
                                        </View>
                                        <View>
                                            <Text className="text-gray-900 font-black text-sm uppercase mb-1">Order #{order.orderNumber.slice(-6)}</Text>
                                            <Text className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-gray-900 font-black text-sm mb-1">₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                                        <View className="px-2 py-0.5 bg-green-50 rounded-md border border-green-100">
                                            <Text className="text-[8px] font-black text-green-700 uppercase">Success</Text>
                                        </View>
                                    </View>
                                </View>
                            )) : (
                                <View className="items-center justify-center py-16">
                                    <Ionicons name="cart-outline" size={40} color="#d1d5db" />
                                    <Text className="text-gray-400 font-bold text-xs mt-3 uppercase tracking-wider">No Orders Found</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View>
                            {schemes.length > 0 ? schemes.map((scheme, i) => (
                                <View key={scheme._id} style={{
                                    backgroundColor: 'white',
                                    padding: 20,
                                    borderRadius: 24,
                                    marginBottom: 16,
                                    borderWidth: 1,
                                    borderColor: '#f3f4f6', // gray-100
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 2,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{
                                            width: 48,
                                            height: 48,
                                            backgroundColor: '#fff7ed', // orange-50
                                            borderRadius: 16,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 16,
                                            borderWidth: 1,
                                            borderColor: '#ffedd5' // orange-100
                                        }}>
                                            <Ionicons name="star-outline" size={20} color="#f97316" />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', marginBottom: 4 }}>Gold Saving</Text>
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>
                                                Started {new Date(scheme.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{
                                            paddingHorizontal: 8,
                                            paddingVertical: 2,
                                            backgroundColor: '#eff6ff', // blue-50
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: '#dbeafe' // blue-100
                                        }}>
                                            <Text style={{ fontSize: 8, fontWeight: '900', color: '#1d4ed8', textTransform: 'uppercase' }}>Active</Text>
                                        </View>
                                    </View>
                                </View>
                            )) : (
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
                                    <Ionicons name="star-outline" size={40} color="#d1d5db" />
                                    <Text style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: 12, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 }}>No Active Schemes</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Vault Management Modal */}
            <Modal
                visible={showVaultModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowVaultModal(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-orange-500 font-black text-[10px] uppercase tracking-widest mb-1">Vault Control</Text>
                                <Text className="text-2xl font-black text-gray-900">Manage Gold</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowVaultModal(false)}>
                                <Ionicons name="close-circle" size={32} color="#f3f4f6" />
                            </TouchableOpacity>
                        </View>

                        {/* Toggle Type */}
                        <View className="flex-row bg-gray-100 p-1.5 rounded-2xl mb-8">
                            <TouchableOpacity
                                onPress={() => setAdjustType('ADD')}
                                style={[{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }, adjustType === 'ADD' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 } : {}]}
                            >
                                <Text className={`font-black text-[10px] uppercase tracking-widest ${adjustType === 'ADD' ? 'text-orange-600' : 'text-gray-400'}`}>Add Gold</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setAdjustType('DEDUCT')}
                                style={[{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }, adjustType === 'DEDUCT' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 } : {}]}
                            >
                                <Text className={`font-black text-[10px] uppercase tracking-widest ${adjustType === 'DEDUCT' ? 'text-orange-600' : 'text-gray-400'}`}>Deduct Gold</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className={`text-[10px] font-black uppercase tracking-widest ml-1 mb-2 ${isInsufficient ? 'text-red-500' : 'text-gray-400'}`}>
                                    Gold Grams {isInsufficient && `(Max: ${user?.wallet?.goldBalance || 0}g)`}
                                </Text>
                                <View className={`bg-gray-50 border rounded-2xl px-5 py-4 flex-row items-center ${isInsufficient ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                                    <TextInput
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        className={`flex-1 font-black text-lg ${isInsufficient ? 'text-red-600' : 'text-gray-900'}`}
                                        value={goldGrams}
                                        onChangeText={setGoldGrams}
                                    />
                                    <Text className={isInsufficient ? 'text-red-400' : 'text-gray-400'}>GR</Text>
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">
                                    {adjustType === 'ADD' ? 'Purchase Rate' : 'Market Rate'} (Per Gram)
                                </Text>
                                <View className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex-row items-center">
                                    <Text className="text-gray-400 font-black text-lg mr-2">₹</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        className="flex-1 font-black text-lg text-gray-900"
                                        value={goldRate}
                                        onChangeText={setGoldRate}
                                    />
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Notes / Reason</Text>
                                <View className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
                                    <TextInput
                                        placeholder="Reason for adjustment..."
                                        className="font-bold text-gray-900"
                                        multiline
                                        numberOfLines={3}
                                        value={notes}
                                        onChangeText={setNotes}
                                    />
                                </View>
                            </View>

                            {!isInsufficient && (
                                <TouchableOpacity
                                    onPress={handleVaultAction}
                                    disabled={isSubmitting}
                                    style={{
                                        backgroundColor: adjustType === 'ADD' ? '#f97316' : '#111827',
                                        borderRadius: 24,
                                        paddingVertical: 18,
                                        alignItems: 'center',
                                        marginTop: 32,
                                        shadowColor: adjustType === 'ADD' ? '#f97316' : '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 8,
                                        elevation: 4
                                    }}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-black text-base uppercase tracking-widest">
                                            Confirm {adjustType === 'ADD' ? 'Addition' : 'Deduction'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Animated Toast */}
            {showToast && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 40,
                        left: 20,
                        right: 20,
                        backgroundColor: toastType === 'success' ? '#10b981' : '#ef4444',
                        borderRadius: 20,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        transform: [{ translateY: toastAnim }],
                        zIndex: 1000,
                        shadowColor: toastType === 'success' ? '#10b981' : '#ef4444',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10
                    }}
                >
                    <View className="bg-white/20 p-2 rounded-xl mr-4">
                        <Ionicons name={toastType === 'success' ? "checkmark-circle" : "alert-circle"} size={24} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-black text-sm uppercase tracking-wider">{toastType === 'success' ? 'Success' : 'Attention'}</Text>
                        <Text className="text-white/90 text-xs font-bold">{toastMsg}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}
