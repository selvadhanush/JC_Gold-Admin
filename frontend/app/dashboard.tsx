import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface DashboardStats {
    totalRevenue: number;
    dailySales: Array<{ _id: string; sales: number; count: number }>;
    ordersByStatus: Array<{ _id: string; count: number }>;
    topProducts: Array<any>;
    schemeRevenue: number;
}

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [adminName, setAdminName] = useState('Admin');
    const [adminRole, setAdminRole] = useState<string>('');

    useEffect(() => {
        loadAdminData();
        fetchDashboardStats();
    }, []);

    const loadAdminData = async () => {
        try {
            const userData = await SecureStore.getItemAsync('userData');
            if (userData) {
                const admin = JSON.parse(userData);
                setAdminName(admin.name || 'Admin');
                setAdminRole(admin.role?.name || '');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.DASHBOARD + '/stats', { headers });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardStats();
    };

    const getOrderStatusCount = (status: string) => {
        if (!stats?.ordersByStatus) return 0;
        const found = stats.ordersByStatus.find(s => s._id === status);
        return found ? found.count : 0;
    };

    const getTodaySales = () => {
        if (!stats?.dailySales || stats.dailySales.length === 0) return { sales: 0, count: 0 };
        const today = new Date().toISOString().split('T')[0];
        const todayData = stats.dailySales.find(d => d._id === today);
        return todayData || { sales: 0, count: 0 };
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount.toLocaleString()}`;
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        await SecureStore.deleteItemAsync('userType');
        router.replace('/login');
    };

    const navigateToAdminPanel = () => {
        switch (adminRole) {
            case 'SUPER_ADMIN':
                router.push('/Superadmin');
                break;
            case 'PRODUCT_ADMIN':
                router.push('/Productadmin');
                break;
            case 'ORDER_ADMIN':
                router.push('/Orderadmin');
                break;
            default:
                break;
        }
    };

    const getRoleColor = () => {
        switch (adminRole) {
            case 'SUPER_ADMIN':
                return { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' };
            case 'PRODUCT_ADMIN':
                return { bg: 'bg-orange-600', text: 'text-orange-600', light: 'bg-orange-50' };
            case 'ORDER_ADMIN':
                return { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' };
            case 'FINANCE_ADMIN':
                return { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-50' };
            default:
                return { bg: 'bg-gray-600', text: 'text-gray-600', light: 'bg-gray-50' };
        }
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="text-gray-500 mt-4 font-medium">Loading dashboard...</Text>
            </View>
        );
    }

    const todayData = getTodaySales();
    const pendingOrders = getOrderStatusCount('PENDING');
    const completedOrders = getOrderStatusCount('DELIVERED');
    const roleColors = getRoleColor();

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#f97316" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header with Glassmorphism */}
            <View className={`${roleColors.bg} px-6 pt-6 pb-8`}>
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-1">
                        <Text className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                            Welcome Back
                        </Text>
                        <Text className="text-white text-2xl font-black">
                            {adminName}
                        </Text>
                        <View className="bg-white/20 px-3 py-1 rounded-full mt-2 self-start">
                            <Text className="text-white text-xs font-black uppercase">
                                {adminRole.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center border border-white/30"
                    >
                        <Ionicons name="power-outline" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
                }
            >
                {/* Quick Stats Cards */}
                <View className="px-6 -mt-6 mb-6">
                    <View className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
                        <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
                            Today's Overview
                        </Text>

                        <View className="flex-row flex-wrap -mx-2">
                            {/* Total Revenue */}
                            <View className="w-1/2 px-2 mb-4">
                                <View className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200">
                                    <View className="w-10 h-10 bg-emerald-500 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="cash-outline" size={20} color="white" />
                                    </View>
                                    <Text className="text-2xl font-black text-emerald-900 mb-1">
                                        {formatCurrency(stats?.totalRevenue || 0)}
                                    </Text>
                                    <Text className="text-xs font-bold text-emerald-600 uppercase">
                                        Total Revenue
                                    </Text>
                                </View>
                            </View>

                            {/* Orders Today */}
                            <View className="w-1/2 px-2 mb-4">
                                <View className="bg-blue-50 rounded-3xl p-5 border border-blue-200">
                                    <View className="w-10 h-10 bg-blue-500 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="cart-outline" size={20} color="white" />
                                    </View>
                                    <Text className="text-2xl font-black text-blue-900 mb-1">
                                        {todayData.count}
                                    </Text>
                                    <Text className="text-xs font-bold text-blue-600 uppercase">
                                        Orders Today
                                    </Text>
                                </View>
                            </View>

                            {/* Pending Orders */}
                            <View className="w-1/2 px-2 mb-4">
                                <View className="bg-amber-50 rounded-3xl p-5 border border-amber-200">
                                    <View className="w-10 h-10 bg-amber-500 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="time-outline" size={20} color="white" />
                                    </View>
                                    <Text className="text-2xl font-black text-amber-900 mb-1">
                                        {pendingOrders}
                                    </Text>
                                    <Text className="text-xs font-bold text-amber-600 uppercase">
                                        Pending
                                    </Text>
                                </View>
                            </View>

                            {/* Completed Orders */}
                            <View className="w-1/2 px-2 mb-4">
                                <View className="bg-purple-50 rounded-3xl p-5 border border-purple-200">
                                    <View className="w-10 h-10 bg-purple-500 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                    </View>
                                    <Text className="text-2xl font-black text-purple-900 mb-1">
                                        {completedOrders}
                                    </Text>
                                    <Text className="text-xs font-bold text-purple-600 uppercase">
                                        Completed
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Admin Panel Access */}
                <View className="px-6 mb-6">
                    <Text className="text-black font-black text-xl mb-4">Quick Access</Text>
                    <TouchableOpacity
                        onPress={navigateToAdminPanel}
                        className={`${roleColors.bg} rounded-[32px] p-6 shadow-lg`}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-2">
                                    <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                                        <Ionicons name="apps" size={24} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-white/80 text-xs font-bold uppercase">
                                            Your Admin Panel
                                        </Text>
                                        <Text className="text-white text-xl font-black">
                                            {adminRole.replace('_', ' ')} Dashboard
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-white/70 text-sm font-medium mt-2">
                                    Access your dedicated admin tools and features
                                </Text>
                            </View>
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center ml-4">
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Top Products */}
                {stats?.topProducts && stats.topProducts.length > 0 && (
                    <View className="px-6 mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-black text-gray-900">
                                Top Selling Products
                            </Text>
                            <Ionicons name="trophy-outline" size={24} color="#f97316" />
                        </View>

                        {stats.topProducts.slice(0, 3).map((product, index) => (
                            <View
                                key={index}
                                className="bg-white rounded-3xl p-5 mb-3 border border-gray-100 shadow-sm"
                            >
                                <View className="flex-row items-center">
                                    <View className={`w-12 h-12 ${roleColors.light} rounded-2xl items-center justify-center mr-4`}>
                                        <Text className={`${roleColors.text} font-black text-lg`}>
                                            #{index + 1}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-bold text-base mb-1">
                                            {product.productDetails?.name || 'Product'}
                                        </Text>
                                        <Text className="text-gray-500 text-xs font-medium">
                                            {product.totalSold || 0} units sold • {formatCurrency(product.revenue || 0)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Bottom Padding */}
                <View className="h-32" />
            </ScrollView>

            {/* Premium Bottom Navigation */}
            <View className="absolute bottom-6 left-6 right-6">
                <View className="bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden">
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={() => router.push('/dashboard')}
                            className="flex-1 items-center justify-center py-4"
                        >
                            <Ionicons name="home" size={24} color="#f97316" />
                            <Text className="text-orange-600 text-xs font-black uppercase mt-1">
                                Home
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={navigateToAdminPanel}
                            className="flex-1 items-center justify-center py-4"
                        >
                            <Ionicons name="apps-outline" size={24} color="#6b7280" />
                            <Text className="text-gray-400 text-xs font-black uppercase mt-1">
                                Panel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-1 items-center justify-center py-4"
                        >
                            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
                            <Text className="text-gray-400 text-xs font-black uppercase mt-1">
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
