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
                <View className="bg-white px-8 pt-16 pb-10 border-b border-slate-100/50">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <View className="flex-row items-center mb-2">
                                <View className="w-6 h-[1.5px] bg-blue-600 mr-2" />
                                <Text className="text-blue-600 text-[10px] font-black uppercase tracking-[2px]">Operations Center</Text>
                            </View>
                            <Text className="text-4xl font-black text-slate-900 tracking-tight">Management</Text>
                        </View>
                        <View className="w-16 h-16" />
                    </View>
                </View>

                {/* Pipeline Performance */}
                <View className="px-6 mt-10">
                    <View className="flex-row items-center mb-6 pl-2">
                        <Ionicons name="analytics" size={18} color="#64748b" />
                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] ml-2">Pipeline Performance</Text>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm items-center">
                            <Text className="text-3xl font-black text-slate-900 mb-1">{stats?.pending || 0}</Text>
                            <Text className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Pending</Text>
                        </View>

                        <View className="flex-1 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm items-center">
                            <Text className="text-3xl font-black text-slate-900 mb-1">{stats?.shipped || 0}</Text>
                            <Text className="text-[9px] text-blue-500 font-black uppercase tracking-widest">In Transit</Text>
                        </View>

                        <View className="flex-1 bg-slate-900 rounded-[32px] p-6 items-center">
                            <Text className="text-3xl font-black text-white mb-1">{stats?.total || 0}</Text>
                            <Text className="text-[9px] text-white/50 font-black uppercase tracking-widest">Total</Text>
                        </View>
                    </View>
                </View>

                {/* Main Operations */}
                <View className="px-6 mt-12">
                    <View className="flex-row items-center mb-6 pl-2">
                        <Ionicons name="flash" size={18} color="#64748b" />
                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] ml-2">Direct Actions</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/Orderadmin/pending')}
                        activeOpacity={0.9}
                        className="bg-blue-600 rounded-[40px] p-8 mb-6 flex-row items-center justify-between shadow-2xl shadow-blue-200"
                    >
                        <View className="flex-1 pr-4">
                            <Text className="text-white font-black text-2xl tracking-tight">Process Orders</Text>
                            <Text className="text-white/70 text-xs font-bold mt-2">
                                {stats?.pending || 0} batches awaiting priority verification
                            </Text>
                        </View>
                        <View className="bg-white/20 w-14 h-14 rounded-full items-center justify-center border border-white/30">
                            <Ionicons name="arrow-forward" size={24} color="white" />
                        </View>
                    </TouchableOpacity>

                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => router.push('/Orderadmin/shipped')}
                            activeOpacity={0.8}
                            className="flex-1 bg-white border border-slate-100 rounded-[36px] p-8 shadow-sm"
                        >
                            <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-6">
                                <Ionicons name="airplane-outline" size={26} color="#2563eb" />
                            </View>
                            <Text className="text-slate-900 font-black text-lg underline decoration-blue-200 underline-offset-4">Shipments</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase mt-2">Tracking ID</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/Orderadmin/orders')}
                            activeOpacity={0.8}
                            className="flex-1 bg-white border border-slate-100 rounded-[36px] p-8 shadow-sm"
                        >
                            <View className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center mb-6">
                                <Ionicons name="receipt-outline" size={26} color="#0f172a" />
                            </View>
                            <Text className="text-slate-900 font-black text-lg underline decoration-slate-200 underline-offset-4">Registry</Text>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase mt-2">Full History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* System Utilities */}
                <View className="px-6 mt-12 pb-32">
                    <View className="flex-row items-center mb-6 pl-2">
                        <Ionicons name="construct" size={18} color="#64748b" />
                        <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] ml-2">System Resources</Text>
                    </View>

                    <View className="bg-slate-50 rounded-[40px] p-4 border border-slate-100">
                        <View className="flex-row flex-wrap">
                            {[
                                { id: 'analytics', label: 'Analytics', icon: 'bar-chart', color: '#6366f1', route: '/Orderadmin/analytics' },
                                { id: 'export', label: 'Exporters', icon: 'cloud-download', color: '#0ea5e9', action: exportOrdersToCSV },
                                { id: 'notifications', label: 'Broadcast', icon: 'notifications', color: '#ef4444', route: '/Orderadmin/notifications' },
                                { id: 'settings', label: 'Settings', icon: 'settings', color: '#64748b', route: '/Orderadmin/settings' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => item.action ? item.action() : router.push(item.route as any)}
                                    activeOpacity={0.6}
                                    className="w-1/2 p-3"
                                >
                                    <View className="bg-white rounded-[28px] p-5 items-center border border-slate-100 shadow-sm">
                                        <View className="w-10 h-10 items-center justify-center mb-3">
                                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                                        </View>
                                        <Text className="text-slate-800 font-black text-[10px] uppercase tracking-widest">{item.label}</Text>
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
