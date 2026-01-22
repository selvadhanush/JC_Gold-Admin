import React from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FinanceAdminNavProps {
    activeTab?: 'dashboard' | 'orders' | 'schemes' | 'payments' | 'refunds' | 'reports';
}

export default function FinanceAdminNav({ activeTab }: FinanceAdminNavProps) {
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'cash-outline', activeIcon: 'cash', route: '/Financeadmin' },
        { id: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', route: '/Financeadmin/waiting_confirmation' },
        { id: 'schemes', label: 'Schemes', icon: 'diamond-outline', activeIcon: 'diamond', route: '/Financeadmin/schemes' },
        { id: 'payments', label: 'Payments', icon: 'card-outline', activeIcon: 'card', route: '/Financeadmin/payments' },
        { id: 'refunds', label: 'Refunds', icon: 'return-down-back-outline', activeIcon: 'return-down-back', route: '/Financeadmin/refunds' },
        { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', route: '/Financeadmin/reports' },
    ];

    return (
        <View className="absolute bottom-6 left-0 right-0 items-center">
            <View className="bg-white/95 backdrop-blur-md h-16 rounded-[32px] border border-gray-100 shadow-2xl flex-row items-center justify-around px-1" style={{ width: width - 30 }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => router.replace(tab.route as any)}
                            className="items-center justify-center flex-1 h-full"
                            activeOpacity={0.7}
                        >
                            <View className={`items-center justify-center ${isActive ? '' : 'opacity-40'}`}>
                                <Ionicons
                                    name={(isActive ? tab.activeIcon : tab.icon) as any}
                                    size={20}
                                    color={isActive ? '#10b981' : '#000'}
                                />
                                <Text
                                    className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'
                                        }`}
                                >
                                    {tab.label}
                                </Text>
                                {isActive && (
                                    <View className="absolute -bottom-3 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
