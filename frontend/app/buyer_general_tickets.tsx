import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    StatusBar,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import Toast from 'react-native-toast-message';

interface GeneralTicket {
    _id: string;
    subject: string;
    message: string;
    status: string;
    adminResponse?: string;
    createdAt: string;
    respondedAt?: string;
}

export default function BuyerGeneralTickets() {
    const router = useRouter();
    const [tickets, setTickets] = useState<GeneralTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_MY, { headers });
            const data = await response.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch tickets' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all fields' });
            return;
        }

        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_CREATE, {
                method: 'POST',
                headers,
                body: JSON.stringify({ subject, message }),
            });
            const data = await response.json();
            if (data.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Ticket submitted to Super Admin' });
                setModalVisible(false);
                setSubject('');
                setMessage('');
                fetchTickets();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit ticket' });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return '#3b82f6';
            case 'RESOLVED': return '#10b981';
            case 'CLOSED': return '#6b7280';
            default: return '#f59e0b';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50">
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-lg font-black text-gray-900">General Enquiries</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} className="w-10 h-10 items-center justify-center rounded-xl bg-orange-500">
                    <Ionicons name="add" size={26} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} />}
            >
                <View className="py-6">
                    <Text className="text-2xl font-black text-gray-900 mb-2">My Enquiries</Text>
                    <Text className="text-gray-400 font-medium mb-8">Direct communication with our Super Admin team.</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#ea580c" className="mt-10" />
                    ) : tickets.length === 0 ? (
                        <View className="items-center justify-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                            <Ionicons name="chatbubbles-outline" size={60} color="#cbd5e1" />
                            <Text className="text-gray-400 font-bold mt-4">No enquiries yet</Text>
                            <TouchableOpacity onPress={() => setModalVisible(true)} className="mt-4 bg-orange-500 px-6 py-3 rounded-2xl">
                                <Text className="text-white font-black text-xs uppercase">Start New Enquiry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        tickets.map((ticket) => (
                            <View key={ticket._id} className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getStatusColor(ticket.status) }} />
                                        <Text className="font-black text-[10px] uppercase tracking-widest" style={{ color: getStatusColor(ticket.status) }}>{ticket.status}</Text>
                                    </View>
                                    <Text className="text-[10px] text-gray-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                                </View>

                                <Text className="text-lg font-black text-gray-900 mb-2">{ticket.subject}</Text>
                                <Text className="text-gray-500 font-medium mb-4">{ticket.message}</Text>

                                {ticket.adminResponse && (
                                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons name="shield-checkmark" size={16} color="#ea580c" />
                                            <Text className="ml-2 font-black text-[10px] text-gray-400 uppercase tracking-widest">Super Admin Response</Text>
                                        </View>
                                        <Text className="text-gray-700 font-bold text-sm italic">"{ticket.adminResponse}"</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
                <View className="h-20" />
            </ScrollView>

            {/* New Inquiry Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/50 justify-end"
                >
                    <View className="bg-white rounded-t-[40px] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black text-gray-900">New Enquiry</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={32} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-4">Inquiry Details</Text>
                                <View className="bg-gray-50 rounded-[28px] border border-gray-100 p-6">
                                    <TextInput
                                        placeholder="Subject"
                                        value={subject}
                                        onChangeText={setSubject}
                                        className="text-gray-900 font-bold mb-4 border-b border-gray-200 pb-2"
                                        placeholderTextColor="#9ca3af"
                                    />
                                    <TextInput
                                        placeholder="Describe your enquiry in detail..."
                                        value={message}
                                        onChangeText={setMessage}
                                        multiline
                                        numberOfLines={6}
                                        className="text-gray-900 font-medium h-32"
                                        style={{ textAlignVertical: 'top' }}
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={submitting}
                                className="h-16 bg-black rounded-[28px] items-center justify-center shadow-xl shadow-black/20"
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest text-xs">Submit to Super Admin</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View className="h-10" />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
