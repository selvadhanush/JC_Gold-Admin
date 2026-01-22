import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    ActivityIndicator,
    StatusBar,
    Alert,
    TouchableWithoutFeedback,
    PanResponder,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import Skeleton from '../../components/Skeleton';
import { BlurView } from 'expo-blur';
import OrderAdminNav from '../../components/OrderAdminNav';

interface Order {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
    };
    orderStatus: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    orderItems: any[];
}

export default function AllOrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [orderTickets, setOrderTickets] = useState<Record<string, number>>({});

    // Selection State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [batchUpdating, setBatchUpdating] = useState(false);

    // Advanced Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'ALL',
        paymentStatus: 'ALL',
        paymentMethod: 'ALL',
        dateRange: 'ALL' // ALL, TODAY, WEEK
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    // PanResponder for Swipe-to-Dismiss
    const panY = React.useRef(new Animated.Value(0)).current;
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    setShowFilterModal(false);
                    Animated.timing(panY, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (!showFilterModal) {
            panY.setValue(0);
        }
    }, [showFilterModal]);

    useEffect(() => {
        fetchOrders();
        fetchTickets();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, filters, orders]);

    const fetchOrders = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders`, { headers });
            const data = await response.json();

            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            Alert.alert('Error', 'Could not refresh orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/support/admin`, { headers });
            const data = await response.json();

            if (data.success) {
                // Count tickets per order
                const ticketCounts: Record<string, number> = {};
                data.data.forEach((ticket: any) => {
                    if (ticket.order && ticket.order._id && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS')) {
                        const orderId = ticket.order._id;
                        ticketCounts[orderId] = (ticketCounts[orderId] || 0) + 1;
                    }
                });
                setOrderTickets(ticketCounts);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...orders];

        // Status Filter
        if (filters.status !== 'ALL') {
            filtered = filtered.filter(order => order.orderStatus === filters.status);
        }

        // Payment Status Filter
        if (filters.paymentStatus !== 'ALL') {
            filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
        }

        // Payment Method Filter
        if (filters.paymentMethod !== 'ALL') {
            filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
        }

        // Date Range Filter
        if (filters.dateRange !== 'ALL') {
            const now = new Date();
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt);
                if (filters.dateRange === 'TODAY') {
                    return orderDate.toDateString() === now.toDateString();
                }
                if (filters.dateRange === 'WEEK') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= weekAgo;
                }
                return true;
            });
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(query) ||
                order.user.name.toLowerCase().includes(query) ||
                order.user.email.toLowerCase().includes(query)
            );
        }

        setFilteredOrders(filtered);
    };

    const toggleOrderSelection = (id: string) => {
        const newSelection = new Set(selectedOrders);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedOrders(newSelection);
        if (newSelection.size === 0) setSelectionMode(false);
    };

    const handleBulkAction = async (newStatus: string) => {
        if (selectedOrders.size === 0) return;

        Alert.alert(
            'Confirm Bulk Action',
            `Update ${selectedOrders.size} orders to ${newStatus}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update All',
                    onPress: async () => {
                        try {
                            setBatchUpdating(true);
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/orders/bulk-status`, {
                                method: 'PATCH',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderIds: Array.from(selectedOrders),
                                    status: newStatus
                                }),
                            });

                            const data = await response.json();
                            if (data.success) {
                                Alert.alert('Success', `Updated ${data.data.length} orders`);
                                fetchOrders();
                                setSelectedOrders(new Set());
                                setSelectionMode(false);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Bulk update failed');
                        } finally {
                            setBatchUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
        fetchTickets();
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string; icon: string; color: string }> = {
            PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'time-outline', color: '#eab308' },
            CONFIRMED: { bg: 'bg-green-50', text: 'text-green-700', icon: 'checkmark-circle-outline', color: '#22c55e' },
            PACKED: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'cube-outline', color: '#a855f7' },
            SHIPPED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'airplane-outline', color: '#3b82f6' },
            DELIVERED: { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'checkmark-done-circle-outline', color: '#14b8a6' },
            CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', icon: 'close-circle-outline', color: '#ef4444' },
        };
        return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'help-circle-outline', color: '#6b7280' };
    };

    const getPaymentIcon = (method: string) => {
        const icons: Record<string, string> = {
            'CASH': 'cash-outline',
            'CARD': 'card-outline',
            'UPI': 'phone-portrait-outline',
            'NET_BANKING': 'globe-outline',
        };
        return icons[method] || 'wallet-outline';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                    <Skeleton width={120} height={10} className="mb-2" />
                    <Skeleton width={180} height={32} />
                    <Skeleton width="100%" height={48} className="mt-4 rounded-2xl" />
                </View>
                <ScrollView className="flex-1 p-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} width="100%" height={140} className="rounded-[28px] mb-4" />
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <BlurView intensity={80} tint="light" className="border-b border-gray-100">
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="receipt-outline" size={14} color="#9ca3af" />
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest ml-1">Order Management</Text>
                            </View>
                            <Text className="text-2xl font-black text-black">
                                {selectionMode ? `${selectedOrders.size} Selected` : 'ALL ORDERS'}
                            </Text>
                        </View>
                        <View className="flex-row">
                            {selectionMode ? (
                                <TouchableOpacity
                                    onPress={() => { setSelectionMode(false); setSelectedOrders(new Set()); }}
                                    className="bg-gray-100 w-11 h-11 rounded-2xl items-center justify-center mr-2"
                                >
                                    <Ionicons name="close" size={22} color="black" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setShowFilterModal(true)}
                                    className="bg-blue-600 w-11 h-11 rounded-2xl items-center justify-center shadow-lg mr-2"
                                >
                                    <Ionicons name="options-outline" size={20} color="white" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={onRefresh}
                                className="bg-gray-100 w-11 h-11 rounded-2xl items-center justify-center"
                            >
                                <Ionicons name="refresh-outline" size={20} color="#111827" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center border border-gray-100 shadow-sm">
                        <Ionicons name="search-outline" size={20} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-3 text-black font-bold"
                            placeholder="Search orders, customers..."
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

                    {/* Quick Stats */}
                    <View className="flex-row mt-4 gap-2">
                        <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-blue-600 text-xs font-bold uppercase">Total</Text>
                                    <Text className="text-blue-900 text-xl font-black">{filteredOrders.length}</Text>
                                </View>
                                <View className="bg-blue-600 w-10 h-10 rounded-xl items-center justify-center">
                                    <Ionicons name="receipt" size={18} color="white" />
                                </View>
                            </View>
                        </View>
                        <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-green-600 text-xs font-bold uppercase">Active</Text>
                                    <Text className="text-green-900 text-xl font-black">
                                        {filteredOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length}
                                    </Text>
                                </View>
                                <View className="bg-green-600 w-10 h-10 rounded-xl items-center justify-center">
                                    <Ionicons name="trending-up" size={18} color="white" />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </BlurView>

            {/* Orders List */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="p-6">
                    {filteredOrders.length === 0 ? (
                        <View className="bg-white rounded-[32px] p-10 items-center mt-10">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="search-outline" size={40} color="#9ca3af" />
                            </View>
                            <Text className="text-gray-900 font-black text-xl mb-2">No Orders Found</Text>
                            <Text className="text-gray-500 text-center">
                                {searchQuery || filters.status !== 'ALL' ? 'Try adjusting your filters' : 'No orders available'}
                            </Text>
                        </View>
                    ) : (
                        filteredOrders.map((order) => {
                            const isSelected = selectedOrders.has(order._id);
                            const statusStyle = getStatusColor(order.orderStatus);

                            return (
                                <TouchableOpacity
                                    key={order._id}
                                    onLongPress={() => { setSelectionMode(true); toggleOrderSelection(order._id); }}
                                    onPress={() => selectionMode ? toggleOrderSelection(order._id) : router.push(`/Orderadmin/order_detail?id=${order._id}`)}
                                    className={`bg-white rounded-[28px] p-5 mb-4 border-2 shadow-lg ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100'}`}
                                >
                                    {/* Header Row */}
                                    <View className="flex-row justify-between items-start mb-4">
                                        <View className="flex-row items-center flex-1">
                                            {selectionMode && (
                                                <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                    {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                                </View>
                                            )}
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <Ionicons name="document-text-outline" size={14} color="#6b7280" />
                                                    <Text className="text-black font-black text-lg ml-1">#{order.orderNumber}</Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Ionicons name="calendar-outline" size={10} color="#9ca3af" />
                                                    <Text className="text-gray-400 text-[10px] font-bold ml-1">{formatDate(order.createdAt)}</Text>
                                                    <Ionicons name="time-outline" size={10} color="#9ca3af" className="ml-2" />
                                                    <Text className="text-gray-400 text-[10px] font-bold ml-1">{formatTime(order.createdAt)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View className={`${statusStyle.bg} px-3 py-2 rounded-full border ${statusStyle.bg.replace('50', '100')}`}>
                                            <View className="flex-row items-center">
                                                <Ionicons name={statusStyle.icon as any} size={12} color={statusStyle.color} />
                                                <Text className={`${statusStyle.text} text-[10px] font-black uppercase ml-1`}>{order.orderStatus}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Customer Info */}
                                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                                        <View className="flex-row items-center mb-2">
                                            <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-2">
                                                <Ionicons name="person-outline" size={14} color="#2563eb" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-900 font-bold text-sm">{order.user.name}</Text>
                                                <View className="flex-row items-center mt-0.5">
                                                    <Ionicons name="mail-outline" size={10} color="#6b7280" />
                                                    <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{order.user.email}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Payment & Amount Row */}
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className="flex-row items-center">
                                            <View className="bg-purple-100 w-8 h-8 rounded-full items-center justify-center mr-2">
                                                <Ionicons name={getPaymentIcon(order.paymentMethod) as any} size={14} color="#a855f7" />
                                            </View>
                                            <View>
                                                <Text className="text-gray-900 font-bold text-xs">{order.paymentMethod}</Text>
                                                <Text className={`text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {order.paymentStatus}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="bg-blue-600 px-4 py-2 rounded-xl">
                                            <View className="flex-row items-center">
                                                <Ionicons name="cash-outline" size={14} color="white" />
                                                <Text className="text-white font-black text-base ml-1">₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Items Count */}
                                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl">
                                        <Ionicons name="cube-outline" size={14} color="#6b7280" />
                                        <Text className="text-gray-600 font-bold text-xs ml-2">
                                            {order.orderItems.length} Item{order.orderItems.length > 1 ? 's' : ''}
                                        </Text>
                                    </View>

                                    {/* Support Ticket Indicator */}
                                    {orderTickets[order._id] && orderTickets[order._id] > 0 && (
                                        <View className="mt-3 pt-3 border-t border-gray-100">
                                            <View className="flex-row items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                                                <View className="bg-amber-500 w-6 h-6 rounded-full items-center justify-center mr-2">
                                                    <Ionicons name="chatbubble-ellipses" size={12} color="white" />
                                                </View>
                                                <Text className="text-amber-700 font-black text-xs flex-1">
                                                    {orderTickets[order._id]} Support Ticket{orderTickets[order._id] > 1 ? 's' : ''} Raised
                                                </Text>
                                                <Ionicons name="chevron-forward" size={14} color="#f59e0b" />
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
                <View className="h-40" />
            </ScrollView>

            {/* Advanced Bulk Action Bar */}
            {selectionMode && (
                <View className="absolute bottom-28 left-6 right-6">
                    <BlurView intensity={100} tint="dark" className="rounded-[32px] overflow-hidden p-6 shadow-2xl">
                        <View className="flex-row items-center justify-center mb-4">
                            <Ionicons name="flash-outline" size={16} color="white" />
                            <Text className="text-white font-black text-center uppercase tracking-widest text-xs ml-2">Bulk Update Status</Text>
                        </View>
                        <View className="flex-row justify-between gap-2">
                            {['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => handleBulkAction(status)}
                                    disabled={batchUpdating}
                                    className="bg-white/10 p-3 rounded-2xl flex-1 items-center border border-white/20"
                                >
                                    <Ionicons
                                        name={status === 'CONFIRMED' ? 'checkmark-circle' : status === 'PACKED' ? 'cube' : status === 'SHIPPED' ? 'airplane' : 'checkmark-done'}
                                        size={20}
                                        color="white"
                                    />
                                    <Text className="text-white text-[8px] font-black mt-1">{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </BlurView>
                </View>
            )}

            {/* Advanced Filter Modal */}
            <Modal visible={showFilterModal} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
                    <View className="flex-1">
                        <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
                            <TouchableWithoutFeedback>
                                <Animated.View
                                    style={{ transform: [{ translateY: panY }] }}
                                    className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl"
                                >
                                    {/* Modal Handle & Swipe Area */}
                                    <View {...panResponder.panHandlers} className="py-2">
                                        <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
                                    </View>

                                    <View className="flex-row justify-between items-center mb-8">
                                        <View className="flex-row items-center">
                                            <Ionicons name="options-outline" size={24} color="#111827" />
                                            <Text className="text-black font-black text-2xl ml-2">Refine Orders</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setFilters({ status: 'ALL', paymentStatus: 'ALL', paymentMethod: 'ALL', dateRange: 'ALL' })}>
                                            <View className="flex-row items-center bg-gray-100 px-3 py-2 rounded-xl">
                                                <Ionicons name="refresh-outline" size={14} color="#6b7280" />
                                                <Text className="text-gray-700 font-bold text-xs ml-1">Reset</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row items-center mb-4">
                                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                        <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-2">Date Range</Text>
                                    </View>
                                    <View className="flex-row gap-3 mb-8">
                                        {['ALL', 'TODAY', 'WEEK'].map(range => (
                                            <TouchableOpacity
                                                key={range}
                                                onPress={() => setFilters({ ...filters, dateRange: range })}
                                                className={`px-4 py-2.5 rounded-xl border-2 ${filters.dateRange === range ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-100'}`}
                                            >
                                                <Text className={`font-bold text-xs ${filters.dateRange === range ? 'text-white' : 'text-gray-600'}`}>{range}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View className="flex-row items-center mb-4">
                                        <Ionicons name="flag-outline" size={14} color="#6b7280" />
                                        <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest ml-2">Order Status</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                                        {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => setFilters({ ...filters, status })}
                                                className={`px-4 py-2.5 rounded-xl border-2 mr-2 ${filters.status === status ? 'bg-black border-black' : 'bg-white border-gray-100'}`}
                                            >
                                                <Text className={`font-bold text-xs ${filters.status === status ? 'text-white' : 'text-gray-600'}`}>{status}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <TouchableOpacity
                                        onPress={() => setShowFilterModal(false)}
                                        className="bg-blue-600 p-5 rounded-2xl items-center shadow-lg flex-row justify-center"
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                        <Text className="text-white font-black text-lg ml-2">Apply Filters</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </BlurView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Floating Bottom Navigation */}
            <OrderAdminNav activeTab="orders" />
        </View>
    );
}
