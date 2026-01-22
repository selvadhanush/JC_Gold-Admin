import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface BottomNavProps {
    activeTab?: 'home' | 'explore' | 'orders' | 'cart' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
    let router: any = null;
    let pathname: any = '';
    
    try {
        router = useRouter();
    } catch (e) {
        // Router context not available
    }
    
    try {
        pathname = usePathname();
    } catch (e) {
        // Pathname context not available
    }

    const tabs = [
        { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home', route: '/buyer_dashboard' },
        { id: 'explore', icon: 'search-outline', activeIcon: 'search', label: 'Explore', route: '/products_browse' },
        { id: 'orders', icon: 'receipt-outline', activeIcon: 'receipt', label: 'Orders', route: '/orders' },
        { id: 'cart', icon: 'cart-outline', activeIcon: 'cart', label: 'Cart', route: '/cart' },
        { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile', route: '/profile' },
    ];

    const currentTab = activeTab || (
        pathname && (
            pathname.includes('buyer_dashboard') ? 'home' :
                pathname.includes('products_browse') ? 'explore' :
                    pathname.includes('orders') ? 'orders' :
                        pathname.includes('cart') ? 'cart' :
                            pathname.includes('profile') ? 'profile' : 'home'
        )
    ) || 'home';

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
                    const isActive = currentTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => {
                                if (router) {
                                    router.push(tab.route as any);
                                }
                            }}
                            className="items-center justify-center flex-1 py-3"
                            activeOpacity={0.6}
                        >
                            <View
                                className={`items-center justify-center ${isActive ? '' : 'opacity-50'
                                    }`}
                            >
                                <View
                                    className={`items-center justify-center rounded-2xl px-4 py-2 ${isActive ? 'bg-orange-50' : ''
                                        }`}
                                    style={{
                                        minWidth: 56,
                                    }}
                                >
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={26}
                                        color={isActive ? '#ea580c' : '#64748b'}
                                    />
                                    <Text
                                        className={`text-[9px] font-bold uppercase tracking-wide mt-1 ${isActive ? 'text-orange-600' : 'text-slate-500'
                                            }`}
                                        style={{
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View
                                        className="absolute -bottom-1 w-8 h-1 rounded-full bg-orange-600"
                                        style={{
                                            shadowColor: '#ea580c',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 4,
                                        }}
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
