import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Installment {
    _id: string;
    enrollmentId: string;
    userId: { name: string; email: string };
    schemeName: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: string;
}

export default function InstallmentsManagement() {
    const router = useRouter();
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/schemes/installments`, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch installments: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Map backend data to our interface
                const mappedInstallments = (data.data || []).map((item: any) => ({
                    ...item,
                    enrollmentId: item.userScheme?._id,
                    schemeName: item.userScheme?.scheme?.name || 'N/A',
                    userId: item.user, // Already populated in backend if implemented
                }));
                setInstallments(mappedInstallments);
            } else {
                console.error('Failed to fetch installments:', data.message);
                setInstallments([]);
            }
        } catch (error) {
            console.error('Failed to fetch installments:', error);
            setInstallments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInstallments();
    };

    const handleRecordPayment = async (installmentId: string) => {
        Alert.alert(
            'Record Payment',
            'Confirm installment payment received?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/schemes/installments/${installmentId}/pay`, {
                                method: 'PATCH',
                                headers,
                            });

                            const data = await response.json();

                            if (response.ok && data.success) {
                                Alert.alert('Success', 'Payment recorded successfully');
                                fetchInstallments();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to record payment');
                            }
                        } catch (error) {
                            console.error('Record Payment Error:', error);
                            Alert.alert('Error', 'Failed to connect to server');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'checkmark-circle' };
            case 'PENDING': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'time' };
            case 'OVERDUE': return { bg: 'bg-red-50', text: 'text-red-600', icon: 'alert-circle' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'help-circle' };
        }
    };

    const filteredInstallments = installments.filter(inst =>
        filterStatus === 'ALL' || inst.status === filterStatus
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
                        <Text className="text-2xl font-black text-black">Installments</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === status ? 'bg-emerald-600' : 'bg-gray-100'}`}
                        >
                            <Text className={`font-bold text-xs ${filterStatus === status ? 'text-white' : 'text-gray-600'}`}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    {loading ? (
                        <Text className="text-center text-gray-500">Loading installments...</Text>
                    ) : filteredInstallments.length === 0 ? (
                        <View className="items-center py-20">
                            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No installments found</Text>
                        </View>
                    ) : (
                        filteredInstallments.map((installment) => {
                            const statusColor = getStatusColor(installment.status);
                            return (
                                <View
                                    key={installment._id}
                                    className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <Text className="text-black font-black text-lg">₹{installment.amount}</Text>
                                            <Text className="text-gray-500 text-sm mt-1">{installment.userId.name}</Text>
                                        </View>
                                        <View className={`px-3 py-1 rounded-full ${statusColor.bg} flex-row items-center`}>
                                            <Ionicons name={statusColor.icon as any} size={12} color={statusColor.text.replace('text-', '#')} />
                                            <Text className={`text-xs font-bold ml-1 ${statusColor.text}`}>
                                                {installment.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="bg-amber-50 rounded-2xl p-3 mb-4">
                                        <Text className="text-amber-600 font-bold text-sm">{installment.schemeName}</Text>
                                    </View>

                                    <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                                        <View>
                                            <Text className="text-gray-400 text-xs font-bold uppercase">Due Date</Text>
                                            <Text className="text-black font-bold text-sm">
                                                {new Date(installment.dueDate).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        {installment.status === 'PENDING' && (
                                            <TouchableOpacity
                                                onPress={() => handleRecordPayment(installment._id)}
                                                className="bg-emerald-600 px-6 py-3 rounded-full"
                                            >
                                                <Text className="text-white font-black text-sm">Record Payment</Text>
                                            </TouchableOpacity>
                                        )}

                                        {installment.paidDate && (
                                            <View>
                                                <Text className="text-gray-400 text-xs font-bold uppercase">Paid On</Text>
                                                <Text className="text-emerald-600 font-bold text-sm">
                                                    {new Date(installment.paidDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
