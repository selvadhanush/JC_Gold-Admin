import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';

const { width } = Dimensions.get('window');

export default function CMSControl() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        fetchCMSData();
    }, []);

    const fetchCMSData = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.SUPER_CMS_BANNER, { headers });
            const data = await response.json();
            if (data.success) {
                setBanners(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = () => {
        Alert.prompt(
            "Broadcast Protocol",
            "Enter the emergency or announcement message to push to all active buyer nodes.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Execute Broadcast",
                    onPress: (msg) => Alert.alert("Transmission Successful", "Announcement broadcasted to all active sessions.")
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[4px] mt-6">Loading Architecture...</Text>
                </View>
            </SafeAreaView>
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
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4 border border-gray-100"
                        >
                            <Ionicons name="chevron-back" size={20} color="black" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                            <Text className="text-2xl font-black text-black">CONTENT COMMAND</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleBroadcast}
                        className="w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-600/30"
                    >
                        <Ionicons name="megaphone" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="p-6">
                    {/* Communication Tools */}
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6 ml-1">Transmission Protocols</Text>

                    <View className="flex-row justify-between mb-10">
                        <TouchableOpacity className="bg-indigo-950 p-6 rounded-[32px] w-[48%] shadow-xl shadow-indigo-950/20">
                            <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center mb-4">
                                <Ionicons name="notifications" size={20} color="#818cf8" />
                            </View>
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Push Alert</Text>
                            <Text className="text-indigo-300 text-[9px] font-medium mt-1">Direct to device</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-white border border-gray-100 p-6 rounded-[32px] w-[48%] shadow-sm">
                            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-4">
                                <Ionicons name="mail" size={20} color="#4f46e5" />
                            </View>
                            <Text className="text-black font-black text-xs uppercase tracking-widest">Newsletter</Text>
                            <Text className="text-gray-400 text-[9px] font-medium mt-1">Bulk email dispatch</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Banner Management */}
                    <View className="flex-row justify-between items-center mb-6 px-1">
                        <View>
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Visual Banners</Text>
                            <Text className="text-gray-900 font-bold text-xs mt-1">{banners.length} Active Modules</Text>
                        </View>
                        <TouchableOpacity className="bg-indigo-50 px-4 py-2 rounded-full flex-row items-center border border-indigo-100">
                            <Ionicons name="add" size={16} color="#4f46e5" />
                            <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest ml-1">New Asset</Text>
                        </TouchableOpacity>
                    </View>

                    {banners.map((item, i) => (
                        <View key={i} className="bg-white rounded-[40px] border border-gray-100 mb-8 overflow-hidden shadow-sm">
                            <View className="h-48 bg-gray-50 relative">
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <View className="w-full h-full items-center justify-center">
                                        <Ionicons name="image" size={40} color="#e2e8f0" />
                                    </View>
                                )}
                                <View className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Text className="text-white font-black text-[8px] uppercase tracking-widest">Priority {i + 1}</Text>
                                </View>
                            </View>
                            <View className="p-6">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-black font-black text-lg leading-tight">{item.title}</Text>
                                        <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter mt-1">Status: Operational</Text>
                                    </View>
                                    <View className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                                        <Text className="text-green-600 font-black text-[8px] uppercase tracking-widest">Active</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-500 text-xs font-medium leading-5 mb-6">{item.description}</Text>
                                <View className="h-[1px] bg-gray-50 w-full mb-6" />
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                                        <Text className="text-gray-400 font-bold text-[10px] ml-1 uppercase">2.4k Views</Text>
                                    </View>
                                    <View className="flex-row space-x-3">
                                        <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center border border-gray-100">
                                            <Ionicons name="create-outline" size={18} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center border border-red-100">
                                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Legal & Static Content */}
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mt-4 mb-6 ml-1">Legal Dossiers</Text>

                    <View className="bg-gray-50 rounded-[40px] p-2 border border-gray-100">
                        {['Terms of Service', 'Privacy Policy', 'Refund Architecture', 'Technical FAQ'].map((title, i) => (
                            <TouchableOpacity
                                key={i}
                                className={`p-6 flex-row items-center justify-between ${i !== 3 ? 'border-b border-gray-200/50' : ''}`}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mr-4 border border-gray-100">
                                        <Ionicons name="document-text" size={20} color="#4f46e5" />
                                    </View>
                                    <View>
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">{title}</Text>
                                        <Text className="text-gray-400 text-[9px] font-medium mt-0.5">Last modified: 24 Oct 2023</Text>
                                    </View>
                                </View>
                                <View className="bg-white w-8 h-8 rounded-full items-center justify-center border border-gray-100">
                                    <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bottom Padding */}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
