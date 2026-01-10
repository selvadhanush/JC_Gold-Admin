import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Dashboard() {

    const stats = [
        { label: 'Total Revenue', value: '₹12.5L', change: '+12.5%', positive: true },
        { label: 'Orders Today', value: '23', change: '+8.2%', positive: true },
        { label: 'Pending Orders', value: '7', change: '-15%', positive: false },
        { label: 'Total Customers', value: '1,234', change: '+5.3%', positive: true },
    ];

    const recentOrders = [
        { id: '#ORD-001', customer: 'Rajesh Kumar', amount: '₹45,000', status: 'Completed' },
        { id: '#ORD-002', customer: 'Priya Sharma', amount: '₹32,500', status: 'Pending' },
        { id: '#ORD-003', customer: 'Amit Patel', amount: '₹78,900', status: 'Processing' },
        { id: '#ORD-004', customer: 'Sneha Reddy', amount: '₹21,000', status: 'Completed' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'Processing':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-6">
                {/* Welcome Section */}
                <View className="mb-6">
                    <Text className="text-3xl font-bold text-gray-800 mb-2">
                        Dashboard
                    </Text>
                    <Text className="text-gray-600">
                        Here's what's happening with your business today
                    </Text>
                </View>

                {/* Stats Grid */}
                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-4">
                        Key Metrics
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        {stats.map((stat, index) => (
                            <View
                                key={index}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                                style={{ width: '48%' }}
                            >
                                <Text className="text-sm text-gray-600 mb-2">
                                    {stat.label}
                                </Text>
                                <Text className="text-2xl font-bold text-gray-800 mb-2">
                                    {stat.value}
                                </Text>
                                <Text
                                    className={`text-sm font-semibold ${stat.positive ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {stat.change}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Orders */}
                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-800">
                            Recent Orders
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-primary-600 font-semibold">
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {recentOrders.map((order, index) => (
                        <TouchableOpacity
                            key={index}
                            className="bg-white rounded-2xl p-5 mb-3 shadow-sm border border-gray-100 active:bg-gray-50"
                        >
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-gray-800 mb-1">
                                        {order.id}
                                    </Text>
                                    <Text className="text-sm text-gray-600">
                                        {order.customer}
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold text-primary-600">
                                    {order.amount}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <View
                                    className={`px-3 py-1 rounded-full ${getStatusColor(
                                        order.status
                                    )}`}
                                >
                                    <Text className="text-xs font-semibold">
                                        {order.status}
                                    </Text>
                                </View>
                                <Text className="text-primary-500">›</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Actions */}
                <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-4">
                        Quick Actions
                    </Text>
                    <View className="flex-row gap-3">
                        <Link href="/products" asChild>
                            <TouchableOpacity className="flex-1 bg-primary-500 rounded-2xl p-5 shadow-sm active:opacity-80">
                                <Text className="text-white text-center font-bold text-base">
                                    Add Product
                                </Text>
                            </TouchableOpacity>
                        </Link>
                        <TouchableOpacity className="flex-1 bg-gold-500 rounded-2xl p-5 shadow-sm active:opacity-80">
                            <Text className="text-white text-center font-bold text-base">
                                New Order
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
