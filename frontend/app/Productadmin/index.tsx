import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    ImageBackground,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';
import { DashboardSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface DashboardStats {
    categories: { total: number; active: number; inactive: number };
    products: { total: number; active: number; draft: number; outOfStock: number; discontinued: number };
    inventory: { lowStock: number; totalItems: number };
}

export default function ProductAdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        fetchDashboardData();
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const data = await SecureStore.getItemAsync('userData');
        if (data) setUserData(JSON.parse(data));
    };

    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideUpAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.spring(headerScale, {
                    toValue: 1,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading]);

    const fetchDashboardData = async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch Data
            const [categoriesRes, productsRes, inventoryRes] = await Promise.all([
                fetch(`${BASE_URL}/api/v1/categories`, { headers }),
                fetch(`${BASE_URL}/api/v1/products`, { headers }),
                fetch(`${BASE_URL}/api/v1/inventory/low-stock`, { headers })
            ]);

            const [categoriesData, productsData, inventoryData] = await Promise.all([
                categoriesRes.json(),
                productsRes.json(),
                inventoryRes.json()
            ]);

            if (categoriesData.success && productsData.success) {
                const categories = categoriesData.data || [];
                const products = productsData.data || [];
                const lowStockItems = inventoryData.data || [];

                setStats({
                    categories: {
                        total: categories.length,
                        active: categories.filter((c: any) => c.isActive).length,
                        inactive: categories.filter((c: any) => !c.isActive).length,
                    },
                    products: {
                        total: products.length,
                        active: products.filter((p: any) => p.status === 'ACTIVE').length,
                        draft: products.filter((p: any) => p.status === 'DRAFT').length,
                        outOfStock: products.filter((p: any) => p.status === 'OUT_OF_STOCK').length,
                        discontinued: products.filter((p: any) => p.status === 'DISCONTINUED').length,
                    },
                    inventory: {
                        lowStock: lowStockItems.length,
                        totalItems: products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0),
                    },
                });
            }
        } catch (error) {
            console.error('Dashboard Fetch Failure:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        await SecureStore.deleteItemAsync('userType');
        router.replace('/login');
    };

    const getStockHealth = () => {
        const outOfStock = stats?.products?.outOfStock || 0;
        const lowStock = stats?.inventory?.lowStock || 0;
        const total = stats?.products?.total || 1;

        if (outOfStock > 0) return { label: 'Critical', color: '#dc2626', bg: 'bg-red-50', icon: 'alert-circle' };
        if (lowStock > 0) return { label: 'Needs Attention', color: '#ea580c', bg: 'bg-orange-50', icon: 'warning' };
        return { label: 'Healthy', color: '#16a34a', bg: 'bg-green-50', icon: 'checkmark-circle' };
    };

    const heath = getStockHealth();

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <DashboardSkeleton />
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* 10/10 Premium Header */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Store Admin</Text>
                        <Text className="text-2xl font-black text-black">DASHBOARD</Text>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.push('/Productadmin/products')}
                            className="bg-black w-10 h-10 rounded-full items-center justify-center shadow-lg"
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 rounded-full border-2 border-orange-500 overflow-hidden ml-8"
                        >
                            <View className="bg-orange-50 w-full h-full items-center justify-center">
                                <Ionicons name="person" size={20} color="#ea580c" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Menu Dropdown */}
                <Modal visible={showProfileMenu} transparent animationType="fade" onRequestClose={() => setShowProfileMenu(false)}>
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowProfileMenu(false)}
                    >
                        <View className="absolute top-28 right-6 bg-white rounded-[32px] p-6 z-50 border border-gray-100 shadow-2xl" style={{ width: 240 }}>
                            <View className="mb-5 pb-5 border-b border-gray-50">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Account Portal</Text>
                                <Text className="text-black font-black text-xs" numberOfLines={1}>{userData?.email || 'admin@jcgold.com'}</Text>
                                <Text className="text-orange-600 text-[10px] font-bold uppercase mt-1">Product Administrator</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setShowProfileMenu(false);
                                    handleLogout();
                                }}
                                className="flex-row items-center py-2 px-1"
                            >
                                <View className="bg-red-50 w-10 h-10 rounded-xl items-center justify-center mr-4">
                                    <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                                </View>
                                <Text className="text-red-600 font-black text-xs uppercase tracking-tight">End Session</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
                    {/* Hero Status Section */}
                    <View className="p-6">
                        <View className="bg-black rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
                            {/* Decorative Background Elements */}
                            <View className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/20 rounded-full" />
                            <View className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />

                            <View className="flex-row justify-between items-start mb-8">
                                <View>
                                    <View className="bg-orange-600/20 px-3 py-1 rounded-full border border-orange-600/30 mb-2 self-start flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2" />
                                        <Text className="text-orange-400 text-[10px] font-black uppercase tracking-tighter">Live Status</Text>
                                    </View>
                                    <Text className="text-white text-3xl font-black">Performance</Text>
                                    <Text className="text-gray-400 text-sm font-medium">Real-time inventory insights</Text>
                                </View>
                                <View className="bg-white/10 p-3 rounded-2xl rotate-12">
                                    <Ionicons name="rocket" size={24} color="#ea580c" />
                                </View>
                            </View>

                            <View className="flex-row">
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Products</Text>
                                    <Text className="text-white text-3xl font-black">{stats?.products?.total || 0}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-green-500 text-[10px] font-black">{stats?.products?.active || 0} ACTIVE</Text>
                                    </View>
                                </View>
                                <View className="w-[1px] h-12 bg-white/10 mx-6 self-center" />
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Stock</Text>
                                    <Text className="text-white text-3xl font-black">{stats?.inventory?.totalItems || 0}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-orange-400 text-[10px] font-black">{stats?.inventory?.lowStock || 0} LOW UNIT</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Stock Health Widget */}
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.replace('/Productadmin/inventory')}
                            className="bg-gray-50 rounded-[28px] p-5 flex-row items-center border border-gray-100"
                        >
                            <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: heath.color + '10' }}>
                                <Ionicons name={heath.icon as any} size={28} color={heath.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-black text-lg">Inventory Health</Text>
                                <Text className="text-gray-500 text-sm font-medium">{heath.label}</Text>
                            </View>
                            <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm">
                                <Ionicons name="chevron-forward" size={18} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Access Grid */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Quick Access</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {/* Action Item 1: Categories */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Productadmin/categories')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-orange-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-orange-600/30">
                                    <Ionicons name="grid" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Categories</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">{stats?.categories?.total || 0} groups</Text>
                            </TouchableOpacity>

                            {/* Action Item 2: Products */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Productadmin/products')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-black w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-black/20">
                                    <Ionicons name="cube" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Catalog</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">Edit list</Text>
                            </TouchableOpacity>

                            {/* Action Item 3: Inventory */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Productadmin/inventory')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm w-full flex-row items-center"
                            >
                                <View className="bg-white border border-orange-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="layers" size={28} color="#ea580c" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Stock Control</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Monitor & Adjust levels</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            {/* Action Item 4: Support Tickets */}
                            <TouchableOpacity
                                onPress={() => router.push('/Productadmin/support_tickets')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm w-full flex-row items-center"
                            >
                                <View className="bg-white border border-orange-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="chatbubbles" size={28} color="#ea580c" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Customer Support</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Product inquiries & tickets</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Critical Alerts Hook */}
                    {(stats?.inventory?.lowStock || 0) > 0 && (
                        <View className="px-6 mb-10">
                            <View className="bg-red-50 rounded-[32px] p-6 border border-red-100">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-red-600 p-2 rounded-xl">
                                        <Ionicons name="notifications" size={18} color="white" />
                                    </View>
                                    <Text className="text-red-600 font-black ml-3 text-lg">Critical Alert</Text>
                                </View>
                                <Text className="text-red-900/70 font-medium mb-4 leading-relaxed">
                                    You have <Text className="font-black text-red-600">{stats?.inventory?.lowStock}</Text> items running low on stock. This may impact your fulfillment today.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.replace('/Productadmin/inventory')}
                                    className="bg-white py-4 rounded-2xl items-center shadow-sm"
                                >
                                    <Text className="text-red-600 font-black">Restock Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Bottom Padding for Nav */}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
