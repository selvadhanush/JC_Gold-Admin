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
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
            <BlurView
                intensity={90}
                tint="light"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    borderTopWidth: 2,
                    borderTopColor: '#f3f4f6',
                    overflow: 'hidden',
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
                                if (isActive) return;
                                if (router) {
                                    router.push(tab.route as any);
                                }
                            }}
                            style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 12 }}
                            activeOpacity={0.6}
                        >
                            <View
                                style={{ alignItems: 'center', justifyContent: 'center', opacity: isActive ? 1 : 0.5 }}
                            >
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        backgroundColor: isActive ? '#fff7ed' : 'transparent',
                                        minWidth: 56,
                                    }}
                                >
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={26}
                                        color={isActive ? '#ea580c' : '#64748b'}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            marginTop: 4,
                                            color: isActive ? '#ea580c' : '#64748b'
                                        }}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: -4,
                                            width: 32,
                                            height: 4,
                                            borderRadius: 9999,
                                            backgroundColor: '#ea580c',
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
