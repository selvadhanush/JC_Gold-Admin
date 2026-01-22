import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Animated,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Ticket {
    _id: string;
    subject: string;
    category: string;
    status: string;
    message: string;
    adminResponse?: string;
    respondedAt?: string;
    createdAt: string;
    order?: {
        _id: string;
        orderNumber: string;
        totalAmount: number;
        orderItems: any[];
    };
    user?: {
        name: string;
        email: string;
    };
}

export default function AllTicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (!loading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [loading]);

    useEffect(() => {
        filterTickets();
    }, [searchQuery, statusFilter, categoryFilter, tickets]);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/support/admin`, { headers });
            const data = await response.json();

            if (data.success) {
                setTickets(data.data || []);
            }
        } catch (error) {
            console.error('Fetch Tickets Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterTickets = () => {
        let filtered = [...tickets];

        // Status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.subject.toLowerCase().includes(query) ||
                t.order?.orderNumber.toLowerCase().includes(query) ||
                t.user?.name.toLowerCase().includes(query) ||
                t.user?.email.toLowerCase().includes(query)
            );
        }

        setFilteredTickets(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            OPEN: { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', icon: 'alert-circle' },
            IN_PROGRESS: { color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', icon: 'time' },
            RESOLVED: { color: '#14b8a6', bg: 'bg-teal-50', text: 'text-teal-600', icon: 'checkmark-done-circle' },
            CLOSED: { color: '#6b7280', bg: 'bg-gray-50', text: 'text-gray-600', icon: 'close-circle' },
        };
        return configs[status] || configs.OPEN;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, any> = {
            PRODUCT: 'cube-outline',
            PAYMENT: 'card-outline',
            GENERAL: 'help-circle-outline',
        };
        return icons[category] || 'help-circle-outline';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="text-gray-500 mt-4 font-medium">Loading tickets...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-11 h-11 items-center justify-center rounded-2xl bg-gray-50"
                    >
                        <Ionicons name="arrow-back" size={22} color="#111827" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <View className="flex-row items-center">
                            <Ionicons name="headset-outline" size={18} color="#6b7280" />
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Support</Text>
                        </View>
                        <Text className="text-lg font-black text-black">All Tickets</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        className="w-11 h-11 items-center justify-center rounded-2xl bg-blue-50"
                    >
                        <Ionicons name="refresh" size={20} color="#2563eb" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="bg-gray-50 rounded-2xl px-4 py-3 flex-row items-center mb-4">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 font-medium"
                        placeholder="Search tickets, orders, customers..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Filter Section */}
                <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="flag-outline" size={14} color="#6b7280" />
                        <Text className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { value: 'ALL', label: 'All', icon: 'apps' },
                            { value: 'OPEN', label: 'Open', icon: 'alert-circle' },
                            { value: 'IN_PROGRESS', label: 'In Progress', icon: 'time' },
                            { value: 'RESOLVED', label: 'Resolved', icon: 'checkmark-done-circle' },
                            { value: 'CLOSED', label: 'Closed', icon: 'close-circle' },
                        ].map((status) => (
                            <TouchableOpacity
                                key={status.value}
                                onPress={() => setStatusFilter(status.value)}
                                className={`mr-2 px-4 py-2.5 rounded-full flex-row items-center ${statusFilter === status.value ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
                            >
                                <Ionicons
                                    name={status.icon as any}
                                    size={14}
                                    color={statusFilter === status.value ? '#ffffff' : '#6b7280'}
                                />
                                <Text className={`text-xs font-black uppercase ml-1.5 ${statusFilter === status.value ? 'text-white' : 'text-gray-600'}`}>
                                    {status.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Category Filter Section */}
                <View>
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="grid-outline" size={14} color="#6b7280" />
                        <Text className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { value: 'ALL', label: 'All', icon: 'apps' },
                            { value: 'PRODUCT', label: 'Product', icon: 'cube-outline' },
                            { value: 'PAYMENT', label: 'Payment', icon: 'card-outline' },
                            { value: 'GENERAL', label: 'General', icon: 'help-circle-outline' },
                        ].map((category) => (
                            <TouchableOpacity
                                key={category.value}
                                onPress={() => setCategoryFilter(category.value)}
                                className={`mr-2 px-4 py-2.5 rounded-full flex-row items-center ${categoryFilter === category.value ? 'bg-purple-600' : 'bg-white border border-gray-200'}`}
                            >
                                <Ionicons
                                    name={category.icon as any}
                                    size={14}
                                    color={categoryFilter === category.value ? '#ffffff' : '#6b7280'}
                                />
                                <Text className={`text-xs font-black uppercase ml-1.5 ${categoryFilter === category.value ? 'text-white' : 'text-gray-600'}`}>
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Tickets List */}
            <Animated.ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                style={{ opacity: fadeAnim }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
            >
                <View className="py-4">
                    {/* Results Count */}
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="receipt-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-500 text-sm font-medium ml-2">
                            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
                        </Text>
                    </View>

                    {filteredTickets.length === 0 ? (
                        <View className="bg-white rounded-[32px] p-10 items-center mt-10">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="search" size={40} color="#9ca3af" />
                            </View>
                            <Text className="text-gray-900 font-black text-xl mb-2">No Tickets Found</Text>
                            <Text className="text-gray-500 text-center">
                                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                                    ? 'Try adjusting your filters or search query'
                                    : 'No support tickets available'}
                            </Text>
                        </View>
                    ) : (
                        filteredTickets.map((ticket, index) => {
                            const statusConfig = getStatusConfig(ticket.status);
                            return (
                                <TouchableOpacity
                                    key={ticket._id}
                                    onPress={() => router.push(`/Orderadmin/order_detail?id=${ticket.order?._id}`)}
                                    activeOpacity={0.7}
                                    className={`bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm ${index !== 0 ? 'mt-4' : ''}`}
                                >
                                    {/* Header */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className={`w-10 h-10 rounded-2xl items-center justify-center`} style={{ backgroundColor: statusConfig.color + '20' }}>
                                            <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
                                        </View>
                                        <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                                            <Text className={`text-[9px] font-black uppercase ${statusConfig.text}`}>{ticket.status.replace('_', ' ')}</Text>
                                        </View>
                                    </View>

                                    {/* Ticket Info */}
                                    <View className="flex-row items-start mb-3">
                                        <Ionicons name={getCategoryIcon(ticket.category)} size={16} color="#6b7280" />
                                        <View className="flex-1 ml-2">
                                            <Text className="text-black font-black text-base mb-1" numberOfLines={1}>{ticket.subject}</Text>
                                            <Text className="text-gray-500 text-xs font-medium">{ticket.category} Issue</Text>
                                        </View>
                                    </View>

                                    {/* Customer Info */}
                                    {ticket.user && (
                                        <View className="bg-gray-50 rounded-xl p-3 mb-3">
                                            <View className="flex-row items-center mb-1">
                                                <Ionicons name="person-outline" size={12} color="#9ca3af" />
                                                <Text className="text-gray-400 text-[9px] font-bold uppercase ml-1">Customer</Text>
                                            </View>
                                            <Text className="text-gray-900 font-bold text-sm">{ticket.user.name}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Ionicons name="mail-outline" size={10} color="#6b7280" />
                                                <Text className="text-gray-600 text-xs ml-1">{ticket.user.email}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Product Information */}
                                    {ticket.order && ticket.order.orderItems && ticket.order.orderItems.length > 0 && (
                                        <View className="bg-purple-50 rounded-xl p-3 mb-3">
                                            <View className="flex-row items-center mb-1">
                                                <Ionicons name="cube-outline" size={12} color="#a855f7" />
                                                <Text className="text-purple-400 text-[9px] font-bold uppercase ml-1">Product(s)</Text>
                                            </View>
                                            <Text className="text-purple-900 font-bold text-sm" numberOfLines={2}>
                                                {ticket.order.orderItems.map((item: any) => item.product?.name || 'Product').join(', ')}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Order Details */}
                                    {ticket.order && (
                                        <View className="bg-gray-50 rounded-xl p-3 flex-row items-center justify-between mb-3">
                                            <View className="flex-row items-center flex-1">
                                                <Ionicons name="receipt-outline" size={12} color="#9ca3af" />
                                                <View className="ml-2">
                                                    <Text className="text-gray-400 text-[9px] font-bold uppercase">Order</Text>
                                                    <Text className="text-gray-900 font-bold text-sm">#{ticket.order.orderNumber}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Ionicons name="cash-outline" size={14} color="#2563eb" />
                                                <Text className="text-blue-600 font-black text-sm ml-1">₹{ticket.order.totalAmount?.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Admin Response */}
                                    {ticket.adminResponse && (
                                        <View className="bg-green-50 rounded-xl p-3 border border-green-100 mb-3">
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="chatbubble-ellipses" size={12} color="#059669" />
                                                <Text className="text-green-700 text-[9px] font-bold uppercase ml-1">Admin Reply</Text>
                                            </View>
                                            <Text className="text-green-900 text-xs font-medium leading-relaxed" numberOfLines={3}>
                                                {ticket.adminResponse}
                                            </Text>
                                            {ticket.respondedAt && (
                                                <View className="flex-row items-center mt-2">
                                                    <Ionicons name="calendar-outline" size={10} color="#059669" />
                                                    <Text className="text-green-600 text-[9px] font-bold ml-1">
                                                        {formatDate(ticket.respondedAt)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Timestamp */}
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={12} color="#9ca3af" />
                                        <Text className="text-gray-400 text-xs font-medium ml-1">
                                            Created {formatDate(ticket.createdAt)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View className="h-20" />
            </Animated.ScrollView>
        </View>
    );
}
