import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

interface ReportStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topPaymentMethod: string;
    monthlyGrowth: number;
    paymentMethods: { method: string; percentage: number; color: string }[];
}

export default function FinancialReports() {
    const router = useRouter();
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('MONTH');

    useEffect(() => {
        fetchReportStats();
    }, [selectedPeriod]);

    const fetchReportStats = async () => {
        try {
            const headers = await getAuthHeaders();
            const [statsRes, paymentsRes] = await Promise.all([
                fetch(`${BASE_URL}/api/v1/dashboard/stats?period=${selectedPeriod}`, { headers }),
                fetch(`${BASE_URL}/api/v1/payments`, { headers })
            ]);

            const statsData = await statsRes.json();
            const paymentsData = await paymentsRes.json();

            console.log('Reports Stats Response:', statsData);

            if (statsData.success) {
                const payments = paymentsData.success ? paymentsData.data : [];

                // Get revenue from backend response
                const totalRevenue = statsData.data?.totalRevenue || 0;
                const dailySales = statsData.data?.dailySales || [];

                // Calculate revenue for selected period from dailySales
                const periodRevenue = dailySales.reduce((sum: number, sale: any) => sum + (sale.sales || 0), 0);

                // Calculate total orders from dailySales
                const totalOrders = dailySales.reduce((sum: number, sale: any) => sum + (sale.count || 0), 0);

                const averageOrderValue = totalOrders > 0 ? Math.round(periodRevenue / totalOrders) : 0;

                // Calculate payment method distribution
                const paymentMethodsMap: Record<string, number> = {};
                payments.forEach((p: any) => {
                    const method = p.paymentMethod || 'Unknown';
                    paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1;
                });

                const topMethod = Object.keys(paymentMethodsMap).length > 0
                    ? Object.keys(paymentMethodsMap).reduce((a, b) =>
                        paymentMethodsMap[a] > paymentMethodsMap[b] ? a : b
                    )
                    : 'N/A';

                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
                const distribution = Object.keys(paymentMethodsMap).map((method, index) => ({
                    method,
                    percentage: Math.round((paymentMethodsMap[method] / payments.length) * 100),
                    color: colors[index % colors.length]
                })).sort((a, b) => b.percentage - a.percentage);

                console.log('Calculated Reports:', {
                    selectedPeriod,
                    periodRevenue,
                    totalRevenue,
                    totalOrders,
                    averageOrderValue,
                    topMethod,
                    distribution
                });

                setStats({
                    totalRevenue: periodRevenue,
                    totalOrders,
                    averageOrderValue,
                    topPaymentMethod: topMethod,
                    monthlyGrowth: 0,
                    paymentMethods: distribution,
                });
            }
        } catch (error) {
            console.error('Failed to fetch report stats:', error);
            setStats({
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                topPaymentMethod: 'N/A',
                monthlyGrowth: 0,
                paymentMethods: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReportStats();
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    const downloadSalesReport = async () => {
        try {
            if (!stats) {
                Alert.alert('Error', 'No data available to export');
                return;
            }

            // Create beautiful HTML for PDF
            const htmlContent = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                        <style>
                            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                            .title { font-size: 28px; font-weight: 900; color: #000; margin: 0; }
                            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
                            .period { background: #f0fdf4; color: #10b981; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; margin-top: 10px; }
                            .section { margin-top: 40px; }
                            .section-title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 10px; }
                            .grid { display: flex; flex-wrap: wrap; margin-top: 20px; }
                            .card { flex: 1; min-width: 150px; background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 12px; margin-right: 15px; margin-bottom: 15px; }
                            .card-label { font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
                            .card-value { font-size: 22px; font-weight: 900; color: #000; }
                            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            .table th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 1px solid #eee; font-size: 12px; color: #666; }
                            .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                            .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1 class="title">JC GOLD ADMIN</h1>
                            <p class="subtitle">FINANCIAL SALES REPORT</p>
                            <div class="period">PERIOD: ${selectedPeriod}</div>
                            <p style="font-size: 10px; color: #999; margin-top: 10px;">Generated on ${new Date().toLocaleString()}</p>
                        </div>

                        <div class="section">
                            <div class="section-title">Key Performance Indicators</div>
                            <div class="grid">
                                <div class="card">
                                    <div class="card-label">Total Revenue</div>
                                    <div class="card-value">₹${stats.totalRevenue.toLocaleString()}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Total Orders</div>
                                    <div class="card-value">${stats.totalOrders}</div>
                                </div>
                                <div class="card">
                                    <div class="card-label">Avg Order Value</div>
                                    <div class="card-value">₹${stats.averageOrderValue.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Payment Method Breakdown</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>PAYMENT METHOD</th>
                                        <th>USAGE PERCENTAGE</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.paymentMethods.map(pm => `
                                        <tr>
                                            <td style="font-weight: bold;">${pm.method}</td>
                                            <td>${pm.percentage}%</td>
                                            <td><span style="color: ${pm.color};">●</span> Active</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="footer">
                            <p>This is a computer-generated report from JC Gold Admin Dashboard.</p>
                            <p>&copy; ${new Date().getFullYear()} JC GOLD. All Rights Reserved.</p>
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            console.log('PDF generated at:', uri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error: any) {
            console.error('Export Error:', error);
            Alert.alert('Export Error', error?.message || 'Failed to generate PDF report');
        }
    };

    const downloadAnalyticsReport = async () => {
        try {
            if (!stats) {
                Alert.alert('Error', 'No data available to export');
                return;
            }

            // Create beautiful HTML for Analytics PDF
            const htmlContent = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                        <style>
                            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                            .title { font-size: 28px; font-weight: 900; color: #000; margin: 0; }
                            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
                            .period { background: #eff6ff; color: #3b82f6; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; display: inline-block; margin-top: 10px; }
                            .section { margin-top: 40px; }
                            .section-title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }
                            .stat-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
                            .stat-label { color: #666; font-weight: bold; }
                            .stat-value { color: #000; font-weight: 900; }
                            .chart-container { margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; }
                            .chart-item { margin-bottom: 15px; }
                            .chart-label-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; font-weight: bold; }
                            .chart-bar-bg { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; }
                            .chart-bar-fill { height: 100%; border-radius: 4px; }
                            .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1 class="title">JC GOLD ADMIN</h1>
                            <p class="subtitle">DATA ANALYTICS REPORT</p>
                            <div class="period">PERIOD: ${selectedPeriod}</div>
                            <p style="font-size: 10px; color: #999; margin-top: 10px;">Generated on ${new Date().toLocaleString()}</p>
                        </div>

                        <div class="section">
                            <div class="section-title">Performance Summary</div>
                            <div class="stat-row">
                                <span class="stat-label">Total Volume (Revenue)</span>
                                <span class="stat-value">₹${stats.totalRevenue.toLocaleString()}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Transaction Count (Orders)</span>
                                <span class="stat-value">${stats.totalOrders}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Average Ticket Size</span>
                                <span class="stat-value">₹${stats.averageOrderValue.toLocaleString()}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Primary Payment Method</span>
                                <span class="stat-value">${stats.topPaymentMethod}</span>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Payment Method Analytics</div>
                            <div class="chart-container">
                                ${stats.paymentMethods.map(pm => `
                                    <div class="chart-item">
                                        <div class="chart-label-row">
                                            <span>${pm.method}</span>
                                            <span>${pm.percentage}%</span>
                                        </div>
                                        <div class="chart-bar-bg">
                                            <div class="chart-bar-fill" style="width: ${pm.percentage}%; background-color: ${pm.color};"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="footer">
                            <p>This analytics report provides a deep dive into finance admin data points.</p>
                            <p>&copy; ${new Date().getFullYear()} JC GOLD. Internal Document.</p>
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            console.log('Analytics PDF generated at:', uri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error: any) {
            console.error('Export Error:', error);
            Alert.alert('Export Error', error?.message || 'Failed to generate Analytics report');
        }
    };


    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Finance Admin</Text>
                        <Text className="text-2xl font-black text-black">Reports</Text>
                    </View>
                </View>

                {/* Period Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map((period) => (
                        <TouchableOpacity
                            key={period}
                            onPress={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-full mr-2 ${selectedPeriod === period ? 'bg-emerald-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`font-bold text-xs ${selectedPeriod === period ? 'text-white' : 'text-gray-600'}`}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <View className="p-6">
                        <Text className="text-center text-gray-500">Loading reports...</Text>
                    </View>
                ) : (
                    <>
                        {/* Key Metrics */}
                        <View className="p-6">
                            <Text className="text-black font-black text-xl mb-4">Key Metrics</Text>

                            {/* Total Revenue Card */}
                            <View className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[24px] p-6 mb-4 shadow-lg" style={{ backgroundColor: '#10b981' }}>
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-emerald-200 text-sm font-bold uppercase">Total Revenue</Text>
                                    <View className="bg-white/20 p-2 rounded-xl">
                                        <Ionicons name="trending-up" size={20} color="white" />
                                    </View>
                                </View>
                                <Text className="text-white text-4xl font-black mb-2">{formatCurrency(stats?.totalRevenue || 0)}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="arrow-up" size={16} color="#6ee7b7" />
                                    <Text className="text-emerald-300 font-bold text-sm ml-1">
                                        +{stats?.monthlyGrowth}% from last period
                                    </Text>
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View className="flex-row flex-wrap justify-between">
                                <View className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm" style={{ width: (width - 60) / 2 }}>
                                    <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="receipt" size={24} color="#3b82f6" />
                                    </View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Orders</Text>
                                    <Text className="text-black text-2xl font-black">{stats?.totalOrders || 0}</Text>
                                </View>

                                <View className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm" style={{ width: (width - 60) / 2 }}>
                                    <View className="bg-purple-50 w-12 h-12 rounded-2xl items-center justify-center mb-3">
                                        <Ionicons name="calculator" size={24} color="#9333ea" />
                                    </View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Avg Order</Text>
                                    <Text className="text-black text-2xl font-black">₹{stats?.averageOrderValue || 0}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Payment Methods */}
                        <View className="px-6 mb-6">
                            <Text className="text-black font-black text-xl mb-4">Payment Methods</Text>
                            <View className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-amber-50 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                                        <Ionicons name="card" size={24} color="#f59e0b" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs font-bold uppercase">Top Method</Text>
                                        <Text className="text-black font-black text-lg">{stats?.topPaymentMethod || 'N/A'}</Text>
                                    </View>
                                </View>

                                {/* Payment Method Breakdown */}
                                <View className="space-y-3">
                                    {stats?.paymentMethods && stats.paymentMethods.length > 0 ? (
                                        stats.paymentMethods.map((item) => (
                                            <View key={item.method} className="mb-3">
                                                <View className="flex-row justify-between mb-2">
                                                    <Text className="text-gray-700 font-bold text-sm">{item.method}</Text>
                                                    <Text className="text-gray-900 font-black text-sm">{item.percentage}%</Text>
                                                </View>
                                                <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <View
                                                        className="h-full rounded-full"
                                                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                                    />
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text className="text-center text-gray-400 py-4 italic">No payment method data available</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Export Options */}
                        <View className="px-6 mb-10">
                            <Text className="text-black font-black text-xl mb-4">Export Options</Text>

                            <TouchableOpacity
                                onPress={downloadSalesReport}
                                className="bg-white border border-gray-100 rounded-[24px] p-5 mb-3 shadow-sm flex-row items-center"
                            >
                                <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                                    <Ionicons name="document-text" size={24} color="#10b981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-black text-base">Sales Report (PDF)</Text>
                                    <Text className="text-gray-500 text-sm">Professional PDF breakdown</Text>
                                </View>
                                <Ionicons name="download" size={24} color="#10b981" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={downloadAnalyticsReport}
                                className="bg-white border border-gray-100 rounded-[24px] p-5 mb-3 shadow-sm flex-row items-center"
                            >
                                <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                                    <Ionicons name="stats-chart" size={24} color="#3b82f6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-black text-base">Analytics Report (PDF)</Text>
                                    <Text className="text-gray-500 text-sm">Visual data summary</Text>
                                </View>
                                <Ionicons name="download" size={24} color="#3b82f6" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
