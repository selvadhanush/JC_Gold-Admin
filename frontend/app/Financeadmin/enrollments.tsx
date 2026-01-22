import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Enrollment {
    _id: string;
    userId: { _id: string; name: string; email: string };
    schemeId: { _id: string; name: string };
    installmentsPaid: number;
    totalInstallments: number;
    status: string;
    enrolledAt: string;
}

export default function EnrollmentsManagement() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/schemes/enrollments`, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch enrollments: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Ensure data mappings match our interface
                const mappedEnrollments = (data.data || []).map((item: any) => ({
                    ...item,
                    installmentsPaid: item.paidInstallments, // Mapping backend field if different
                    schemeId: item.scheme, // Backend uses 'scheme'
                    userId: item.user // Backend uses 'user'
                }));
                setEnrollments(mappedEnrollments);
            } else {
                console.error('Failed to fetch enrollments:', data.message);
                setEnrollments([]);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
            setEnrollments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEnrollments();
    };

    const getProgressPercentage = (paid: number, total: number) => {
        return Math.round((paid / total) * 100);
    };

    const filteredEnrollments = enrollments.filter(enrollment =>
        enrollment.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.userId.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Finance Admin</Text>
                        <Text className="text-2xl font-black text-black">Enrollments</Text>
                    </View>
                    <TouchableOpacity className="bg-emerald-600 w-10 h-10 rounded-full items-center justify-center shadow-lg">
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="bg-gray-50 rounded-2xl px-4 py-3 flex-row items-center">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-base"
                        placeholder="Search by user name or email..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    {loading ? (
                        <Text className="text-center text-gray-500">Loading enrollments...</Text>
                    ) : filteredEnrollments.length === 0 ? (
                        <View className="items-center py-20">
                            <Ionicons name="people-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No enrollments found</Text>
                        </View>
                    ) : (
                        filteredEnrollments.map((enrollment) => {
                            const progress = getProgressPercentage(enrollment.installmentsPaid, enrollment.totalInstallments);
                            return (
                                <TouchableOpacity
                                    key={enrollment._id}
                                    className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <Text className="text-black font-black text-lg">{enrollment.userId.name}</Text>
                                            <Text className="text-gray-500 text-sm mt-1">{enrollment.userId.email}</Text>
                                        </View>
                                        <View className={`px-3 py-1 rounded-full ${enrollment.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                            <Text className={`text-xs font-bold ${enrollment.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                {enrollment.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="bg-purple-50 rounded-2xl p-3 mb-4">
                                        <Text className="text-purple-600 font-bold text-sm">{enrollment.schemeId.name}</Text>
                                    </View>

                                    {/* Progress Bar */}
                                    <View className="mb-4">
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Progress</Text>
                                            <Text className="text-emerald-600 font-black text-sm">{progress}%</Text>
                                        </View>
                                        <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <View
                                                className="bg-emerald-600 h-full rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between pt-4 border-t border-gray-50">
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Paid</Text>
                                            <Text className="text-black font-black text-base">{enrollment.installmentsPaid}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Total</Text>
                                            <Text className="text-black font-black text-base">{enrollment.totalInstallments}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Enrolled</Text>
                                            <Text className="text-black font-bold text-sm">
                                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
