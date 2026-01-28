import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SubNavItem {
    id: string;
    label: string;
    icon: any;
    route: string;
}

interface SuperAdminSubNavProps {
    activeTab: 'registry' | 'kyc' | 'tickets' | 'general-tickets';
}

export default function SuperAdminSubNav({ activeTab }: SuperAdminSubNavProps) {
    const router = useRouter();

    const items: SubNavItem[] = [
        { id: 'registry', label: 'Buyer Registry', icon: 'people-circle-outline', route: '/Superadmin/manage_users' },
        { id: 'kyc', label: 'KYC Verification', icon: 'shield-checkmark-outline', route: '/Superadmin/manage_kyc' },
        { id: 'tickets', label: 'Support Tickets', icon: 'ticket-outline', route: '/Superadmin/manage_tickets' },
        { id: 'general-tickets', label: 'General Tickets', icon: 'chatbubbles-outline', route: '/Superadmin/general_tickets' },
    ];

    return (
        <View className="bg-white border-b border-gray-100">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
            >
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => router.push(item.route as any)}
                            className={`flex-row items-center px-6 py-3 rounded-2xl mr-3 ${isActive ? 'bg-black shadow-lg shadow-black/20' : 'bg-gray-50'
                                }`}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? item.icon.replace('-outline', '') : item.icon}
                                size={18}
                                color={isActive ? '#f97316' : '#9ca3af'}
                            />
                            <Text className={`ml-3 text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-400'
                                }`}>
                                {item.label}
                            </Text>
                            {isActive && (
                                <View className="ml-2 w-1.5 h-1.5 rounded-full bg-orange-500" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
