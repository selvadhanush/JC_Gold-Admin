import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Animated,
    Dimensions,
    StatusBar,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import * as SecureStore from 'expo-secure-store';
import { DashboardSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface DashboardStats {
    revenue: { today: number; month: number; orderRevenue: number; schemeRevenue: number };
    orders: { today: number; month: number };
    schemes: { total: number; active: number };
    installments: { pending: number; completed: number };
    payments: { total: number; pending: number; recent: any[] };
    refunds: { pending: number; processed: number };
}

export default function FinanceAdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [pendingConfirmCount, setPendingConfirmCount] = useState(0);
    const [priorityCount, setPriorityCount] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;

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
            ]).start();
        }
    }, [loading]);

    const fetchDashboardData = async () => {
        try {
            const headers = await getAuthHeaders();

            // Fetch dashboard stats, schemes, and payments in parallel
            const [statsRes, schemesRes, paymentsRes, ordersRes] = await Promise.all([
                fetch(`${BASE_URL}/api/v1/dashboard/stats`, { headers }),
                fetch(`${BASE_URL}/api/v1/schemes`, { headers }),
                fetch(`${BASE_URL}/api/v1/payments`, { headers }),
                fetch(`${BASE_URL}/api/v1/orders?orderStatus=PENDING&isFinanceConfirmed=false`, { headers })
            ]);

            const statsData = await statsRes.json();
            const schemesData = await schemesRes.json();
            const paymentsData = await paymentsRes.json();
            const ordersData = await ordersRes.json();

            console.log('Dashboard Stats Response:', statsData);

            if (statsData.success) {
                const schemes = schemesData.success ? schemesData.data : [];
                const payments = paymentsData.success ? paymentsData.data : [];
                const pendingOrders = ordersData.success ? ordersData.data.filter((o: any) => o.orderStatus === 'PENDING' && !o.isFinanceConfirmed) : [];

                setPendingConfirmCount(pendingOrders.length);
                setPriorityCount(pendingOrders.filter((o: any) => o.isPriority).length);

                // Calculate scheme stats
                const activeSchemes = schemes.filter((s: any) => s.isActive).length;

                // Calculate payment stats
                const pendingPayments = payments.filter((p: any) => p.status === 'PENDING').length;
                const totalPayments = payments.length;

                // Calculate revenue from backend response
                const totalOrderRevenue = statsData.data?.totalRevenue || 0;
                const totalOrdersCount = statsData.data?.totalOrders || 0;
                const schemeRevenue = statsData.data?.schemeRevenue || 0;
                const dailyStats = statsData.data?.dailySales || [];

                // Calculate today's revenue and orders
                const today = new Date().toISOString().split('T')[0];
                const todaySale = dailyStats.find((sale: any) => sale._id === today);
                const todayRevenue = todaySale ? todaySale.sales : 0;
                const todayOrders = todaySale ? todaySale.count : 0;

                // Calculate last 30 days revenue and orders (actual monthly)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

                const monthlyStats = dailyStats.filter((sale: any) => sale._id >= thirtyDaysAgoStr);
                const monthlyRevenue = monthlyStats.reduce((sum: number, sale: any) => sum + (sale.sales || 0), 0);
                const monthlyOrders = monthlyStats.reduce((sum: number, sale: any) => sum + (sale.count || 0), 0);

                // Use 90-day or total if 30-day is empty to show "something" in dev
                const displayRevenue = monthlyRevenue || totalOrderRevenue;
                const displayOrders = monthlyOrders || totalOrdersCount;

                console.log('Calculated Stats:', {
                    todayRevenue,
                    todayOrders,
                    monthlyRevenue: displayRevenue,
                    monthlyOrders: displayOrders,
                    totalOrderRevenue,
                    schemeRevenue
                });

                setStats({
                    revenue: {
                        today: todayRevenue,
                        month: displayRevenue,
                        orderRevenue: totalOrderRevenue,
                        schemeRevenue: schemeRevenue
                    },
                    orders: {
                        today: todayOrders,
                        month: displayOrders
                    },
                    schemes: {
                        total: schemes.length,
                        active: activeSchemes
                    },
                    installments: {
                        pending: 0,
                        completed: 0
                    },
                    payments: {
                        total: totalPayments,
                        pending: pendingPayments,
                        recent: payments.slice(0, 5) // Last 5 payments
                    },
                    refunds: {
                        pending: 0,
                        processed: 0
                    },
                });
            }
        } catch (error) {
            console.error('Dashboard Fetch Failure:', error);
            // Set default values on error
            setStats({
                revenue: { today: 0, month: 0, orderRevenue: 0, schemeRevenue: 0 },
                orders: { today: 0, month: 0 },
                schemes: { total: 0, active: 0 },
                installments: { pending: 0, completed: 0 },
                payments: { total: 0, pending: 0, recent: [] },
                refunds: { pending: 0, processed: 0 },
            });
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

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    const getFinancialHealth = () => {
        const pendingRefunds = stats?.refunds?.pending || 0;
        const pendingPayments = stats?.payments?.pending || 0;

        if (pendingRefunds > 5) return { label: 'Refunds Pending', color: '#dc2626', bg: 'bg-red-50', icon: 'alert-circle' };
        if (pendingPayments > 20) return { label: 'High Volume', color: '#ea580c', bg: 'bg-orange-50', icon: 'warning' };
        return { label: 'Operations Healthy', color: '#10b981', bg: 'bg-emerald-50', icon: 'checkmark-circle' };
    };

    const health = getFinancialHealth();

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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
                }
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <View className="flex-row items-center">
                            <Ionicons name="cash" size={14} color="#10b981" className="mr-2" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Finance Admin</Text>
                        </View>
                        <Text className="text-2xl font-black text-black">DASHBOARD</Text>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => setShowProfileMenu(true)}
                            className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden"
                        >
                            <View className="bg-emerald-50 w-full h-full items-center justify-center">
                                <Ionicons name="person" size={20} color="#10b981" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Modal */}
                <Modal visible={showProfileMenu} transparent animationType="fade" onRequestClose={() => setShowProfileMenu(false)}>
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowProfileMenu(false)}
                    >
                        <View className="absolute top-28 right-6 bg-white rounded-[32px] p-6 z-50 border border-gray-100 shadow-2xl" style={{ width: 240 }}>
                            <View className="mb-5 pb-5 border-b border-gray-50">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Financial Portal</Text>
                                <Text className="text-black font-black text-xs" numberOfLines={1}>{userData?.email || 'finance@jcgold.com'}</Text>
                                <Text className="text-emerald-600 text-[10px] font-bold uppercase mt-1">Finance Administrator</Text>
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
                    {/* Hero Revenue Card */}
                    <View className="p-6">
                        <View className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[32px] p-6 shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#10b981' }}>
                            {/* Decorative Background Elements */}
                            <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                            <View className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />

                            <View className="flex-row justify-between items-start mb-8">
                                <View>
                                    <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30 mb-2 self-start flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
                                        <Text className="text-white text-[10px] font-black uppercase tracking-tighter">Live Revenue</Text>
                                    </View>
                                    <Text className="text-white text-3xl font-black">Financial Flow</Text>
                                    <Text className="text-emerald-200 text-sm font-medium">Real-time transaction insights</Text>
                                </View>
                                <View className="bg-white/10 p-3 rounded-2xl rotate-12">
                                    <Ionicons name="trending-up" size={24} color="white" />
                                </View>
                            </View>

                            <View className="flex-row">
                                <View className="flex-1">
                                    <Text className="text-emerald-200 text-xs font-bold uppercase mb-1">Today</Text>
                                    <Text className="text-white text-3xl font-black">{formatCurrency(stats?.revenue?.today || 0)}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-green-300 text-[10px] font-black uppercase">{stats?.orders?.today || 0} Orders</Text>
                                    </View>
                                </View>
                                <View className="w-[1px] h-12 bg-white/10 mx-6 self-center" />
                                <View className="flex-1">
                                    <Text className="text-emerald-200 text-xs font-bold uppercase mb-1">Monthly</Text>
                                    <Text className="text-white text-3xl font-black">{formatCurrency(stats?.revenue?.month || 0)}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-yellow-300 text-[10px] font-black uppercase">{stats?.orders?.month || 0} Orders</Text>
                                    </View>
                                    <View className="mt-2 border-t border-white/10 pt-2">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-white/50 text-[9px] font-bold uppercase">Orders</Text>
                                            <Text className="text-white/90 text-[9px] font-bold">₹{(stats?.revenue?.orderRevenue || 0).toLocaleString()}</Text>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <Text className="text-white/50 text-[9px] font-bold uppercase">Schemes</Text>
                                            <Text className="text-white/90 text-[9px] font-bold">₹{(stats?.revenue?.schemeRevenue || 0).toLocaleString()}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Pending Confirmation Alert Card */}
                    {pendingConfirmCount > 0 && (
                        <View className="px-6 mb-6">
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push('/Financeadmin/waiting_confirmation' as any)}
                                className={`rounded-[32px] p-6 border-2 flex-row items-center ${priorityCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
                            >
                                <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${priorityCount > 0 ? 'bg-red-600' : 'bg-amber-500'} shadow-lg`}>
                                    <Ionicons name={priorityCount > 0 ? 'flash' : 'time'} size={28} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-black text-lg">
                                        {priorityCount > 0 ? 'Priority Confirmation' : 'Pending Approvals'}
                                    </Text>
                                    <Text className={`${priorityCount > 0 ? 'text-red-600' : 'text-amber-600'} text-xs font-bold uppercase tracking-tight`}>
                                        {pendingConfirmCount} Orders Awaiting Approval
                                    </Text>
                                    {priorityCount > 0 && (
                                        <Text className="text-red-500/70 text-[10px] font-bold mt-1 uppercase">
                                            {priorityCount} High Priority Requests
                                        </Text>
                                    )}
                                </View>
                                <View className="bg-white/80 w-10 h-10 rounded-full items-center justify-center border border-white">
                                    <Ionicons name="arrow-forward" size={18} color="black" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Financial Health Widget */}
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/Financeadmin/gold_schemes_hub')}
                            className="bg-gray-50 rounded-[28px] p-5 flex-row items-center border border-gray-100"
                        >
                            <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: health.color + '10' }}>
                                <Ionicons name={health.icon as any} size={28} color={health.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-black text-lg">Financial Health</Text>
                                <Text className="text-gray-500 text-sm font-medium">{health.label}</Text>
                            </View>
                            <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm">
                                <Ionicons name="chevron-forward" size={18} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats Grid */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Quick Overview</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {/* Schemes */}
                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/schemes')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-emerald-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-emerald-600/30">
                                    <Ionicons name="diamond" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Schemes</Text>
                                <Text className="text-emerald-600 text-xl font-black">{stats?.schemes?.active || 0}</Text>
                                <Text className="text-gray-400 text-[10px] font-bold uppercase">Active</Text>
                            </TouchableOpacity>

                            {/* Installments */}
                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/installments')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-amber-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-amber-600/30">
                                    <Ionicons name="calendar" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Installments</Text>
                                <Text className="text-gray-900 text-xl font-black">{stats?.installments?.pending || 0}</Text>
                                <Text className="text-gray-400 text-[10px] font-bold uppercase">Pending</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Financial Operations */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Operations</Text>
                        <View className="space-y-4">
                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/gold_schemes_hub')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-emerald-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="grid" size={28} color="#10b981" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Gold & Schemes</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Manage all transactions</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/waiting_confirmation' as any)}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-amber-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="receipt" size={28} color="#f59e0b" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Order Confirmations</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Verify pending order payments</Text>
                                </View>
                                {pendingConfirmCount > 0 && (
                                    <View className="bg-amber-500 px-3 py-1 rounded-full mr-2">
                                        <Text className="text-white text-[10px] font-black">{pendingConfirmCount}</Text>
                                    </View>
                                )}
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/refunds')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-red-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="return-down-back" size={28} color="#dc2626" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Refunds</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Process refund requests</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/reports')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-blue-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="bar-chart" size={28} color="#3b82f6" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Reports</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Financial analytics & exports</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/enrollments')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-purple-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="people" size={28} color="#9333ea" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Enrollments</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Manage scheme enrollments</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Financeadmin/support_tickets')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-amber-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="chatbubbles" size={28} color="#f59e0b" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Customer Support</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Payment inquiries & tickets</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Critical Alerts Hook */}
                    {(stats?.refunds?.pending || 0) > 0 && (
                        <View className="px-6 mb-10">
                            <View className="bg-red-50 rounded-[32px] p-6 border border-red-100">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-red-600 p-2 rounded-xl">
                                        <Ionicons name="notifications" size={18} color="white" />
                                    </View>
                                    <Text className="text-red-600 font-black ml-3 text-lg">Refund Alert</Text>
                                </View>
                                <Text className="text-red-900/70 font-medium mb-4 leading-relaxed">
                                    You have <Text className="font-black text-red-600">{stats?.refunds?.pending}</Text> pending refund requests requiring immediate attention.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/Financeadmin/refunds')}
                                    className="bg-white py-4 rounded-2xl items-center shadow-sm"
                                >
                                    <Text className="text-red-600 font-black">Process Refunds</Text>
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
