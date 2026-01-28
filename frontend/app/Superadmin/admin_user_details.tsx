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

    useEffect(() => {
        if (id) fetchUserDetails();
    }, [id]);

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
            Alert.alert('Error', 'Failed to fetch customer dossier');
        } finally {
            setLoading(false);
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
                                onPress={fetchUserDetails}
                                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                            >
                                <Ionicons name="refresh" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 opacity-50">
                                <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
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
        </View>
    );
}
