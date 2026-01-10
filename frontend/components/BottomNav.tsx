import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
    activeTab?: 'home' | 'explore' | 'orders' | 'cart' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { id: 'home', icon: 'home', label: 'Home', route: '/buyer_dashboard' },
        { id: 'explore', icon: 'search', label: 'Explore', route: '/products_browse' },
        { id: 'orders', icon: 'receipt', label: 'Orders', route: '/orders' },
        { id: 'cart', icon: 'cart', label: 'Cart', route: '/cart' },
        { id: 'profile', icon: 'person', label: 'Profile', route: '/profile' },
    ];

    const currentTab = activeTab || (
        pathname.includes('buyer_dashboard') ? 'home' :
            pathname.includes('products_browse') ? 'explore' :
                pathname.includes('orders') ? 'orders' :
                    pathname.includes('cart') ? 'cart' :
                        pathname.includes('profile') ? 'profile' : 'home'
    );

    return (
        <View className="absolute bottom-6 left-6 right-6">
            <View className="bg-white/95 backdrop-blur-md h-16 rounded-[32px] border border-gray-100 shadow-2xl flex-row items-center justify-around px-2">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => router.push(tab.route as any)}
                            className={`flex-row items-center px-3 py-2 rounded-2xl ${isActive ? 'bg-primary-600' : 'transparent'}`}
                        >
                            <Ionicons
                                name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
                                size={20}
                                color={isActive ? 'white' : '#9ca3af'}
                            />
                            {isActive && (
                                <Text className="text-white font-black ml-2 text-[10px] uppercase tracking-wider">{tab.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
