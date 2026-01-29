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
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    packedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    unresolvedTicketsCount: number;
    supportTickets?: any[];
    resolvedTickets?: any[];
}

export default function OrderAdminDashboard() {
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

            // Fetch Orders, Stats, Support Tickets & Resolved Tickets
            const [ordersRes, statsRes, ticketsRes, resolvedTicketsRes] = await Promise.all([
                fetch(`${BASE_URL}/api/v1/orders`, { headers }),
                fetch(`${BASE_URL}/api/v1/dashboard/stats`, { headers }),
                fetch(`${BASE_URL}/api/v1/support/admin`, { headers }),
                fetch(`${BASE_URL}/api/v1/support/admin`, { headers })
            ]);

            const ordersData = await ordersRes.json();
            const statsData = await statsRes.json();
            const ticketsData = await ticketsRes.json();
            const resolvedTicketsData = await resolvedTicketsRes.json();

            if (ordersData.success) {
                const orders = ordersData.data || [];
                const unresolvedTicketsCount = statsData.success ? statsData.data.unresolvedTicketsCount : 0;
                const supportTickets = ticketsData.success ? ticketsData.data.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') : [];
                const resolvedTickets = resolvedTicketsData.success ? resolvedTicketsData.data.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED') : [];

                console.log('📊 Dashboard Stats:', {
                    unresolvedTicketsCount,
                    statsDataSuccess: statsData.success,
                    supportTickets: supportTickets.length,
                    resolvedTickets: resolvedTickets.length,
                    fullStatsData: statsData.data
                });

                // Get today's date at midnight
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                setStats({
                    totalOrders: orders.length,
                    pendingOrders: orders.filter((o: any) => o.orderStatus === 'PENDING').length,
                    confirmedOrders: orders.filter((o: any) => o.orderStatus === 'CONFIRMED').length,
                    packedOrders: orders.filter((o: any) => o.orderStatus === 'PACKED').length,
                    shippedOrders: orders.filter((o: any) => o.orderStatus === 'SHIPPED').length,
                    deliveredOrders: orders.filter((o: any) => o.orderStatus === 'DELIVERED').length,
                    cancelledOrders: orders.filter((o: any) => o.orderStatus === 'CANCELLED').length,
                    todayOrders: orders.filter((o: any) => {
                        const orderDate = new Date(o.createdAt);
                        orderDate.setHours(0, 0, 0, 0);
                        return orderDate.getTime() === today.getTime();
                    }).length,
                    unresolvedTicketsCount,
                    supportTickets,
                    resolvedTickets
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

    const getOrderHealth = () => {
        const pending = stats?.pendingOrders || 0;
        const total = stats?.totalOrders || 1;

        if (pending > 10) return { label: 'High Volume', color: '#dc2626', bg: 'bg-red-50', icon: 'alert-circle' };
        if (pending > 5) return { label: 'Moderate', color: '#ea580c', bg: 'bg-orange-50', icon: 'warning' };
        return { label: 'Under Control', color: '#16a34a', bg: 'bg-green-50', icon: 'checkmark-circle' };
    };

    const health = getOrderHealth();

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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Order Admin</Text>
                        <Text className="text-2xl font-black text-black">DASHBOARD</Text>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.push('/Orderadmin/orders')}
                            className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                        >
                            <Ionicons name="search" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden ml-3"
                        >
                            <View className="bg-blue-50 w-full h-full items-center justify-center">
                                <Ionicons name="person" size={20} color="#2563eb" />
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
                                <Text className="text-blue-600 text-[10px] font-bold uppercase mt-1">Order Administrator</Text>
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
                        <View className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] p-6 shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#2563eb' }}>
                            {/* Decorative Background Elements */}
                            <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                            <View className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />

                            <View className="flex-row justify-between items-start mb-8">
                                <View>
                                    <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30 mb-2 self-start flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
                                        <Text className="text-white text-[10px] font-black uppercase tracking-tighter">Live Status</Text>
                                    </View>
                                    <Text className="text-white text-3xl font-black">Order Flow</Text>
                                    <Text className="text-blue-200 text-sm font-medium">Real-time fulfillment insights</Text>
                                </View>
                                <View className="bg-white/10 p-3 rounded-2xl rotate-12">
                                    <Ionicons name="cube" size={24} color="white" />
                                </View>
                            </View>

                            <View className="flex-row">
                                <View className="flex-1">
                                    <Text className="text-blue-200 text-xs font-bold uppercase mb-1">Today</Text>
                                    <Text className="text-white text-3xl font-black">{stats?.todayOrders || 0}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-green-300 text-[10px] font-black">NEW ORDERS</Text>
                                    </View>
                                </View>
                                <View className="w-[1px] h-12 bg-white/10 mx-6 self-center" />
                                <View className="flex-1">
                                    <Text className="text-blue-200 text-xs font-bold uppercase mb-1">Pending</Text>
                                    <Text className="text-white text-3xl font-black">{stats?.pendingOrders || 0}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-orange-300 text-[10px] font-black">AWAITING</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Order Health Widget */}
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.replace('/Orderadmin/pending')}
                            className="bg-gray-50 rounded-[28px] p-5 flex-row items-center border border-gray-100"
                        >
                            <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: health.color + '10' }}>
                                <Ionicons name={health.icon as any} size={28} color={health.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-black text-lg">Order Queue</Text>
                                <Text className="text-gray-500 text-sm font-medium">{health.label}</Text>
                            </View>
                            <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm">
                                <Ionicons name="chevron-forward" size={18} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Order Status Grid */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Order Status</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {/* Confirmed Orders */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Orderadmin/orders')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-green-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-green-600/30">
                                    <Ionicons name="checkmark-circle" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Confirmed</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">{stats?.confirmedOrders || 0} orders</Text>
                            </TouchableOpacity>

                            {/* Packed Orders */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Orderadmin/orders')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-purple-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-purple-600/30">
                                    <Ionicons name="cube" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Packed</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">{stats?.packedOrders || 0} orders</Text>
                            </TouchableOpacity>

                            {/* Shipped Orders */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Orderadmin/shipped')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-blue-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
                                    <Ionicons name="airplane" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Shipped</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">{stats?.shippedOrders || 0} orders</Text>
                            </TouchableOpacity>

                            {/* Delivered Orders */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Orderadmin/orders')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-teal-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-teal-600/30">
                                    <Ionicons name="checkmark-done-circle" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Delivered</Text>
                                <Text className="text-gray-500 text-xs mt-1 font-medium">{stats?.deliveredOrders || 0} orders</Text>
                            </TouchableOpacity>

                            {/* All Orders - Full Width */}
                            <TouchableOpacity
                                onPress={() => router.replace('/Orderadmin/orders')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm w-full flex-row items-center"
                            >
                                <View className="bg-white border border-blue-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="receipt" size={28} color="#2563eb" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">All Orders</Text>
                                    <Text className="text-gray-500 text-xs font-medium">View complete order history</Text>
                                </View>
                                <View className="bg-blue-600 px-4 py-2 rounded-full">
                                    <Text className="text-white font-black text-lg">{stats?.totalOrders || 0}</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Physical Gold Deliveries */}
                            <TouchableOpacity
                                onPress={() => router.push('/Orderadmin/physical_gold_delivery')}
                                className="bg-white border-2 border-amber-100 rounded-[32px] p-6 mb-4 shadow-sm w-full flex-row items-center"
                            >
                                <View className="bg-amber-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg">
                                    <Ionicons name="cube" size={28} color="white" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Physical Gold Deliveries</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Manage gold redemption requests</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#d97706" />
                            </TouchableOpacity>

                            {/* User Management Hub */}
                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/manage_users')}
                                className="bg-gray-900 rounded-[32px] p-6 mb-4 shadow-xl w-full flex-row items-center border border-gray-800"
                            >
                                <View className="bg-white/10 w-14 h-14 rounded-2xl items-center justify-center">
                                    <Ionicons name="people-sharp" size={28} color="#fbbf24" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-black text-lg">User Management</Text>
                                        <View className="bg-yellow-500/20 px-2 py-0.5 rounded-full ml-2">
                                            <Text className="text-yellow-500 text-[8px] font-black uppercase">Admin Hub</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-400 text-xs font-medium">Manage vaults, KYC & accounts</Text>
                                </View>
                                <View className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                                    <Ionicons name="chevron-forward" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Support Tickets Alert */}
                    {stats?.supportTickets && stats.supportTickets.length > 0 && (
                        <View className="px-6 mb-6">
                            <Text className="text-black font-black text-xl mb-4 ml-1">Support Tickets</Text>
                            <View className="space-y-3">
                                {stats.supportTickets.slice(0, 2).map((ticket: any, index: number) => (
                                    <TouchableOpacity
                                        key={ticket._id}
                                        onPress={() => router.push(`/Orderadmin/order_detail?id=${ticket.order?._id}`)}
                                        activeOpacity={0.7}
                                        className={`bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm ${index !== 0 ? 'mt-3' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View className="bg-amber-500 w-10 h-10 rounded-2xl items-center justify-center">
                                                <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                                            </View>
                                            <View className={`px-3 py-1 rounded-full ${ticket.status === 'OPEN' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                                <Text className={`text-[9px] font-black uppercase ${ticket.status === 'OPEN' ? 'text-amber-600' : 'text-blue-600'}`}>{ticket.status}</Text>
                                            </View>
                                        </View>

                                        <Text className="text-black font-black text-base mb-1" numberOfLines={1}>{ticket.subject}</Text>
                                        <Text className="text-gray-500 text-xs font-medium mb-3">{ticket.category} Issue</Text>

                                        {ticket.order && (
                                            <View className="bg-gray-50 rounded-xl p-3 flex-row items-center justify-between">
                                                <View>
                                                    <Text className="text-gray-400 text-[9px] font-bold uppercase">Order</Text>
                                                    <Text className="text-gray-900 font-bold text-sm">#{ticket.order.orderNumber}</Text>
                                                </View>
                                                <Text className="text-blue-600 font-black text-sm">₹{ticket.order.totalAmount?.toLocaleString()}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {stats.supportTickets.length > 2 && (
                                <TouchableOpacity
                                    onPress={() => router.push('/Orderadmin/orders')}
                                    className="bg-gray-50 py-3 rounded-2xl items-center mt-4 border border-gray-100"
                                >
                                    <Text className="text-gray-700 font-black text-xs">+{stats.supportTickets.length - 2} More Tickets</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Resolved Tickets Section */}
                    {stats?.resolvedTickets && stats.resolvedTickets.length > 0 && (
                        <View className="px-6 mb-6">
                            <Text className="text-black font-black text-xl mb-4 ml-1">Resolved Tickets</Text>
                            <View className="space-y-3">
                                {stats.resolvedTickets.slice(0, 3).map((ticket: any, index: number) => (
                                    <TouchableOpacity
                                        key={ticket._id}
                                        onPress={() => router.push(`/Orderadmin/order_detail?id=${ticket.order?._id}`)}
                                        activeOpacity={0.7}
                                        className={`bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm ${index !== 0 ? 'mt-3' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View className="bg-teal-500 w-10 h-10 rounded-2xl items-center justify-center">
                                                <Ionicons name="checkmark-done-circle" size={20} color="white" />
                                            </View>
                                            <View className="bg-teal-50 px-3 py-1 rounded-full">
                                                <Text className="text-[9px] font-black uppercase text-teal-600">RESOLVED</Text>
                                            </View>
                                        </View>

                                        <Text className="text-black font-black text-base mb-1" numberOfLines={1}>{ticket.subject}</Text>
                                        <Text className="text-gray-500 text-xs font-medium mb-3">{ticket.category} Issue</Text>

                                        {/* Product Information */}
                                        {ticket.order && ticket.order.orderItems && ticket.order.orderItems.length > 0 && (
                                            <View className="bg-purple-50 rounded-xl p-3 mb-3">
                                                <Text className="text-gray-400 text-[9px] font-bold uppercase mb-1">Product(s)</Text>
                                                <Text className="text-purple-900 font-bold text-sm" numberOfLines={2}>
                                                    {ticket.order.orderItems.map((item: any) => item.product?.name || 'Product').join(', ')}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Order Details */}
                                        {ticket.order && (
                                            <View className="bg-gray-50 rounded-xl p-3 flex-row items-center justify-between mb-3">
                                                <View>
                                                    <Text className="text-gray-400 text-[9px] font-bold uppercase">Order</Text>
                                                    <Text className="text-gray-900 font-bold text-sm">#{ticket.order.orderNumber}</Text>
                                                </View>
                                                <Text className="text-blue-600 font-black text-sm">₹{ticket.order.totalAmount?.toLocaleString()}</Text>
                                            </View>
                                        )}

                                        {/* Admin Response */}
                                        {ticket.adminResponse && (
                                            <View className="bg-green-50 rounded-xl p-3 border border-green-100">
                                                <View className="flex-row items-center mb-2">
                                                    <Ionicons name="chatbubble-ellipses" size={12} color="#059669" />
                                                    <Text className="text-green-700 text-[9px] font-bold uppercase ml-1">Admin Reply</Text>
                                                </View>
                                                <Text className="text-green-900 text-xs font-medium leading-relaxed" numberOfLines={3}>
                                                    {ticket.adminResponse}
                                                </Text>
                                                {ticket.respondedAt && (
                                                    <Text className="text-green-600 text-[9px] font-bold mt-2">
                                                        {new Date(ticket.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {stats.resolvedTickets.length > 3 && (
                                <TouchableOpacity
                                    onPress={() => router.push('/Orderadmin/orders')}
                                    className="bg-gray-50 py-3 rounded-2xl items-center mt-4 border border-gray-100"
                                >
                                    <Text className="text-gray-700 font-black text-xs">+{stats.resolvedTickets.length - 3} More Resolved Tickets</Text>
                                </TouchableOpacity>
                            )}

                            {/* View All Tickets Button */}
                            <TouchableOpacity
                                onPress={() => router.push('/Orderadmin/tickets')}
                                className="bg-blue-600 py-4 rounded-2xl items-center mt-4 shadow-lg flex-row justify-center"
                            >
                                <Ionicons name="list" size={18} color="white" />
                                <Text className="text-white font-black text-sm ml-2 uppercase tracking-tight">View All Tickets</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Pending Orders Alert (only show if no tickets) */}
                    {(!stats?.supportTickets || stats.supportTickets.length === 0) && (stats?.pendingOrders || 0) > 5 && (
                        <View className="px-6 mb-10">
                            <View className="bg-orange-50 rounded-[32px] p-6 border border-orange-100">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-orange-600 p-2 rounded-xl">
                                        <Ionicons name="notifications" size={18} color="white" />
                                    </View>
                                    <Text className="text-orange-600 font-black ml-3 text-lg">Action Required</Text>
                                </View>
                                <Text className="text-orange-900/70 font-medium mb-4 leading-relaxed">
                                    You have <Text className="font-black text-orange-600">{stats?.pendingOrders}</Text> pending orders awaiting confirmation. Process them to maintain delivery timelines.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.replace('/Orderadmin/pending')}
                                    className="bg-white py-4 rounded-2xl items-center shadow-sm"
                                >
                                    <Text className="text-orange-600 font-black">Process Orders</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* Bottom Padding for Nav */}
                <View className="h-32" />
            </ScrollView>
        </View >
    );
}
