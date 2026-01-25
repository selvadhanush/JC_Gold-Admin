import React from 'react';
import { View, TouchableOpacity, Text, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SuperAdminNavProps {
    activeTab?: 'dashboard' | 'admins' | 'users' | 'audit' | 'settings' | 'rates';
}

export default function SuperAdminNav({ activeTab }: SuperAdminNavProps) {
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'terminal-outline', activeIcon: 'terminal', route: '/Superadmin' },
        { id: 'rates', label: 'Rates', icon: 'trending-up-outline', activeIcon: 'trending-up', route: '/Superadmin/manage_gold_rates' },
        { id: 'admins', label: 'Admins', icon: 'id-card-outline', activeIcon: 'id-card', route: '/Superadmin/manage_admins' },
        { id: 'users', label: 'Buyers', icon: 'people-circle-outline', activeIcon: 'people-circle', route: '/Superadmin/manage_users' },
        { id: 'settings', label: 'System', icon: 'construct-outline', activeIcon: 'construct', route: '/Superadmin/system_settings' },
    ];

    return (
        <View className="absolute bottom-6 left-0 right-0 items-center">
            <View className="bg-white/95 backdrop-blur-md h-16 rounded-[32px] border border-gray-100 shadow-2xl flex-row items-center justify-around px-2" style={{ width: width - 40 }}>
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
                                    color={isActive ? '#ea580c' : '#000'}
                                />
                                <Text
                                    className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'text-orange-600' : 'text-gray-400'
                                        }`}
                                >
                                    {tab.label}
                                </Text>
                                {isActive && (
                                    <View className="absolute -bottom-3 w-1.5 h-1.5 rounded-full bg-orange-600" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
