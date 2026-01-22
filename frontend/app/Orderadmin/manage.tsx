import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Skeleton from '../../components/Skeleton';
import { showToast } from '../../utils/toast';
import OrderAdminNav from '../../components/OrderAdminNav';

interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    packed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
}

export default function OrderManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders`, { headers });
            const data = await response.json();

            if (data.success) {
                const orders = data.data || [];
                setAllOrders(orders);

                setStats({
                    total: orders.length,
                    pending: orders.filter((o: any) => o.orderStatus === 'PENDING').length,
                    confirmed: orders.filter((o: any) => o.orderStatus === 'CONFIRMED').length,
                    packed: orders.filter((o: any) => o.orderStatus === 'PACKED').length,
                    shipped: orders.filter((o: any) => o.orderStatus === 'SHIPPED').length,
                    delivered: orders.filter((o: any) => o.orderStatus === 'DELIVERED').length,
                    cancelled: orders.filter((o: any) => o.orderStatus === 'CANCELLED').length,
                });

                setRecentOrders(orders.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const exportOrdersToCSV = async () => {
        if (!allOrders.length) {
            showToast.info('No orders available to export.');
            return;
        }

        try {
            const header = 'Order Number,Customer,Email,Status,Amount,Date\n';
            const rows = allOrders.map(o =>
                `${o.orderNumber || 'N/A'},${o.user?.name || 'N/A'},${o.user?.email || 'N/A'},${o.orderStatus || 'N/A'},${o.totalAmount || 0},${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}`
            ).join('\n');

            const csvContent = header + rows;
            const fileName = `Orders_${new Date().getTime()}.csv`;
            const fileUri = `${(FileSystem as any).documentDirectory || ''}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(fileUri);
            } else {
                showToast.warning('File saved, but sharing is unavailable.');
            }
        } catch (error) {
            console.error('Export Error:', error);
            showToast.error('Failed to export reports.');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PENDING': return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', icon: 'time-outline' };
            case 'CONFIRMED': return { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', icon: 'checkmark-circle-outline' };
            case 'PACKED': return { dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', icon: 'cube-outline' };
            case 'SHIPPED': return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', icon: 'airplane-outline' };
            case 'DELIVERED': return { dot: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50', icon: 'checkmark-done-outline' };
            case 'CANCELLED': return { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', icon: 'close-circle-outline' };
            default: return { dot: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50', icon: 'help-circle-outline' };
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />
                <View className="px-6 pt-10 pb-6">
                    <Skeleton width={120} height={24} className="mb-8" />
                    <View className="flex-row justify-between mb-10">
                        <Skeleton width="32%" height={80} className="rounded-2xl" />
                        <Skeleton width="32%" height={80} className="rounded-2xl" />
                        <Skeleton width="32%" height={80} className="rounded-2xl" />
                    </View>
                    <Skeleton width="100%" height={160} className="rounded-[32px] mb-6" />
                    <Skeleton width="100%" height={140} className="rounded-[32px]" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50/50">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
                contentContainerStyle={{ paddingBottom: 110 }}
            >
                {/* Header Section */}
                <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100/50">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="layers-outline" size={14} color="#64748b" />
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] ml-1.5">Management</Text>
                            </View>
                            <Text className="text-3xl font-black text-slate-900">Operations</Text>
                        </View>
                        <View className="bg-blue-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-200">
                            <Ionicons name="apps" size={26} color="white" />
                        </View>
                    </View>
                </View>

                {/* Pipeline Performance - Section Icon Added */}
                <View className="px-6 mt-8">
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-2.5">
                            <Ionicons name="analytics-outline" size={18} color="#2563eb" />
                        </View>
                        <Text className="text-slate-900 font-black text-lg">Order Pipeline</Text>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-amber-50 rounded-[28px] p-5 border border-amber-100 items-center justify-center">
                            <View className="w-10 h-10 bg-amber-500 rounded-xl items-center justify-center mb-3">
                                <Ionicons name="time" size={20} color="white" />
                            </View>
                            <Text className="text-2xl font-black text-amber-900">{stats?.pending || 0}</Text>
                            <Text className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-0.5">Pending</Text>
                        </View>

                        <View className="flex-1 bg-blue-50 rounded-[28px] p-5 border border-blue-100 items-center justify-center">
                            <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center mb-3">
                                <Ionicons name="airplane" size={20} color="white" />
                            </View>
                            <Text className="text-2xl font-black text-blue-900">{stats?.shipped || 0}</Text>
                            <Text className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">Transit</Text>
                        </View>

                        <View className="flex-1 bg-slate-100 rounded-[28px] p-5 border border-slate-200 items-center justify-center">
                            <View className="w-10 h-10 bg-slate-900 rounded-xl items-center justify-center mb-3">
                                <Ionicons name="list" size={20} color="white" />
                            </View>
                            <Text className="text-2xl font-black text-slate-900">{stats?.total || 0}</Text>
                            <Text className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">All Time</Text>
                        </View>
                    </View>
                </View>

                {/* Priority Operations - Section Icon Added */}
                <View className="px-6 mt-10">
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 bg-indigo-50 rounded-lg items-center justify-center mr-2.5">
                            <Ionicons name="flash-outline" size={18} color="#4f46e5" />
                        </View>
                        <Text className="text-slate-900 font-black text-lg">Daily Operations</Text>
                    </View>

                    {/* Process Pending - Improved with Gradient-like feel */}
                    <TouchableOpacity
                        onPress={() => router.push('/Orderadmin/pending')}
                        activeOpacity={0.9}
                        className="bg-indigo-600 rounded-[32px] p-7 mb-4 flex-row items-center justify-between shadow-xl shadow-indigo-200"
                    >
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="hourglass-outline" size={20} color="white" className="mr-2" />
                                <Text className="text-white font-black text-xl ml-2">Process Orders</Text>
                            </View>
                            <Text className="text-white/70 text-sm font-bold mt-1">
                                {stats?.pending || 0} orders awaiting attention
                            </Text>
                        </View>
                        <View className="bg-white/20 w-12 h-12 rounded-full items-center justify-center border border-white/30">
                            <Ionicons name="chevron-forward-outline" size={24} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Operations Grid */}
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => router.push('/Orderadmin/shipped')}
                            activeOpacity={0.7}
                            className="flex-1 bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm shadow-gray-200"
                        >
                            <View className="w-12 h-12 bg-sky-50 rounded-2xl items-center justify-center mb-4 border border-sky-100">
                                <Ionicons name="airplane-outline" size={24} color="#0369a1" />
                            </View>
                            <Text className="text-slate-900 font-black text-base">Shipments</Text>
                            <Text className="text-slate-400 text-xs font-bold mt-1">Order Tracking</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/Orderadmin/orders')}
                            activeOpacity={0.7}
                            className="flex-1 bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm shadow-gray-200"
                        >
                            <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mb-4 border border-slate-100">
                                <Ionicons name="receipt-outline" size={24} color="#334155" />
                            </View>
                            <Text className="text-slate-900 font-black text-base">Full Registry</Text>
                            <Text className="text-slate-400 text-xs font-bold mt-1">Order History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* System Tools - Grid with Icons */}
                <View className="px-6 mt-10">
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 bg-slate-100 rounded-lg items-center justify-center mr-2.5">
                            <Ionicons name="construct-outline" size={18} color="#475569" />
                        </View>
                        <Text className="text-slate-900 font-black text-lg">System Utilities</Text>
                    </View>

                    <View className="bg-white rounded-[32px] p-3 border border-gray-100 shadow-sm shadow-gray-200">
                        <View className="flex-row flex-wrap">
                            {[
                                { id: 'analytics', label: 'Analytics', icon: 'bar-chart', color: '#6366f1', bg: 'bg-indigo-50', route: '/Orderadmin/analytics' },
                                { id: 'export', label: 'Report', icon: 'cloud-download', color: '#0ea5e9', bg: 'bg-sky-50', action: exportOrdersToCSV },
                                { id: 'notifications', label: 'Alerts', icon: 'notifications', color: '#ef4444', bg: 'bg-red-50', route: '/Orderadmin/notifications' },
                                { id: 'settings', label: 'Settings', icon: 'settings', color: '#64748b', bg: 'bg-slate-50', route: '/Orderadmin/settings' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => item.action ? item.action() : router.push(item.route as any)}
                                    activeOpacity={0.6}
                                    className="w-1/2 p-2"
                                >
                                    <View className="bg-gray-50/50 rounded-2xl p-4 flex-row items-center border border-gray-100">
                                        <View className={`w-9 h-9 ${item.bg} rounded-xl items-center justify-center mr-3`}>
                                            <Ionicons name={item.icon as any} size={18} color={item.color} />
                                        </View>
                                        <Text className="text-slate-700 font-black text-[11px] uppercase tracking-wide">{item.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Recent Feed - List with status icons */}
                <View className="px-6 mt-10">
                    <View className="flex-row justify-between items-center mb-5">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-2.5">
                                <Ionicons name="refresh-circle-outline" size={18} color="#2563eb" />
                            </View>
                            <Text className="text-slate-900 font-black text-lg">Recent Feed</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/Orderadmin/orders')}>
                            <Text className="text-blue-600 font-black text-xs uppercase tracking-widest">See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-[32px] p-2 border border-blue-50 shadow-sm shadow-blue-100">
                        {recentOrders.map((order, index) => {
                            const config = getStatusConfig(order.orderStatus);
                            return (
                                <TouchableOpacity
                                    key={order._id}
                                    onPress={() => router.push(`/Orderadmin/order_detail?id=${order._id}`)}
                                    activeOpacity={0.6}
                                    className={`flex-row items-center p-4 ${index !== recentOrders.length - 1 ? 'border-b border-gray-50' : ''}`}
                                >
                                    <View className={`w-12 h-12 ${config.bg} rounded-2xl items-center justify-center mr-4`}>
                                        <Ionicons name={config.icon as any} size={22} color={config.text.replace('text-', '')} />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between mb-0.5">
                                            <Text className="text-slate-900 font-black text-base">#{order.orderNumber}</Text>
                                            <Text className="text-slate-900 font-black text-base">₹{Number(order.totalAmount || 0).toLocaleString()}</Text>
                                        </View>
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <Ionicons name="person-outline" size={10} color="#94a3b8" />
                                                <Text className="text-slate-400 text-[11px] font-bold ml-1">{order.user?.name || 'Customer'}</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <View className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
                                                <Text className={`${config.text} text-[10px] font-black uppercase tracking-tighter`}>{order.orderStatus}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {recentOrders.length === 0 && (
                            <View className="py-12 items-center">
                                <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="infinite-outline" size={32} color="#cbd5e1" />
                                </View>
                                <Text className="text-slate-400 text-sm font-bold">No active history.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Navigation */}
            <OrderAdminNav activeTab="manage" />
        </View>
    );
}
