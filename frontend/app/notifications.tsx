import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_NOTIFICATIONS, { headers });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(`${API_ENDPOINTS.BUYER_NOTIFICATIONS}/${notificationId}/read`, {
                method: 'PATCH',
                headers,
            });
            setNotifications(
                notifications.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getNotificationIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'order':
                return { name: 'receipt-outline', color: '#3b82f6' };
            case 'payment':
                return { name: 'card-outline', color: '#10b981' };
            case 'delivery':
                return { name: 'cube-outline', color: '#8b5cf6' };
            case 'promotion':
                return { name: 'pricetag-outline', color: '#f59e0b' };
            case 'account':
                return { name: 'person-outline', color: '#6366f1' };
            default:
                return { name: 'notifications-outline', color: '#f97316' };
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const renderNotification = ({ item }: { item: Notification }) => {
        const icon = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                className={`mb-3 rounded-2xl overflow-hidden border ${item.isRead ? 'bg-white border-gray-100' : 'bg-primary-50 border-primary-100'
                    }`}
                onPress={() => markAsRead(item._id)}
                activeOpacity={0.7}
            >
                <View className="flex-row p-4">
                    <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: `${icon.color}20` }}
                    >
                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>

                    <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                            <Text className="text-gray-900 font-bold text-base flex-1 mr-2" numberOfLines={2}>
                                {item.title}
                            </Text>
                            {!item.isRead && (
                                <View className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                            )}
                        </View>

                        <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                            {item.message}
                        </Text>

                        <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs ml-1">{formatTime(item.createdAt)}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-bold text-gray-900">Notifications</Text>
                            {unreadCount > 0 && (
                                <Text className="text-gray-500 text-sm">{unreadCount} unread</Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
                        <Text className="text-gray-400 text-base mt-4">No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
