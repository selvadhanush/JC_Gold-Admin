import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';
import Skeleton from '../../components/Skeleton';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/admin/notifications`, { headers });
            const data = await response.json();

            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/admin/notifications/${id}/read`, {
                method: 'PATCH',
                headers
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/admin/notifications/read-all`, {
                method: 'PATCH',
                headers
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getTypeIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case 'ORDER_UPDATE': return { name: 'receipt', color: '#2563eb', bg: '#dbeafe' };
            case 'ADMIN_ALERT': return { name: 'warning', color: '#dc2626', bg: '#fee2e2' };
            case 'SYSTEM': return { name: 'settings', color: '#6b7280', bg: '#f3f4f6' };
            default: return { name: 'notifications', color: '#6b7280', bg: '#f3f4f6' };
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header Skeleton */}
                <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Skeleton width={40} height={40} className="rounded-xl mr-4" />
                            <View>
                                <Skeleton width={60} height={10} className="mb-2" />
                                <Skeleton width={150} height={24} />
                            </View>
                        </View>
                        <Skeleton width={40} height={40} className="rounded-xl" />
                    </View>
                </View>

                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <View key={i} className="flex-row p-5 rounded-[28px] mb-4 border border-gray-100 items-center">
                            <Skeleton width={48} height={48} className="rounded-2xl mr-4" />
                            <View className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Skeleton width="60%" height={16} />
                                    <Skeleton width={40} height={10} />
                                </View>
                                <Skeleton width="90%" height={12} className="mb-2" />
                                <Skeleton width="40%" height={12} />
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 pt-12 pb-6 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4"
                        >
                            <Ionicons name="chevron-back" size={20} color="#000" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">Updates</Text>
                            <Text className="text-2xl font-black text-black">NOTIFICATIONS</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={markAllRead}
                        className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50"
                    >
                        <Ionicons name="checkmark-done" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
            >
                {notifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Ionicons name="notifications-off-outline" size={64} color="#e5e7eb" />
                        <Text className="text-gray-400 font-bold mt-4">No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((item) => {
                        const icon = getTypeIcon(item.type);
                        return (
                            <TouchableOpacity
                                key={item._id}
                                onPress={() => !item.isRead && markAsRead(item._id)}
                                className={`flex-row p-5 rounded-[28px] mb-4 border ${item.isRead ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <View
                                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                                    style={{ backgroundColor: icon.bg }}
                                >
                                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className={`flex-1 font-black text-base ${item.isRead ? 'text-gray-700' : 'text-black'}`}>
                                            {item.title}
                                        </Text>
                                        <Text className="text-gray-400 text-[10px] font-bold uppercase ml-2">
                                            {formatTime(item.createdAt)}
                                        </Text>
                                    </View>
                                    <Text className={`text-sm leading-relaxed ${item.isRead ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                                        {item.message}
                                    </Text>
                                </View>
                                {!item.isRead && (
                                    <View className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-2" />
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
