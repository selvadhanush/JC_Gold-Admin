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
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';
import * as SecureStore from 'expo-secure-store';
import { Skeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');

interface DashboardStats {
    admins: { active: number; suspended: number };
    buyers: { active: number; blocked: number };
    today: { orders: number; revenue: number };
    month: { orders: number; revenue: number };
    lowStock: number;
    failures: number;
    systemStatus: string;
}

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [openTickets, setOpenTickets] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        fetchDashboardData();
        loadUserData();
        fetchOpenTickets();
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
            const response = await fetch(API_ENDPOINTS.SUPER_STATS, { headers });

            if (!response.ok) throw new Error(`Server returned ${response.status}`);

            const result = await response.json();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Dashboard Fetch Failure:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchOpenTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_ADMIN, { headers });
            const data = await response.json();
            if (data.success) {
                const openCount = data.data.filter((t: any) => t.status === 'open' || t.status === 'in-progress').length;
                setOpenTickets(openCount);
            }
        } catch (error) {
            console.error('Failed to fetch ticket count');
        }
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

    const getSystemHealth = () => {
        const failures = stats?.failures || 0;
        const status = stats?.systemStatus || 'OK';

        if (status === 'MAINTENANCE') return { label: 'Maintenance', color: '#f59e0b', bg: 'bg-amber-50', icon: 'construct' };
        if (failures > 5) return { label: 'Critical Issues', color: '#dc2626', bg: 'bg-red-50', icon: 'alert-circle' };
        if (failures > 0) return { label: 'System Warnings', color: '#ea580c', bg: 'bg-orange-50', icon: 'warning' };
        return { label: 'Operations Stable', color: '#16a34a', bg: 'bg-green-50', icon: 'shield-checkmark' };
    };

    const health = getSystemHealth();

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" />

                {/* Header Skeleton */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                        <Skeleton width={220} height={28} />
                    </View>
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                    {/* Hero Card Skeleton */}
                    <View style={{ backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', padding: 24, marginBottom: 24 }}>
                        <Skeleton width={100} height={20} borderRadius={10} style={{ marginBottom: 16 }} />
                        <Skeleton width="60%" height={32} style={{ marginBottom: 8 }} />
                        <Skeleton width="40%" height={16} style={{ marginBottom: 32 }} />

                        <View className="flex-row">
                            <View className="flex-1">
                                <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                                <Skeleton width={100} height={32} />
                            </View>
                            <View style={{ width: 1, height: 48, backgroundColor: '#f3f4f6', marginHorizontal: 24 }} />
                            <View className="flex-1">
                                <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                                <Skeleton width={100} height={32} />
                            </View>
                        </View>
                    </View>

                    {/* Health Widget Skeleton */}
                    <View style={{ backgroundColor: '#f9fafb', borderRadius: 28, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}>
                        <Skeleton width={56} height={56} borderRadius={16} style={{ marginRight: 16 }} />
                        <View className="flex-1">
                            <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
                            <Skeleton width="50%" height={14} />
                        </View>
                        <Skeleton width={40} height={40} borderRadius={20} />
                    </View>

                    <Skeleton width={150} height={24} style={{ marginBottom: 16, marginLeft: 4 }} />
                    <View className="flex-row justify-between mb-8">
                        <Skeleton width="47%" height={160} borderRadius={32} />
                        <Skeleton width="47%" height={160} borderRadius={32} />
                    </View>

                    <Skeleton width={150} height={24} style={{ marginBottom: 16, marginLeft: 4 }} />
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 32, padding: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' }}>
                            <Skeleton width={56} height={56} borderRadius={16} />
                            <View className="flex-1 ml-5">
                                <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
                                <Skeleton width="40%" height={12} />
                            </View>
                            <Skeleton width={32} height={32} borderRadius={16} />
                        </View>
                    ))}
                </ScrollView>
            </View>
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
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <View className="flex-row items-center">
                            <Ionicons name="terminal" size={14} color="#ea580c" className="mr-2" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                        </View>
                        <Text className="text-2xl font-black text-black">COMMAND CENTER</Text>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => setShowProfileMenu(true)}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500 overflow-hidden"
                        >
                            <View className="bg-indigo-50 w-full h-full items-center justify-center">
                                <Ionicons name="person" size={20} color="#4f46e5" />
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
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Internal Access</Text>
                                <Text className="text-black font-black text-xs" numberOfLines={1}>{userData?.email || 'master@jcgold.com'}</Text>
                                <Text className="text-orange-600 text-[10px] font-bold uppercase mt-1">Super Administrator</Text>
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
                                <Text className="text-red-600 font-black text-xs uppercase tracking-tight">Revoke Access</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
                    {/* Alerts Section */}
                    {openTickets > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/Superadmin/manage_users', params: { section: 'tickets' } } as any)}
                            className="mx-6 mt-6 mb-2 bg-red-500 rounded-2xl p-4 flex-row items-center shadow-lg shadow-red-500/30"
                        >
                            <View className="bg-white/20 w-10 h-10 rounded-xl items-center justify-center mr-3">
                                <Ionicons name="notifications" size={20} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-black text-sm">Action Required</Text>
                                <Text className="text-white/90 text-xs font-medium">{openTickets} New Support Ticket{openTickets > 1 ? 's' : ''} Raised</Text>
                            </View>
                            <View className="bg-white px-3 py-1.5 rounded-lg flex-row items-center">
                                <Text className="text-red-500 text-[10px] font-black uppercase">View</Text>
                                <Ionicons name="arrow-forward" size={12} color="#ef4444" style={{ marginLeft: 4 }} />
                            </View>
                        </TouchableOpacity>
                    )}
                    {/* Hero Performance Card */}
                    <View className="p-6">
                        <View className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm relative overflow-hidden">
                            <View className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full" />

                            <View className="flex-row justify-between items-start mb-8">
                                <View>
                                    <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 mb-2 self-start flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-orange-600 mr-2" />
                                        <Text className="text-orange-600 text-[10px] font-black uppercase tracking-tighter">Live Business</Text>
                                    </View>
                                    <Text className="text-black text-3xl font-black">Performance</Text>
                                    <Text className="text-gray-400 text-sm font-medium">Daily Revenue Insights</Text>
                                </View>
                                <View className="bg-gray-50 p-3 rounded-2xl rotate-12">
                                    <Ionicons name="stats-chart" size={24} color="#ea580c" />
                                </View>
                            </View>

                            <View className="flex-row">
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Today</Text>
                                    <Text className="text-black text-3xl font-black">{formatCurrency(stats?.today?.revenue || 0)}</Text>
                                    <Text className="text-gray-400 text-[10px] font-black mt-1 uppercase">{stats?.today?.orders || 0} Orders</Text>
                                </View>
                                <View className="w-[1px] h-12 bg-gray-100 mx-6 self-center" />
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Monthly</Text>
                                    <Text className="text-black text-3xl font-black">{formatCurrency(stats?.month?.revenue || 0)}</Text>
                                    <Text className="text-gray-400 text-[10px] font-black mt-1 uppercase">{stats?.month?.orders || 0} Orders</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* System Health Widget */}
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/Superadmin/system_settings')}
                            className="bg-gray-50 rounded-[28px] p-5 flex-row items-center border border-gray-100"
                        >
                            <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: health.color + '10' }}>
                                <Ionicons name={health.icon as any} size={28} color={health.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-black text-lg">System Integrity</Text>
                                <Text className="text-gray-500 text-sm font-medium">{health.label}</Text>
                            </View>
                            <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm">
                                <Ionicons name="chevron-forward" size={18} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Admin/User Stats Grid */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Administration</Text>
                        <View className="flex-row justify-between">
                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/manage_admins')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-orange-600 w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-orange-600/30">
                                    <Ionicons name="id-card" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Admins</Text>
                                <Text className="text-orange-600 text-xl font-black">{stats?.admins?.active || 0}</Text>
                                <Text className="text-gray-400 text-[10px] font-bold uppercase">Active Nodes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/manage_users')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4 shadow-sm"
                                style={{ width: (width - 60) / 2 }}
                            >
                                <View className="bg-black w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-black/20">
                                    <Ionicons name="people-circle" size={24} color="white" />
                                </View>
                                <Text className="text-black font-black text-base">Buyers</Text>
                                <Text className="text-gray-900 text-xl font-black">{stats?.buyers?.active || 0}</Text>
                                <Text className="text-gray-400 text-[10px] font-bold uppercase">Registered</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Management Actions */}
                    <View className="px-6 mb-8">
                        <Text className="text-black font-black text-xl mb-4 ml-1">Operations</Text>
                        <View className="space-y-4">
                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/audit_logs')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-orange-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="finger-print" size={28} color="#ea580c" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Audit Logs</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Trace all system activity</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/digital_gold_view')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-yellow-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="albums" size={28} color="#eab308" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Digital Gold Vault</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Daily rates & global approvals</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/cms_control')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-orange-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="megaphone" size={28} color="#ea580c" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">CMS Control</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Manage app content</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/Superadmin/reports')}
                                className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-row items-center"
                            >
                                <View className="bg-white border border-indigo-100 w-14 h-14 rounded-2xl items-center justify-center shadow-inner">
                                    <Ionicons name="bar-chart" size={28} color="#4f46e5" />
                                </View>
                                <View className="ml-5 flex-1">
                                    <Text className="text-black font-black text-lg">Insights Hub</Text>
                                    <Text className="text-gray-500 text-xs font-medium">Generate analytical reports</Text>
                                </View>
                                <Ionicons name="arrow-forward-circle" size={32} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* Bottom Padding */}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
