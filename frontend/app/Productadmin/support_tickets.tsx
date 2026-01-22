import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';
import Toast from 'react-native-toast-message';

export default function ProductSupportTickets() {
    const router = useRouter();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [response, setResponse] = useState('');
    const [responding, setResponding] = useState(false);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/api/v1/support/admin`, { headers });
            const data = await res.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const handleRespond = async () => {
        if (!response.trim()) return;

        setResponding(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BASE_URL}/api/v1/support/admin/${selectedTicket._id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    adminResponse: response,
                    status: 'RESOLVED',
                }),
            });

            const data = await res.json();
            if (data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Reply Sent',
                    text2: 'The ticket has been marked as resolved.'
                });
                setSelectedTicket(null);
                setResponse('');
                fetchTickets();
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to send response'
            });
        } finally {
            setResponding(false);
        }
    };

    const renderTicketCard = (ticket: any) => (
        <TouchableOpacity
            key={ticket._id}
            onPress={() => setSelectedTicket(ticket)}
            className="bg-white rounded-[32px] p-6 mb-4 border border-gray-100 shadow-sm"
        >
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        Order #{ticket.order?.orderNumber}
                    </Text>
                    <Text className="text-gray-900 font-black text-lg" numberOfLines={1}>{ticket.subject}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${ticket.status === 'OPEN' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <Text className={`text-[10px] font-black uppercase ${ticket.status === 'OPEN' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {ticket.status}
                    </Text>
                </View>
            </View>

            <Text className="text-gray-500 font-medium text-sm mb-4" numberOfLines={2}>
                {ticket.message}
            </Text>

            <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center mr-2">
                        <Ionicons name="person" size={14} color="#ea580c" />
                    </View>
                    <Text className="text-gray-900 font-bold text-xs">{ticket.user?.name}</Text>
                </View>
                <Text className="text-gray-400 font-bold text-[10px] uppercase">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#ea580c" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 mr-4"
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-gray-900">Product Support</Text>
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
            >
                {tickets.length > 0 ? (
                    tickets.map(renderTicketCard)
                ) : (
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 bg-gray-100 rounded-[32px] items-center justify-center mb-4">
                            <Ionicons name="chatbubbles-outline" size={32} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-900 font-black text-lg">All Clear</Text>
                        <Text className="text-gray-400 font-medium text-center mt-1 px-10">
                            No product-related support tickets at the moment.
                        </Text>
                    </View>
                )}
                <View className="h-20" />
            </ScrollView>

            {/* Response Modal */}
            <Modal visible={!!selectedTicket} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8 max-h-[90%]">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black text-gray-900">Reply to Ticket</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedTicket(null)}
                                className="w-10 h-10 items-center justify-center rounded-full bg-gray-50"
                            >
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="bg-gray-50 rounded-[32px] p-6 mb-8">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Customer Inquiry</Text>
                                <Text className="text-gray-900 font-black text-lg mb-2">{selectedTicket?.subject}</Text>
                                <Text className="text-gray-600 font-medium leading-relaxed">{selectedTicket?.message}</Text>
                            </View>

                            <View className="mb-8">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Your Response</Text>
                                <TextInput
                                    placeholder="Type your official response here..."
                                    value={response}
                                    onChangeText={setResponse}
                                    multiline
                                    numberOfLines={6}
                                    className="bg-gray-50 rounded-[28px] p-6 text-gray-900 font-medium h-40 border border-gray-100"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleRespond}
                                disabled={responding || !response.trim()}
                                className={`h-16 rounded-[28px] items-center justify-center shadow-xl shadow-orange-500/30 ${responding || !response.trim() ? 'bg-gray-300' : 'bg-orange-600'}`}
                            >
                                {responding ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest text-xs">Send Response</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
