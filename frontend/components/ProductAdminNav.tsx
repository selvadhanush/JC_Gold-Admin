import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ProductAdminNavProps {
    activeTab: 'dashboard' | 'categories' | 'products' | 'inventory';
}

export default function ProductAdminNav({ activeTab }: ProductAdminNavProps) {
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/Productadmin' },
        { id: 'categories', label: 'Categories', icon: 'grid-outline', activeIcon: 'grid', route: '/Productadmin/categories' },
        { id: 'products', label: 'Products', icon: 'prism-outline', activeIcon: 'prism', route: '/Productadmin/products' },
        { id: 'inventory', label: 'Stock', icon: 'archive-outline', activeIcon: 'archive', route: '/Productadmin/inventory' },
    ];

    return (
        <View className="absolute bottom-6 left-6 right-6 z-[100]">
            <BlurView
                intensity={80}
                tint="light"
                className="flex-row justify-around items-center h-20 rounded-[32px] border border-white px-2 shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : 'transparent',
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                }}
            >
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
                                    size={24}
                                    color={isActive ? '#ea580c' : '#000'}
                                />
                                <Text
                                    className={`text-[10px] font-black uppercase tracking-tighter mt-1.5 ${isActive ? 'text-orange-600' : 'text-gray-400'
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
            </BlurView>
        </View>
    );
}
