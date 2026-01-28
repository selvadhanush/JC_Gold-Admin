import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';

const { width } = Dimensions.get('window');

interface Order {
    _id: string;
    orderNumber: string;
    orderItems: Array<{
        product: {
            _id: string;
            name: string;
            images: string[];
            price: number;
        };
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    orderStatus: string;
    isFinanceConfirmed: boolean;
    createdAt: string;
}

type FilterStatus = 'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function Orders() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('ALL');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_ORDERS, { headers });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED': return { bg: 'bg-green-50', text: 'text-green-600', icon: 'checkmark-circle' };
            case 'CANCELLED': return { bg: 'bg-red-50', text: 'text-red-600', icon: 'close-circle' };
            case 'SHIPPED': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'airplane' };
            default: return { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'time' };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // Filter orders based on selected filter
    const filteredOrders = orders.filter(order => {
        if (selectedFilter === 'ALL') return true;
        return order.orderStatus?.toUpperCase() === selectedFilter;
    });

    const filterOptions: { label: string; value: FilterStatus; icon: string; color: string }[] = [
        { label: 'All Orders', value: 'ALL', icon: 'list', color: '#6b7280' },
        { label: 'Pending', value: 'PENDING', icon: 'time', color: '#f97316' },
        { label: 'Shipped', value: 'SHIPPED', icon: 'airplane', color: '#3b82f6' },
        { label: 'Delivered', value: 'DELIVERED', icon: 'checkmark-circle', color: '#10b981' },
        { label: 'Cancelled', value: 'CANCELLED', icon: 'close-circle', color: '#ef4444' },
    ];

    const applyFilter = (filter: FilterStatus) => {
        setSelectedFilter(filter);
        setShowFilterModal(false);
    };

    const renderOrderCard = ({ item }: { item: Order }) => {
        const style = getStatusStyle(item.orderStatus);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/order_detail?id=${item._id}`)}
                className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100 shadow-sm"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Receipt ID</Text>
                        <Text className="text-gray-900 font-black">#{item.orderNumber}</Text>
                    </View>
                    <View className={`${style.bg} px-4 py-2 rounded-2xl flex-row items-center border border-white/50 shadow-sm`}>
                        <Ionicons name={style.icon as any} size={14} color={style.text.replace('text-', '#')} />
                        <Text className={`ml-2 text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                            {item.orderStatus === 'PENDING' && !item.isFinanceConfirmed ? 'Processing By Finance' : (item.orderStatus || 'PENDING')}
                        </Text>
                    </View>
                </View>

                {/* Products Preview */}
                <View className="flex-row items-center mb-6">
                    <View className="flex-row">
                        {item.orderItems.slice(0, 3).map((oi, idx) => (
                            <View key={idx} className={`w-14 h-14 rounded-2xl bg-gray-50 border-2 border-white shadow-sm overflow-hidden ${idx > 0 ? '-ml-4' : ''}`}>
                                <Image source={{ uri: oi.product?.images?.[0] }} className="w-full h-full" resizeMode="cover" />
                            </View>
                        ))}
                        {item.orderItems.length > 3 && (
                            <View className="w-14 h-14 rounded-2xl bg-gray-900 border-2 border-white items-center justify-center -ml-4">
                                <Text className="text-white text-[10px] font-bold">+{item.orderItems.length - 3}</Text>
                            </View>
                        )}
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>
                            {item.orderItems[0]?.product?.name} {item.orderItems[0]?.quantity > 1 ? `(x${item.orderItems[0].quantity})` : ''} {item.orderItems.length > 1 ? `& ${item.orderItems.length - 1} more` : ''}
                        </Text>
                        <Text className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-tighter">{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-50 mb-6" />

                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Valuation</Text>
                        <Text className="text-2xl font-black text-primary-600">₹{item.totalAmount.toLocaleString()}</Text>
                    </View>
                    <View className="bg-gray-50 w-12 h-12 rounded-2xl items-center justify-center border border-gray-100">
                        <Ionicons name="chevron-forward" size={20} color="#111827" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSkeleton = () => (
        <View className="px-6 py-4">
            {[1, 2].map(i => (
                <View key={i} className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100">
                    <View className="flex-row justify-between mb-8">
                        <View><Skeleton width={100} height={15} /></View>
                        <Skeleton width={80} height={30} style={{ borderRadius: 16 }} />
                    </View>
                    <View className="flex-row items-center mb-8">
                        <View className="flex-row">
                            <Skeleton width={56} height={56} style={{ borderRadius: 16 }} />
                            <Skeleton width={56} height={56} style={{ borderRadius: 16, marginLeft: -16 }} />
                        </View>
                        <View className="ml-4 flex-1">
                            <Skeleton width="70%" height={16} className="mb-2" />
                            <Skeleton width="30%" height={10} />
                        </View>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Skeleton width={60} height={10} className="mb-2" />
                            <Skeleton width={120} height={30} />
                        </View>
                        <Skeleton width={48} height={48} style={{ borderRadius: 16 }} />
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-2">Shopping History</Text>
                    <Text className="text-3xl font-black text-gray-900">Your Portfolio</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowFilterModal(true)}
                    className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
                >
                    <Ionicons name="filter-outline" size={20} color="#111827" />
                    {selectedFilter !== 'ALL' && (
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[8px] font-black">1</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={filteredOrders}

                    renderItem={renderOrderCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders()} colors={['#f97316']} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <View className="w-40 h-40 bg-gray-50 rounded-full items-center justify-center mb-8 border border-gray-100">
                                <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
                            </View>
                            <Text className="text-gray-900 text-xl font-black mb-2 text-center">Empty Collection</Text>
                            <Text className="text-gray-400 text-center font-medium leading-6 mb-10">You haven't added any masterpieces to your portfolio yet.</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/buyer_dashboard')}
                                className="bg-primary-600 px-10 py-5 rounded-[28px] shadow-xl shadow-primary-500/30"
                            >
                                <Text className="text-white font-black uppercase tracking-widest text-xs">Start Collecting</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <BottomNav activeTab="orders" />

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                    className="flex-1 bg-black/50 justify-end"
                >
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                        <View className="bg-white rounded-t-[40px] px-6 pt-6 pb-10">
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-6">
                                <View>
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1">Filter By</Text>
                                    <Text className="text-2xl font-black text-gray-900">Order Status</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowFilterModal(false)}
                                    className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center"
                                >
                                    <Ionicons name="close" size={24} color="#111827" />
                                </TouchableOpacity>
                            </View>

                            {/* Filter Options */}
                            <View className="mb-6">
                                {filterOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => applyFilter(option.value)}
                                        className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border-2 ${selectedFilter === option.value
                                            ? 'bg-primary-50 border-primary-600'
                                            : 'bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View
                                                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                                                style={{ backgroundColor: selectedFilter === option.value ? option.color + '20' : '#f9fafb' }}
                                            >
                                                <Ionicons name={option.icon as any} size={24} color={option.color} />
                                            </View>
                                            <Text className={`text-base font-black ${selectedFilter === option.value ? 'text-primary-600' : 'text-gray-900'
                                                }`}>
                                                {option.label}
                                            </Text>
                                        </View>
                                        {selectedFilter === option.value && (
                                            <View className="w-6 h-6 bg-primary-600 rounded-full items-center justify-center">
                                                <Ionicons name="checkmark" size={16} color="white" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-x-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedFilter('ALL');
                                        setShowFilterModal(false);
                                    }}
                                    className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
                                >
                                    <Text className="text-gray-700 font-black uppercase tracking-widest text-xs">Clear Filter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowFilterModal(false)}
                                    className="flex-1 bg-primary-600 py-4 rounded-2xl items-center shadow-lg shadow-primary-200"
                                >
                                    <Text className="text-white font-black uppercase tracking-widest text-xs">Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
