import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../../api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

interface ReportsStats {
    revenue: {
        current30Days: number;
        previous30Days: number;
        growthRate: number;
        mtdRevenue: number;
        dailyTrends: Array<{ date: string; revenue: number; orders: number }>;
    };
    users: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        growthRate: number;
        active: number;
        blocked: number;
    };
    sales: {
        current30Days: number;
        previous30Days: number;
        growthRate: number;
        averageOrderValue: number;
    };
    inventory: {
        total: number;
        lowStock: number;
        outOfStock: number;
        healthScore: string;
    };
    schemes: {
        total: number;
        active: number;
        enrollments: {
            active: number;
            completed: number;
            total: number;
        };
    };
}

export default function SystemReports() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState<ReportsStats | null>(null);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        fetchReportsStats();
    }, []);

    useEffect(() => {
        if (stats) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [stats]);

    const fetchReportsStats = async () => {
        try {
            setStatsLoading(true);
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${BASE_URL}/api/v1/super-admin/reports-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
                setToast({
                    visible: true,
                    message: 'Failed to fetch reports statistics',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error fetching reports stats:', error);
            setToast({
                visible: true,
                message: 'Failed to load statistics',
                type: 'error'
            });
        } finally {
            setStatsLoading(false);
        }
    };

    const handleExport = async (type: string) => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('userToken');

            // Generate filename with current date
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${type.charAt(0).toUpperCase() + type.slice(1)}_Report_${date}.xlsx`;
            const fileUri = FileSystem.documentDirectory + fileName;

            // Download the file
            const downloadResult = await FileSystem.downloadAsync(
                `${BASE_URL}/api/v1/super-admin/reports/${type}`,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (downloadResult.status === 200) {
                // Check if sharing is available
                const isAvailable = await Sharing.isAvailableAsync();

                if (isAvailable) {
                    // Share/Open the file
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        dialogTitle: 'Open Report',
                        UTI: 'com.microsoft.excel.xlsx'
                    });

                    setToast({
                        visible: true,
                        message: `${type.toUpperCase()} report downloaded successfully! 📊`,
                        type: 'success'
                    });
                } else {
                    setToast({
                        visible: true,
                        message: 'Report saved to device storage',
                        type: 'success'
                    });
                }
            } else {
                setToast({
                    visible: true,
                    message: 'Failed to download report. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error generating report:', error);
            setToast({
                visible: true,
                message: 'Failed to generate report. Please check your connection.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const formatGrowth = (rate: number) => {
        const isPositive = rate >= 0;
        return {
            text: `${isPositive ? '+' : ''}${rate.toFixed(1)}%`,
            color: isPositive ? '#10b981' : '#ef4444',
        };
    };

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
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 border border-gray-100"
                        >
                            <Ionicons name="chevron-back" size={20} color="black" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                            <Text className="text-2xl font-black text-black">INSIGHTS HUB</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={fetchReportsStats}
                        className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30"
                    >
                        <Ionicons name="refresh" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Global Pulse Section */}
                {statsLoading ? (
                    <View className="p-6">
                        <Skeleton width={120} height={12} borderRadius={6} style={{ marginBottom: 16 }} />
                        <View className="flex-row gap-3 mb-6">
                            <Skeleton width={(width - 60) / 2} height={120} borderRadius={24} />
                            <Skeleton width={(width - 60) / 2} height={120} borderRadius={24} />
                        </View>
                        <View className="flex-row gap-3">
                            <Skeleton width={(width - 60) / 2} height={120} borderRadius={24} />
                            <Skeleton width={(width - 60) / 2} height={120} borderRadius={24} />
                        </View>
                    </View>
                ) : stats ? (
                    <Animated.View style={{ opacity: fadeAnim }} className="p-6">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Global Pulse</Text>

                        {/* KPI Cards */}
                        <View className="flex-row gap-3 mb-3">
                            {/* MTD Revenue */}
                            <View className="flex-1 bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center">
                                        <Ionicons name="cash" size={20} color="white" />
                                    </View>
                                    <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                                        <Text style={{ color: formatGrowth(stats.revenue.growthRate).color }} className="text-[9px] font-black">
                                            {formatGrowth(stats.revenue.growthRate).text}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">MTD Revenue</Text>
                                <Text className="text-black text-xl font-black">{formatCurrency(stats.revenue.mtdRevenue)}</Text>
                            </View>

                            {/* User Growth */}
                            <View className="flex-1 bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl border border-indigo-100">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center">
                                        <Ionicons name="people" size={20} color="white" />
                                    </View>
                                    <View className="bg-indigo-100 px-2 py-1 rounded-lg">
                                        <Text style={{ color: formatGrowth(stats.users.growthRate).color }} className="text-[9px] font-black">
                                            {formatGrowth(stats.users.growthRate).text}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">User Growth</Text>
                                <Text className="text-black text-xl font-black">{stats.users.thisMonth}</Text>
                                <Text className="text-gray-400 text-[8px] font-medium">This Month</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-6">
                            {/* Inventory Health */}
                            <View className="flex-1 bg-gradient-to-br from-amber-50 to-white p-5 rounded-3xl border border-amber-100">
                                <View className="w-10 h-10 bg-amber-500 rounded-xl items-center justify-center mb-3">
                                    <Ionicons name="cube" size={20} color="white" />
                                </View>
                                <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Inventory Health</Text>
                                <Text className="text-black text-xl font-black">{stats.inventory.healthScore}%</Text>
                                <Text className="text-gray-400 text-[8px] font-medium">{stats.inventory.lowStock} Low Stock</Text>
                            </View>

                            {/* Active Schemes */}
                            <View className="flex-1 bg-gradient-to-br from-cyan-50 to-white p-5 rounded-3xl border border-cyan-100">
                                <View className="w-10 h-10 bg-cyan-500 rounded-xl items-center justify-center mb-3">
                                    <Ionicons name="diamond" size={20} color="white" />
                                </View>
                                <Text className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Active Schemes</Text>
                                <Text className="text-black text-xl font-black">{stats.schemes.enrollments.active}</Text>
                                <Text className="text-gray-400 text-[8px] font-medium">Enrollments</Text>
                            </View>
                        </View>
                    </Animated.View>
                ) : null}

                <View className="px-6 pb-6">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-1">Analytical Protocols</Text>

                    {[
                        { title: 'Gross Revenue Audit', desc: 'Full breakdown of daily, monthly, and yearly fiscal performance.', icon: 'cash', color: '#10b981', type: 'sales' },
                        { title: 'Customer Growth Index', desc: 'Visualizing buyer onboarding and retention metrics.', icon: 'trending-up', color: '#6366f1', type: 'users' },
                        { title: 'Inventory Velocity', desc: 'Stock turnaround rates and high-demand product forensic report.', icon: 'cube', color: '#f59e0b', type: 'inventory' },
                        { title: 'Scheme Performance', desc: 'Deep-dive into gold saving scheme participation.', icon: 'diamond', color: '#06b6d4', type: 'schemes' },
                    ].map((report, i) => (
                        <View
                            key={i}
                            className="bg-white p-6 rounded-[32px] mb-6 border border-gray-100 shadow-sm"
                        >
                            <View className="flex-row items-center mb-6">
                                <View style={{ backgroundColor: report.color + '10' }} className="w-14 h-14 rounded-2xl items-center justify-center mr-5 border border-gray-50">
                                    <Ionicons name={report.icon as any} size={28} color={report.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-black text-lg leading-tight">{report.title}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                                        <Text className="text-gray-400 font-bold text-[9px] uppercase">Live Data</Text>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-gray-500 text-xs font-medium leading-5 mb-8">
                                {report.desc}
                            </Text>

                            <View className="flex-row items-center gap-x-3">
                                <TouchableOpacity
                                    onPress={() => handleExport(report.type)}
                                    disabled={loading}
                                    className="flex-1 bg-black h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-black/20"
                                >
                                    <Ionicons name="cloud-download" size={18} color="white" />
                                    <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-3">Generate Report</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center">
                                    <Ionicons name="mail" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View className="h-32" />
            </ScrollView>

            {loading && (
                <View className="absolute inset-0 bg-white/90 items-center justify-center backdrop-blur-md">
                    <View className="p-8 items-center">
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text className="text-black font-black text-[10px] uppercase tracking-[4px] mt-6">Generating Report...</Text>
                        <Text className="text-gray-400 text-[9px] mt-2">Please wait</Text>
                    </View>
                </View>
            )}

            {/* Toast Notification */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
        </View>
    );
}
