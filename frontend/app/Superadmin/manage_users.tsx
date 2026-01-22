import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';

const { width } = Dimensions.get('window');

interface User {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
}

export default function ManageUsers() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.USERS, { headers });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user: User) => {
        const action = user.isActive ? 'Block' : 'Unblock';
        Alert.alert(
            `${action} User`,
            `Are you sure you want to ${action.toLowerCase()} access for ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${API_ENDPOINTS.USERS}/${user._id}/status`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({ isActive: !user.isActive }),
                            });

                            const data = await response.json();
                            if (data.success) {
                                fetchUsers();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update user status');
                        }
                    }
                }
            ]
        );
    };

    const handleForceLogout = (user: User) => {
        Alert.alert(
            "Security Protocol",
            `Terminating all active sessions for ${user.name}. This is a security-grade override.`,
            [{ text: "Execute Termination", style: "destructive", onPress: () => Alert.alert("Success", "Sessions purged.") }]
        );
    };

    const search = (searchQuery || '').toLowerCase();
    const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
        if (!user) return false;
        const name = String(user?.name || '').toLowerCase();
        const email = String(user?.email || '').toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#000" className="mt-20" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <View className="flex-row items-center">
                                <Ionicons name="people-circle" size={14} color="#ea580c" className="mr-2" />
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                            </View>
                            <Text className="text-2xl font-black text-black">BUYER REGISTRY</Text>
                        </View>
                        <View className="bg-black w-10 h-10 rounded-full items-center justify-center">
                            <Ionicons name="people-circle" size={24} color="white" />
                        </View>
                    </View>

                    {/* Architectural Search Bar */}
                    <View className="bg-gray-50 flex-row items-center px-5 py-4 rounded-2xl border border-gray-100 shadow-inner">
                        <Ionicons name="filter" size={18} color="#9ca3af" />
                        <TextInput
                            placeholder="Filter by name, email or ID..."
                            className="flex-1 ml-4 font-black text-gray-900 text-xs uppercase"
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Members ({filteredUsers.length})</Text>
                        <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            <Text className="text-[9px] font-black text-orange-600 uppercase">Active Feed</Text>
                        </View>
                    </View>

                    {filteredUsers.map((user) => (
                        <View key={user._id} className="bg-white rounded-[32px] border border-gray-100 p-5 mb-5 shadow-sm">
                            <TouchableOpacity
                                onPress={() => router.replace(`/Superadmin/user_details?id=${user._id}` as any)}
                                className="flex-row items-center"
                                activeOpacity={0.7}
                            >
                                <View className="w-14 h-14 rounded-[20px] bg-gray-50 items-center justify-center border border-gray-100">
                                    <Text className="text-2xl">👤</Text>
                                </View>
                                <View className="flex-1 ml-4">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-black text-gray-900" numberOfLines={1}>{user.name}</Text>
                                        <View className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-bold mt-0.5" numberOfLines={1}>{user.email}</Text>
                                    <Text className="text-gray-300 text-[9px] font-medium mt-1">ID: {user._id.slice(-8).toUpperCase()}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#e5e7eb" />
                            </TouchableOpacity>

                            {/* More Details Trigger */}
                            <TouchableOpacity
                                onPress={() => setMenuVisible(menuVisible === user._id ? null : user._id)}
                                className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center"
                            >
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Control Center</Text>
                                <Ionicons
                                    name={menuVisible === user._id ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>

                            {/* Actions */}
                            {menuVisible === user._id && (
                                <View className="mt-4 pt-4 border-t border-gray-50 flex-row">
                                    <TouchableOpacity
                                        onPress={() => handleForceLogout(user)}
                                        className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                    >
                                        <Ionicons name="power-outline" size={18} color="black" />
                                        <Text className="ml-2 font-black text-xs uppercase">Eject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => toggleUserStatus(user)}
                                        className={`flex-[1.5] items-center py-3 ${user.isActive ? 'bg-red-50' : 'bg-green-50'} rounded-2xl flex-row justify-center`}
                                    >
                                        <Ionicons name={user.isActive ? "ban-outline" : "shield-checkmark-outline"} size={18} color={user.isActive ? "#dc2626" : "#16a34a"} />
                                        <Text className={`ml-2 font-black text-xs uppercase ${user.isActive ? 'text-red-700' : 'text-green-700'}`}>
                                            {user.isActive ? 'Block Access' : 'Restore'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}

                    {filteredUsers.length === 0 && (
                        <View className="items-center justify-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <Ionicons name="search" size={40} color="#cbd5e1" />
                            <Text className="text-gray-400 font-black mt-4 uppercase text-[10px] tracking-widest">No Matches Found</Text>
                        </View>
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
