import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface OrderAdminNavProps {
    activeTab: 'dashboard' | 'orders' | 'pending' | 'manage' | 'shipped' | 'gold';
}

export default function OrderAdminNav({ activeTab }: OrderAdminNavProps) {
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/Orderadmin' },
        { id: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', route: '/Orderadmin/orders' },
        { id: 'pending', label: 'Pending', icon: 'time-outline', activeIcon: 'time', route: '/Orderadmin/pending' },
        { id: 'gold', label: 'Gold', icon: 'diamond-outline', activeIcon: 'diamond', route: '/Orderadmin/digital_gold' },
        { id: 'manage', label: 'Manage', icon: 'settings-outline', activeIcon: 'settings', route: '/Orderadmin/manage' },
        { id: 'shipped', label: 'Shipped', icon: 'airplane-outline', activeIcon: 'airplane', route: '/Orderadmin/shipped' },
    ];

    return (
        <View className="absolute bottom-0 left-0 right-0 z-[100]">
            <BlurView
                intensity={90}
                tint="light"
                className="flex-row justify-around items-center border-t-2 border-gray-100 shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
                    height: 70,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => router.replace(tab.route as any)}
                            className="items-center justify-center flex-1"
                            activeOpacity={0.6}
                        >
                            <View
                                className={`items-center justify-center ${isActive ? '' : 'opacity-60'}`}
                            >
                                <View
                                    className={`items-center justify-center rounded-xl px-2 py-1.5 ${isActive ? 'bg-blue-50' : ''}`}
                                    style={{ minWidth: 45 }}
                                >
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={22}
                                        color={isActive ? '#2563eb' : '#64748b'}
                                    />
                                    <Text
                                        className={`text-[7.5px] font-black uppercase tracking-tight mt-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
                                        numberOfLines={1}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View
                                        className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-blue-600"
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </View>
    );
}
