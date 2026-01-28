import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FinanceAdminNavProps {
    activeTab?: 'dashboard' | 'orders' | 'schemes' | 'records' | 'refunds' | 'reports';
    navigation?: any;
}

export default function FinanceAdminNav({ activeTab, navigation }: FinanceAdminNavProps) {
    const router = useRouter();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'cash-outline', activeIcon: 'cash', route: '/Financeadmin', screen: 'index' },
        { id: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', route: '/Financeadmin/waiting_confirmation', screen: 'waiting_confirmation' },
        { id: 'schemes', label: 'Schemes', icon: 'diamond-outline', activeIcon: 'diamond', route: '/Financeadmin/schemes', screen: 'schemes' },
        { id: 'records', label: 'Hub', icon: 'grid-outline', activeIcon: 'grid', route: '/Financeadmin/gold_schemes_hub', screen: 'gold_schemes_hub' },
        { id: 'refunds', label: 'Refunds', icon: 'return-down-back-outline', activeIcon: 'return-down-back', route: '/Financeadmin/refunds', screen: 'refunds' },
        { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', route: '/Financeadmin/reports', screen: 'reports' },
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
                    borderTopColor: 'rgba(16, 185, 129, 0.1)',
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
                                if (navigation) {
                                    navigation.navigate(tab.screen);
                                } else {
                                    router.push(tab.route as any);
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
                                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                }}>
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={20}
                                        color={isActive ? '#10b981' : '#4b5563'}
                                    />
                                    <Text
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        style={{
                                            fontSize: 9,
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: -0.2,
                                            marginTop: 3,
                                            color: isActive ? '#059669' : '#6b7280',
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
                                        backgroundColor: '#10b981',
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
