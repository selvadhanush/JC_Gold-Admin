import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface ProductAdminNavProps {
    activeTab: 'dashboard' | 'categories' | 'products' | 'inventory';
    navigation?: BottomTabBarProps['navigation'];
}

export default function ProductAdminNav({ activeTab, navigation }: ProductAdminNavProps) {
    // Navigation is passed from parent


    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/Productadmin' },
        { id: 'categories', label: 'Categories', icon: 'grid-outline', activeIcon: 'grid', route: '/Productadmin/categories' },
        { id: 'products', label: 'Products', icon: 'prism-outline', activeIcon: 'prism', route: '/Productadmin/products' },
        { id: 'inventory', label: 'Stock', icon: 'archive-outline', activeIcon: 'archive', route: '/Productadmin/inventory' },
    ];

    return (
        <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'transparent',
        }}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 90 : 100}
                tint="light"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: Platform.OS === 'ios' ? 85 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(234, 88, 12, 0.1)',
                    backgroundColor: Platform.OS === 'android' ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => {
                                const screenName = tab.id === 'dashboard' ? 'index' : tab.id;
                                if (navigation) {
                                    navigation.navigate(screenName);
                                }
                            }}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isActive ? 1 : 0.5,
                            }}>
                                <View style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 4,
                                    paddingHorizontal: 12,
                                    borderRadius: 16,
                                    backgroundColor: isActive ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                                }}>
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={22}
                                        color={isActive ? '#ea580c' : '#4b5563'}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        style={{
                                            fontSize: 10,
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: -0.2,
                                            marginTop: 3,
                                            color: isActive ? '#ea580c' : '#6b7280',
                                        }}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View style={{
                                        position: 'absolute',
                                        bottom: -10,
                                        width: 4,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: '#ea580c',
                                    }} />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </View>
    );
}
