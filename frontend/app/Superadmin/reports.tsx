import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

export default function SystemReports() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleExport = (type: string) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Legacy Export Initialized",
                `The ${type.toUpperCase()} cryptographic ledger has been generated and queued for cloud delivery.`,
                [{ text: "Acknowledged" }]
            );
        }, 1500);
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
                            <Text className="text-2xl font-black text-black">INSIGHT CORE</Text>
                        </View>
                    </View>
                    <View className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Ionicons name="stats-chart" size={20} color="white" />
                    </View>
                </View>

                <View className="p-6">
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
                                        <Text className="text-gray-400 font-bold text-[9px] uppercase">Stable Node</Text>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-gray-500 text-xs font-medium leading-5 mb-8">
                                {report.desc}
                            </Text>

                            <View className="flex-row items-center gap-x-3">
                                <TouchableOpacity
                                    onPress={() => handleExport(report.type)}
                                    className="flex-1 bg-black h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-black/20"
                                >
                                    <Ionicons name="cloud-download" size={18} color="white" />
                                    <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-3">Generate XLSX</Text>
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
                <View className="absolute inset-0 bg-white/60 items-center justify-center backdrop-blur-md">
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text className="text-black font-black text-[10px] uppercase tracking-[4px] mt-6">Compiling Data...</Text>
                </View>
            )}
        </View>
    );
}
