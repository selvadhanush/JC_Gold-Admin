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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';

const { width } = Dimensions.get('window');

export default function UserDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[4px] mt-6">Accessing Dossier...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!user) return null;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 border border-gray-100"
                    >
                        <Ionicons name="chevron-back" size={20} color="black" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Customer Dossier</Text>
                        <Text className="text-2xl font-black text-black">BUYER NODE PROFILE</Text>
                    </View>
                </View>

                {/* Profile Card */}
                <View className="p-6">
                    <View className="bg-indigo-950 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20" />
                        <View className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

                        <View className="flex-row items-center mb-8">
                            <View className="w-20 h-20 bg-white/10 rounded-[28px] items-center justify-center border border-white/20">
                                <Text className="text-4xl">👤</Text>
                            </View>
                            <View className="ml-6 flex-1">
                                <Text className="text-2xl font-black text-white leading-tight">{user.name}</Text>
                                <View className="flex-row items-center mt-2">
                                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                                    <Text className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Status: Authenticated</Text>
                                </View>
                            </View>
                        </View>

                        <View className="h-[1px] bg-white/10 w-full mb-8" />

                        <View className="flex-row justify-between">
                            <View className="flex-1">
                                <Text className="text-white/40 text-[9px] font-black uppercase tracking-[2px] mb-2">Endpoint Identity</Text>
                                <Text className="text-white text-sm font-bold" numberOfLines={1}>{user.email}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-white/40 text-[9px] font-black uppercase tracking-[2px] mb-2">Activation Date</Text>
                                <Text className="text-white text-sm font-bold">{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Statistics Grid */}
                <View className="px-6 mb-10">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6 ml-1">Asset Portfolio</Text>
                    <View className="flex-row justify-between">
                        <View className="bg-white p-6 rounded-[32px] w-[48%] border border-gray-100 shadow-sm items-center">
                            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
                                <Ionicons name="cart" size={24} color="#4f46e5" />
                            </View>
                            <Text className="text-3xl font-black text-black">{orders.length}</Text>
                            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest mt-1">Order Index</Text>
                        </View>
                        <View className="bg-white p-6 rounded-[32px] w-[48%] border border-gray-100 shadow-sm items-center">
                            <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mb-4">
                                <Ionicons name="diamond" size={24} color="#d97706" />
                            </View>
                            <Text className="text-3xl font-black text-black">{schemes.length}</Text>
                            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest mt-1">Scheme Nodes</Text>
                        </View>
                    </View>
                </View>

                {/* Execution History */}
                <View className="px-6 mb-20">
                    <View className="flex-row justify-between items-center mb-6 px-1">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Execution History</Text>
                        <TouchableOpacity>
                            <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Expand All</Text>
                        </TouchableOpacity>
                    </View>

                    {orders.map((order, i) => (
                        <View key={order._id} className="bg-gray-50 p-5 rounded-[32px] mb-4 border border-gray-100 flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-gray-100 mr-4 shadow-sm">
                                    <Ionicons name="receipt" size={20} color="#4f46e5" />
                                </View>
                                <View>
                                    <Text className="text-black font-black text-sm uppercase">#{order.orderNumber.slice(-8)}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="time-outline" size={10} color="#94a3b8" />
                                        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter ml-1">{new Date(order.createdAt).toDateString()}</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-black font-black text-base">₹{order.totalAmount.toLocaleString()}</Text>
                                <View className="bg-emerald-50 px-2 py-0.5 rounded-lg mt-1 border border-emerald-100">
                                    <Text className="text-emerald-600 font-black text-[8px] uppercase tracking-widest">Success</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {orders.length === 0 && (
                        <View className="items-center justify-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-[40px]">
                            <View className="w-16 h-16 bg-white rounded-3xl items-center justify-center shadow-sm mb-4 border border-gray-100">
                                <Ionicons name="folder-open" size={30} color="#e2e8f0" />
                            </View>
                            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[3px]">Zero historical activity recorded</Text>
                        </View>
                    )}
                </View>

                {/* Bottom Padding */}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
