import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import OrderAdminNav from '../../components/OrderAdminNav';

const { width } = Dimensions.get('window');

interface HubItemProps {
    id: string;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.prototype.name | any;
    color: string;
    bg: string;
    route: string;
}

const HubCard: React.FC<HubItemProps> = ({ label, description, icon, color, bg, route }) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.push(route as any)}
            activeOpacity={0.9}
            className="w-full bg-white rounded-[40px] p-8 mb-6 border border-gray-100/50 shadow-sm flex-row items-center"
        >
            <View className={`w-20 h-20 rounded-[28px] ${bg} items-center justify-center mr-6`}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-xl font-black text-slate-900 mb-1">{label}</Text>
                <Text className="text-slate-400 text-xs font-bold leading-relaxed">{description}</Text>
            </View>
            <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center">
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );
};

export default function OrderAdminHub() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const data = await SecureStore.getItemAsync('userData');
        if (data) setUserData(JSON.parse(data));
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Visual Header */}
                <View className="px-8 pt-16 pb-12">
                    <View className="flex-row items-center mb-6">
                        <View className="w-10 h-[2px] bg-blue-600 mr-3" />
                        <Text className="text-blue-600 font-black text-[10px] uppercase tracking-[3px]">Navigation Hub</Text>
                    </View>
                    <Text className="text-4xl font-black text-slate-900 tracking-tight">Platform</Text>
                    <Text className="text-4xl font-black text-slate-900 tracking-tight">Ecosystem</Text>
                    <Text className="text-slate-400 text-sm font-bold mt-4 max-w-[80%] leading-relaxed">
                        Manage your end-to-end order operations with professional precision and efficiency.
                    </Text>
                </View>

                {/* Hub Actions Grid */}
                <View className="px-6 pb-32">
                    <HubCard
                        id="ops"
                        label="Operations"
                        description="Monitor and process daily order pipeline performance."
                        icon="pulse-outline"
                        color="#2563eb"
                        bg="bg-blue-50"
                        route="/Orderadmin/manage"
                    />

                    <HubCard
                        id="inventory"
                        label="Inventory Tool"
                        description="Quick access to product management and availability."
                        icon="cube-outline"
                        color="#6366f1"
                        bg="bg-indigo-50"
                        route="/Productadmin/products"
                    />

                    <HubCard
                        id="reports"
                        label="Enterprise Stats"
                        description="Visual analytics and comprehensive data exports."
                        icon="bar-chart-outline"
                        color="#0ea5e9"
                        bg="bg-sky-50"
                        route="/Orderadmin/analytics"
                    />

                    <HubCard
                        id="support"
                        label="Help Center"
                        description="Manage customer inquiries and order tickets."
                        icon="chatbubbles-outline"
                        color="#f59e0b"
                        bg="bg-amber-50"
                        route="/Orderadmin/tickets"
                    />
                </View>
            </ScrollView>

            <OrderAdminNav activeTab="hub" />
        </View>
    );
}
