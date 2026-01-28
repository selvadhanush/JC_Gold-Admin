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

interface Ticket {
    _id: string;
    ticketId: string;
    title: string;
    description: string;
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    user: {
        _id: string;
        name: string;
        email: string;
    } | null;
    messages: {
        sender: string;
        senderModel: 'User' | 'Admin';
        message: string;
        createdAt: string;
    }[];
    createdAt: string;
}

export default function ManageTickets() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_SUPPORT, { headers });
            const data = await response.json();
            if (data.success) {
                const mappedTickets: Ticket[] = data.data.map((item: any) => {
                    const messages: {
                        sender: string;
                        senderModel: 'User' | 'Admin';
                        message: string;
                        createdAt: string;
                    }[] = [
                            {
                                sender: item.user?.name || 'User',
                                senderModel: 'User',
                                message: item.message,
                                createdAt: item.createdAt
                            }
                        ];

                    if (item.adminResponse) {
                        messages.push({
                            sender: 'Admin',
                            senderModel: 'Admin' as const,
                            message: item.adminResponse,
                            createdAt: item.respondedAt || item.updatedAt
                        });
                    }

                    return {
                        _id: item._id,
                        ticketId: `TKT-${item._id.substr(-6).toUpperCase()}`,
                        title: item.subject,
                        description: item.message,
                        category: item.category,
                        priority: item.priority || 'MEDIUM',
                        status: item.status,
                        user: item.user || null,
                        messages: messages,
                        createdAt: item.createdAt
                    };
                });

                setTickets(mappedTickets);
                // Update selected ticket if it's open
                if (selectedTicket) {
                    const updated = mappedTickets.find(t => t._id === selectedTicket._id);
                    if (updated) setSelectedTicket(updated);
                }
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTicket = async (id: string, updates: any) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_SUPPORT_UPDATE(id), {
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
            const response = await fetch(API_ENDPOINTS.ADMIN_SUPPORT_UPDATE(selectedTicket?._id || ''), {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    adminResponse: adminReply,
                    status: 'RESOLVED' // Auto-resolve on reply, or keep 'IN_PROGRESS'
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

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = (ticket.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.ticketId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        const category = (ticket.category || '').toLowerCase();
        const isOthers = category === 'others' || category === 'general';

        // Exclude general/others tickets as they have their own page
        return matchesSearch && !isOthers;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return '#dc2626';
            case 'HIGH': return '#ea580c';
            case 'MEDIUM': return '#d97706';
            default: return '#059669';
        }
    };

    const renderTicketDetail = () => (
        <Modal
            visible={!!selectedTicket}
            animationType="slide"
            transparent={true}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 bg-black/50 justify-end"
            >
                <View className="bg-white rounded-t-[40px] h-[90%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{selectedTicket?.ticketId}</Text>
                            <Text className="text-xl font-black text-black">{selectedTicket?.title}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                            <Ionicons name="close-circle" size={32} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Request Details</Text>
                            <Text className="text-gray-700 font-bold mb-4">{selectedTicket?.description}</Text>
                            <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</Text>
                                <Text className="font-black text-[10px] uppercase" style={{ color: getPriorityColor(selectedTicket?.priority || '') }}>
                                    {selectedTicket?.priority}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Communication Log</Text>
                        {selectedTicket?.messages.map((msg, i) => (
                            <View
                                key={i}
                                className={`mb-4 max-w-[85%] rounded-[24px] p-4 ${msg.senderModel === 'Admin'
                                    ? 'self-end bg-black'
                                    : 'self-start bg-gray-100'
                                    }`}
                            >
                                <Text className={`text-xs font-bold leading-5 ${msg.senderModel === 'Admin' ? 'text-white' : 'text-gray-900'
                                    }`}>{msg.message}</Text>
                                <Text className={`text-[8px] font-black uppercase mt-2 ${msg.senderModel === 'Admin' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View className="pt-4 border-t border-gray-100">
                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2 mb-4">
                            <TextInput
                                placeholder="TYPE COUNTER-RESPONSE..."
                                className="flex-1 font-black text-xs text-gray-900 uppercase py-2"
                                value={adminReply}
                                onChangeText={setAdminReply}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSendReply}
                                disabled={replying || !adminReply.trim()}
                                className="ml-2 bg-orange-500 w-10 h-10 rounded-xl items-center justify-center"
                            >
                                {replying ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="send" size={18} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <View className="flex-row justify-between">
                            <TouchableOpacity
                                onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'RESOLVED' })}
                                className="flex-row items-center bg-green-50 px-6 py-3 rounded-xl"
                            >
                                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                <Text className="ml-2 text-green-700 font-black uppercase text-[10px]">Mark Resolved</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'CLOSED' })}
                                className="flex-row items-center bg-gray-100 px-6 py-3 rounded-xl"
                            >
                                <Ionicons name="lock-closed" size={16} color="#64748b" />
                                <Text className="ml-2 text-gray-500 font-black uppercase text-[10px]">Close Node</Text>
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
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                            <Skeleton width={180} height={28} />
                        </View>
                        <Skeleton width={40} height={40} borderRadius={20} />
                    </View>
                    <Skeleton width="100%" height={48} borderRadius={16} />
                </View>

                {/* SubNav Skeleton */}
                <View className="flex-row px-6 py-4 border-b border-gray-50">
                    <Skeleton width={80} height={32} borderRadius={16} style={{ marginRight: 12 }} />
                    <Skeleton width={80} height={32} borderRadius={16} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', padding: 24, marginBottom: 16 }}>
                            <View className="flex-row justify-between mb-4">
                                <Skeleton width={60} height={16} borderRadius={8} />
                                <Skeleton width={60} height={16} borderRadius={999} />
                            </View>
                            <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
                            <Skeleton width="50%" height={14} style={{ marginBottom: 16 }} />
                            <View className="pt-4 border-t border-gray-50 flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
                                    <Skeleton width={60} height={10} />
                                </View>
                                <Skeleton width={60} height={20} borderRadius={8} />
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Support Core</Text>
                        <Text className="text-2xl font-black text-black">SERVICE TICKETS</Text>
                    </View>
                    <View className="bg-black w-10 h-10 rounded-full items-center justify-center">
                        <Ionicons name="ticket" size={24} color="#ea580c" />
                    </View>
                </View>

                <View className="bg-gray-50 flex-row items-center px-5 py-4 rounded-2xl border border-gray-100">
                    <Ionicons name="filter" size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Search tickets or IDs..."
                        className="flex-1 ml-4 font-black text-gray-900 text-xs uppercase"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <SuperAdminSubNav activeTab="tickets" />

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                {filteredTickets.map((ticket) => (
                    <TouchableOpacity
                        key={ticket._id}
                        onPress={() => setSelectedTicket(ticket)}
                        className="bg-white rounded-[32px] border border-gray-100 p-6 mb-4 shadow-sm"
                    >
                        <View className="flex-row justify-between mb-4">
                            <View className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest">{ticket.ticketId}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getPriorityColor(ticket.priority) }} />
                                <Text className="font-black text-[9px] uppercase tracking-widest" style={{ color: getPriorityColor(ticket.priority) }}>
                                    {ticket.priority}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-lg font-black text-gray-900 mb-2">{ticket.title}</Text>
                        <Text className="text-gray-400 text-xs font-bold mb-4" numberOfLines={1}>{ticket.description}</Text>

                        <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center mr-2">
                                    <Text className="text-[10px]">👤</Text>
                                </View>
                                <Text className="text-gray-500 font-black text-[9px] uppercase">{ticket.user?.name || 'Unknown'}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-lg ${ticket.status === 'RESOLVED' ? 'bg-green-50' :
                                ticket.status === 'OPEN' ? 'bg-blue-50' : 'bg-gray-50'
                                }`}>
                                <Text className={`text-[8px] font-black uppercase tracking-widest ${ticket.status === 'RESOLVED' ? 'text-green-700' :
                                    ticket.status === 'OPEN' ? 'text-blue-700' : 'text-gray-500'
                                    }`}>{ticket.status}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredTickets.length === 0 && (
                    <View className="items-center justify-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                        <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                        <Text className="text-gray-400 font-black mt-4 uppercase text-[10px] tracking-widest">No matching tickets</Text>
                    </View>
                )}
                <View className="h-32" />
            </ScrollView>

            {renderTicketDetail()}
        </View>
    );
}
