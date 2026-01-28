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
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import SuperAdminSubNav from '../../components/SuperAdminSubNav';
import { Skeleton } from '../../components/Skeleton';

interface GeneralTicket {
    _id: string;
    ticketId: string;
    subject: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    user: {
        _id: string;
        name: string;
        email: string;
    } | null;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
    respondedAt?: string;
}

export default function GeneralTickets() {
    const router = useRouter();
    const [tickets, setTickets] = useState<GeneralTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<GeneralTicket | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_ADMIN, { headers });
            const data = await response.json();
            if (data.success) {
                const mappedTickets: GeneralTicket[] = data.data.map((item: any) => ({
                    _id: item._id,
                    ticketId: `GEN-${item._id.substr(-6).toUpperCase()}`,
                    subject: item.subject,
                    message: item.message,
                    priority: item.priority || 'MEDIUM',
                    status: item.status,
                    user: item.user || null,
                    adminResponse: item.adminResponse,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    respondedAt: item.respondedAt
                }));

                setTickets(mappedTickets);
                // Update selected ticket if it's open
                if (selectedTicket) {
                    const updated = mappedTickets.find(t => t._id === selectedTicket._id);
                    if (updated) setSelectedTicket(updated);
                }
            }
        } catch (error) {
            console.error('Error fetching general tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTicket = async (id: string, updates: any) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_UPDATE(id), {
                method: 'PUT',
                headers,
                body: JSON.stringify(updates),
            });
            const data = await response.json();
            if (data.success) {
                fetchTickets();
                Alert.alert('Success', 'Ticket updated successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update ticket');
        }
    };

    const handleSendReply = async () => {
        if (!adminReply.trim()) return;
        setReplying(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_UPDATE(selectedTicket?._id || ''), {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    adminResponse: adminReply,
                    status: 'RESOLVED' // Auto-resolve on reply
                }),
            });
            const data = await response.json();
            if (data.success) {
                setAdminReply('');
                fetchTickets();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        (ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.ticketId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#ea580c';
            case 'MEDIUM': return '#d97706';
            default: return '#059669';
        }
    };

    const renderTicketDetail = () => (
        <Modal
            visible={!!selectedTicket}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setSelectedTicket(null)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 bg-black/60 justify-end relative"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setSelectedTicket(null)}
                    className="absolute inset-0"
                />
                <View className="bg-white h-[85%] rounded-t-[32px] overflow-hidden shadow-2xl w-full">
                    {/* Header */}
                    <View className="px-6 py-5 border-b border-gray-100 flex-row justify-between items-center bg-white z-10">
                        <View className="flex-1 mr-4">
                            <View className="flex-row items-center mb-1">
                                <View className={`px-2 py-0.5 rounded-md ${selectedTicket?.priority === 'HIGH' ? 'bg-red-50' : selectedTicket?.priority === 'MEDIUM' ? 'bg-orange-50' : 'bg-green-50'}`}>
                                    <Text className={`text-[10px] font-black uppercase ${selectedTicket?.priority === 'HIGH' ? 'text-red-600' : selectedTicket?.priority === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'}`}>
                                        {selectedTicket?.priority} Priority
                                    </Text>
                                </View>
                                <Text className="ml-2 text-gray-400 text-[10px] font-bold">#{selectedTicket?.ticketId}</Text>
                            </View>
                            <Text className="text-xl font-black text-gray-900 leading-6" numberOfLines={2}>
                                {selectedTicket?.subject}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setSelectedTicket(null)}
                            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        {/* Original Query Context */}
                        <View className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                            <View className="flex-row items-center mb-3">
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center border border-gray-100 mr-3">
                                    <Text className="text-sm">👤</Text>
                                </View>
                                <View>
                                    <Text className="text-xs font-black text-gray-900">{selectedTicket?.user?.name || 'User'}</Text>
                                    <Text className="text-[10px] text-gray-400 font-medium">Original Query</Text>
                                </View>
                            </View>
                            <Text className="text-gray-700 font-medium leading-5">{selectedTicket?.message}</Text>
                            <Text className="text-[9px] font-bold text-gray-400 mt-3 text-right">
                                {selectedTicket && new Date(selectedTicket.createdAt).toLocaleString()}
                            </Text>
                        </View>

                        {/* Admin Response Thread */}
                        {selectedTicket?.adminResponse && (
                            <View className="mb-6 flex-row justify-end">
                                <View className="max-w-[85%]">
                                    <View className="bg-orange-500 rounded-2xl rounded-tr-none px-5 py-3 shadow-sm mb-1">
                                        <Text className="text-white font-medium leading-5">{selectedTicket.adminResponse}</Text>
                                    </View>
                                    <Text className="text-[9px] font-bold text-gray-400 text-right mr-1">
                                        {selectedTicket.respondedAt && new Date(selectedTicket.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • You
                                    </Text>
                                </View>
                            </View>
                        )}
                        <View className="h-6" />
                    </ScrollView>

                    {/* Action Bar */}
                    <View className="p-4 border-t border-gray-100 bg-white pb-8">
                        {/* Reply Input */}
                        <View className="flex-row items-center gap-3 mb-4">
                            <View className="flex-1 flex-row items-center bg-gray-50 px-4 py-1 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white transition-all">
                                <TextInput
                                    placeholder="Type your reply here..."
                                    className="flex-1 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholderTextColor="#9ca3af"
                                    value={adminReply}
                                    onChangeText={setAdminReply}
                                    multiline
                                    maxLength={500}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={handleSendReply}
                                disabled={replying || !adminReply.trim()}
                                className={`w-12 h-12 rounded-full items-center justify-center shadow-lg transform active:scale-95 ${!adminReply.trim() ? 'bg-gray-200' : 'bg-orange-600 shadow-orange-200'}`}
                            >
                                {replying ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="arrow-up" size={24} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'RESOLVED' })}
                                className="flex-1 flex-row items-center justify-center bg-green-50 py-3.5 rounded-xl border border-green-100 active:bg-green-100"
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
                                <Text className="ml-2 text-green-700 font-bold text-xs uppercase tracking-wide">Resolve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'CLOSED' })}
                                className="flex-1 flex-row items-center justify-center bg-gray-50 py-3.5 rounded-xl border border-gray-200 active:bg-gray-100"
                            >
                                <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
                                <Text className="ml-2 text-gray-600 font-bold text-xs uppercase tracking-wide">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" />

                {/* Header Skeleton */}
                <View className="bg-white px-6 pt-14 pb-6 rounded-b-[32px] shadow-sm">
                    <View className="flex-row justify-between items-start mb-6">
                        <View>
                            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                            <Skeleton width={200} height={28} />
                        </View>
                        <Skeleton width={48} height={48} borderRadius={16} />
                    </View>
                    <Skeleton width="100%" height={48} borderRadius={16} />
                </View>

                {/* SubNav Skeleton placeholder */}
                <View className="mt-4 px-6 flex-row">
                    <Skeleton width={100} height={32} borderRadius={16} style={{ marginRight: 12 }} />
                    <Skeleton width={100} height={32} borderRadius={16} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6', padding: 20, marginBottom: 16 }}>
                            <View className="flex-row justify-between items-start mb-4">
                                <Skeleton width={60} height={14} borderRadius={6} />
                                <Skeleton width={60} height={18} borderRadius={12} />
                            </View>
                            <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
                            <Skeleton width="70%" height={14} style={{ marginBottom: 16 }} />
                            <View className="pt-4 border-t border-gray-50 flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
                                    <Skeleton width={80} height={10} />
                                </View>
                                <Skeleton width={40} height={10} />
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Section */}
            <View className="bg-white px-6 pt-14 pb-6 rounded-b-[32px] shadow-sm z-10">
                <View className="flex-row justify-between items-start mb-6">
                    <View>
                        <Text className="text-orange-600/80 text-[10px] font-black uppercase tracking-widest mb-1.5">Support Dashboard</Text>
                        <Text className="text-2xl font-black text-gray-900 tracking-tight">General Tickets</Text>
                    </View>
                    <View className="bg-orange-50 w-12 h-12 rounded-2xl items-center justify-center border border-orange-100">
                        <Ionicons name="chatbubbles-outline" size={24} color="#f97316" />
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-gray-50 flex-row items-center px-4 py-3.5 rounded-xl border border-gray-100">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        placeholder="Search tickets by ID, subject or user..."
                        className="flex-1 ml-3 font-medium text-gray-900 text-sm"
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View className="mt-4">
                <SuperAdminSubNav activeTab="general-tickets" />
            </View>

            <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {filteredTickets.map((ticket) => (
                    <TouchableOpacity
                        key={ticket._id}
                        onPress={() => setSelectedTicket(ticket)}
                        activeOpacity={0.7}
                        className="bg-white p-5 rounded-2xl mb-4 border border-gray-100 shadow-sm"
                    >
                        <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-row items-center gap-2">
                                <View className={`w-2 h-2 rounded-full ${ticket.priority === 'HIGH' ? 'bg-red-500' : ticket.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                <Text className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">#{ticket.ticketId}</Text>
                            </View>
                            <View className={`px-2.5 py-1 rounded-lg ${ticket.status === 'RESOLVED' ? 'bg-green-50 border border-green-100' : ticket.status === 'OPEN' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                                <Text className={`text-[9px] font-black uppercase tracking-wide ${ticket.status === 'RESOLVED' ? 'text-green-700' : ticket.status === 'OPEN' ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {ticket.status}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-base font-bold text-gray-900 mb-1.5 leading-snug">{ticket.subject}</Text>
                        <Text className="text-gray-500 text-xs font-medium leading-5 mb-4" numberOfLines={2}>{ticket.message}</Text>

                        <View className="flex-row items-center justify-between pt-4 border-t border-gray-50">
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center mr-2 border border-gray-200">
                                    <Text className="text-[10px]">👤</Text>
                                </View>
                                <Text className="text-gray-600 font-bold text-[10px] uppercase truncate max-w-[120px]">{ticket.user?.name || 'Unknown User'}</Text>
                            </View>
                            <Text className="text-[10px] font-medium text-gray-400">
                                {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredTickets.length === 0 && (
                    <View className="items-center justify-center py-24">
                        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="chatbox-ellipses-outline" size={32} color="#94a3b8" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg mb-1">No tickets found</Text>
                        <Text className="text-gray-500 text-sm">Try adjusting your search filters</Text>
                    </View>
                )}
            </ScrollView>
            {renderTicketDetail()}
        </View>
    );
}
