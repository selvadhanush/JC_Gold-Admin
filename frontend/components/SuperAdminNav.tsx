import React from 'react';
import { View, TouchableOpacity, Text, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SuperAdminNavProps {
    activeTab?: 'dashboard' | 'admins' | 'users' | 'audit' | 'settings' | 'rates';
}

import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SuperAdminNav({ activeTab }: SuperAdminNavProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const tabs = [
        { id: 'dashboard', label: 'Home', icon: 'terminal-outline', activeIcon: 'terminal', route: '/Superadmin' },
        { id: 'rates', label: 'Rates', icon: 'trending-up-outline', activeIcon: 'trending-up', route: '/Superadmin/manage_gold_rates' },
        { id: 'admins', label: 'Admins', icon: 'id-card-outline', activeIcon: 'id-card', route: '/Superadmin/manage_admins' },
        { id: 'users', label: 'Buyers', icon: 'people-circle-outline', activeIcon: 'people-circle', route: '/Superadmin/manage_users' },
        { id: 'settings', label: 'System', icon: 'construct-outline', activeIcon: 'construct', route: '/Superadmin/system_settings' },
    ];

    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
            <BlurView
                intensity={90}
                tint="light"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
                    paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 15,
                    paddingTop: 15,
                    height: 70 + (insets.bottom > 0 ? insets.bottom / 2 : 0),
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
                            onPress={() => router.push(tab.route as any)}
                            className="items-center justify-center flex-1 h-full"
                            activeOpacity={0.7}
                        >
                            <View className="items-center justify-center">
                                <View
                                    style={{
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 16,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        backgroundColor: isActive ? '#fff7ed' : 'transparent',
                                        minWidth: 50,
                                    }}
                                >
                                    <Ionicons
                                        name={(isActive ? tab.activeIcon : tab.icon) as any}
                                        size={22}
                                        color={isActive ? '#ea580c' : '#64748b'}
                                    />
                                    <Text
                                        className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isActive ? 'text-orange-600' : 'text-gray-400'
                                            }`}
                                    >
                                        {tab.label}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: -10,
                                            width: 20,
                                            height: 4,
                                            borderRadius: 2,
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
