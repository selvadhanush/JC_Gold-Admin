import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
import Skeleton from '../../components/Skeleton';

const { width } = Dimensions.get('window');

interface AnalyticsData {
    revenueByDay: { date: string; amount: number }[];
    statusDistribution: { status: string; count: number }[];
    totalRevenue: number;
    averageOrderValue: number;
    growthRate: number;
}

export default function OrderAnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders`, { headers });
            const result = await response.json();

            if (result.success) {
                const orders = result.data || [];

                // Process data for analytics
                let revenue = 0;
                const dailyRev: Record<string, number> = {};
                const statusDist: Record<string, number> = {};

                orders.forEach((order: any) => {
                    if (order.orderStatus !== 'CANCELLED') {
                        revenue += order.totalAmount;
                    }

                    const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    dailyRev[date] = (dailyRev[date] || 0) + order.totalAmount;

                    statusDist[order.orderStatus] = (statusDist[order.orderStatus] || 0) + 1;
                });

                const sortedDates = Object.entries(dailyRev)
                    .map(([date, amount]) => ({ date, amount }))
                    .reverse()
                    .slice(0, 7);

                const analytics: AnalyticsData = {
                    revenueByDay: sortedDates,
                    statusDistribution: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
                    totalRevenue: revenue,
                    averageOrderValue: orders.length > 0 ? revenue / orders.length : 0,
                    growthRate: 12.5, // Mocked for now
                };

                setData(analytics);
            }
        } catch (error) {
            console.error('Analytics Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderChart = () => {
        if (!data?.revenueByDay.length) return null;

        const maxAmount = Math.max(...data.revenueByDay.map(d => d.amount));
        const chartHeight = 150;

        return (
            <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
                <Text className="text-black font-bold text-lg mb-6">Revenue Trend (Last 7 Days)</Text>
                <View className="flex-row items-end justify-between h-[150px] px-2">
                    {data.revenueByDay.map((item, index) => (
                        <View key={index} className="items-center">
                            <View className="bg-black rounded-lg w-8" style={{ height: (item.amount / maxAmount) * chartHeight, opacity: 0.85 }} /><Text className="text-[10px] text-gray-400 font-bold mt-2">{item.date}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header Skeleton */}
                <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row items-center">
                        <Skeleton width={40} height={40} className="rounded-xl mr-4" />
                        <View>
                            <Skeleton width={80} height={10} className="mb-2" />
                            <Skeleton width={150} height={24} />
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    {/* Summary Cards Skeleton */}
                    <View className="flex-row gap-4 mb-6">
                        <Skeleton width="48%" height={120} className="rounded-[32px]" />
                        <Skeleton width="48%" height={120} className="rounded-[32px]" />
                    </View>
                    <Skeleton width="100%" height={100} className="rounded-[32px] mb-6" />

                    {/* Chart Skeleton */}
                    <View className="bg-white rounded-3xl p-6 border border-gray-100 mb-6">
                        <Skeleton width={150} height={20} className="mb-8" />
                        <View className="flex-row items-end justify-between h-[150px] px-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                <View key={i} className="items-center">
                                    <Skeleton width={32} height={Math.random() * 100 + 40} className="rounded-lg" />
                                    <Skeleton width={30} height={10} className="mt-2" />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Breakdown Skeleton */}
                    <View className="bg-white rounded-3xl p-6 border border-gray-100">
                        <Skeleton width={150} height={20} className="mb-6" />
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} className="mb-4">
                                <View className="flex-row justify-between mb-2">
                                    <Skeleton width={100} height={14} />
                                    <Skeleton width={40} height={14} />
                                </View>
                                <Skeleton width="100%" height={8} className="rounded-full" />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4"
                    >
                        <Ionicons name="chevron-back" size={20} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">Performance</Text>
                        <Text className="text-2xl font-black text-black">ANALYTICS</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} />}
            >
                <View className="p-6">
                    {/* Summary Cards */}
                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1 bg-black rounded-[32px] p-6">
                            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</Text>
                            <Text className="text-white font-black text-2xl">₹{data?.totalRevenue?.toLocaleString('en-IN') || '0'}</Text>
                            <View className="flex-row items-center mt-2">
                                <Ionicons name="trending-up" size={14} color="#4ade80" />
                                <Text className="text-green-400 text-xs font-bold ml-1">+{data?.growthRate}%</Text>
                            </View>
                        </View>
                        <View className="flex-1 bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Avg. Order</Text>
                            <Text className="text-black font-black text-2xl">₹{data?.averageOrderValue?.toFixed(0) || '0'}</Text>
                            <Text className="text-gray-400 text-xs font-medium mt-2">Last 30 days</Text>
                        </View>
                    </View>

                    {/* Chart Section */}
                    {renderChart()}

                    {/* Status Breakdown */}
                    <View className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                        <Text className="text-black font-bold text-lg mb-6">Order Status Distribution</Text>
                        {(data?.statusDistribution || []).map((item, index) => (
                            <View key={index} className="flex-row items-center justify-between mb-4 last:mb-0">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-black mr-3" />
                                    <Text className="text-gray-700 font-bold">{item.status}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-black font-black mr-3">{item.count}</Text>
                                    <View className="bg-black/10 h-1.5 w-24 rounded-full overflow-hidden"><View className="bg-black h-full rounded-full" style={{ width: `${(item.count / (data?.statusDistribution?.reduce((acc, curr) => acc + curr.count, 0) || 1)) * 100}%` }} /></View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Insights Card */}
                    <View className="mt-6 bg-blue-600 rounded-[32px] p-8 shadow-xl" style={{ shadowColor: '#2563eb', shadowOpacity: 0.2 }}>
                        <View className="flex-row items-center mb-4">
                            <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                                <Ionicons name="bulb" size={20} color="white" />
                            </View>
                            <Text className="text-white font-black text-lg">Smart Insight</Text>
                        </View>
                        <Text className="text-white/90 text-sm font-medium leading-relaxed">
                            Your revenue is up by {data?.growthRate}% this week. The most popular order status is {data?.statusDistribution[0]?.status || 'N/A'}. Consider running a promotion for delayed shipments to improve customer satisfaction.
                        </Text>
                    </View>
                </View>

                {/* Bottom Padding */}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
