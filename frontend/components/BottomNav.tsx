import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
    activeTab?: 'home' | 'explore' | 'orders' | 'cart' | 'profile';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
    const insets = useSafeAreaInsets();
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
        <View style={{
            position: 'absolute',
            bottom: insets.bottom + 16,
            left: 20,
            right: 20,
            zIndex: 100,
            alignItems: 'center',
        }}>
            <BlurView
                intensity={90}
                tint="light"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    borderRadius: 32, // Floating pill shape
                    overflow: 'hidden',
                    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
                    height: 64, // Sleek height
                    width: '100%',
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
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
                            style={{ alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' }}
                            activeOpacity={0.6}
                        >
                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: isActive ? '#fff7ed' : 'transparent',
                                        marginBottom: 2
                                    }}
                                >
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={20}
                                        color={isActive ? '#ea580c' : '#94a3b8'}
                                    />
                                </View>
                                {isActive && (
                                    <View
                                        style={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: 2,
                                            backgroundColor: '#ea580c',
                                            position: 'absolute',
                                            bottom: -6
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
