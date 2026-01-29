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
    RefreshControl,
    Image,
    Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Skeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');

interface User {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    message: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    adminResponse?: string;
    respondedAt?: string;
}

interface KycRequest {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    } | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    personalDetails: {
        fullName: string;
        dob: string;
    };
    document: {
        type: string;
        number: string;
        frontImage: string;
        backImage: string;
    };
    createdAt: string;
}

export default function ManageUsers() {
    const router = useRouter();
    const { section } = useLocalSearchParams();
    const [activeSection, setActiveSection] = useState<'users' | 'kyc' | 'tickets'>((section as any) || 'users');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (section) {
            setActiveSection(section as any);
        }
    }, [section]);

    // Users State
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuVisible, setUserMenuVisible] = useState<string | null>(null);

    // KYC State
    const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
    const [loadingKyc, setLoadingKyc] = useState(true);
    const [kycSearchQuery, setKycSearchQuery] = useState('');
    const [selectedKycRequest, setSelectedKycRequest] = useState<KycRequest | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmActionId, setConfirmActionId] = useState<string | null>(null);

    // Tickets State
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [ticketSearchQuery, setTicketSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [replying, setReplying] = useState(false);

    // Quick Menu State
    const [showQuickMenu, setShowQuickMenu] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoadingUsers(true);
        setLoadingKyc(true);
        setLoadingTickets(true);
        await Promise.all([fetchUsers(), fetchKycRequests(), fetchTickets()]);
        setLoadingUsers(false);
        setLoadingKyc(false);
        setLoadingTickets(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchUsers(), fetchKycRequests(), fetchTickets()]);
        setRefreshing(false);
    };

    // --- API Calls ---

    const fetchUsers = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.USERS, { headers });
            const data = await response.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchKycRequests = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_KYC, { headers });
            const data = await response.json();
            if (data.success) setKycRequests(data.data);
        } catch (error) {
            console.error('Error fetching KYC:', error);
        }
    };

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_ADMIN, { headers });
            const data = await response.json();
            if (data.success) setTickets(data.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const handleUpdateTicket = async (id: string, updates: any) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_UPDATE(id), {
                method: 'PATCH',
                headers,
                body: JSON.stringify(updates),
            });
            const data = await response.json();
            if (data.success) {
                fetchTickets();
                if (selectedTicket && selectedTicket._id === id) {
                    setSelectedTicket({ ...selectedTicket, ...updates });
                }
                Toast.show({ type: 'success', text1: 'Success', text2: 'Ticket updated successfully' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update ticket' });
        }
    };

    const handleSendReply = async () => {
        if (!adminReply.trim() || !selectedTicket) return;
        setReplying(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.GENERAL_TICKETS_UPDATE(selectedTicket._id), {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    adminResponse: adminReply,
                    status: 'RESOLVED'
                }),
            });
            const data = await response.json();
            if (data.success) {
                setAdminReply('');
                fetchTickets();
                // Update local selected ticket to show the response immediately if we keep it open, 
                // but usually we might close or refresh.
                // For now, let's refresh list and maybe close modal or update local state.
                const updatedTicket = { ...selectedTicket, adminResponse: adminReply, status: 'RESOLVED' as const };
                setSelectedTicket(updatedTicket);
                Toast.show({ type: 'success', text1: 'Reply Sent', text2: 'Ticket marked as resolved.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send reply' });
        } finally {
            setReplying(false);
        }
    };

    // --- User Actions ---

    const toggleUserStatus = async (user: User) => {
        const action = user.isActive ? 'Block' : 'Unblock';
        Alert.alert(
            `${action} Access`,
            `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
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
                                Alert.alert("Success", `User ${action.toLowerCase()}ed successfully`);
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
            "Security Measure",
            `Terminate all active sessions for ${user.name}? This will require them to login again.`,
            [{ text: "Terminate Sessions", style: "destructive", onPress: () => Alert.alert("Success", "Sessions purged.") }, { text: "Cancel", style: "cancel" }]
        );
    };

    // --- KYC Actions ---

    const handleApproveClick = (id: string) => {
        setConfirmActionId(id);
        setConfirmModalVisible(true);
    };

    const processKycApproval = async () => {
        if (!confirmActionId) return;
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_KYC_APPROVE(confirmActionId), {
                method: 'PATCH',
                headers,
            });
            const data = await response.json();
            if (data.success) {
                fetchKycRequests();
                setSelectedKycRequest(null);
                setConfirmModalVisible(false);
                Toast.show({ type: 'success', text1: 'Approved', text2: 'User access level upgraded.' });
            } else {
                Toast.show({ type: 'error', text1: 'Failed', text2: data.message });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred.' });
        }
    };

    const handleKycReject = async (id: string) => {
        if (!rejectionReason) {
            Toast.show({ type: 'error', text1: 'Reason Required', text2: 'Please provide a reason.' });
            return;
        }
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_KYC_REJECT(id), {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ reason: rejectionReason }),
            });
            const data = await response.json();
            if (data.success) {
                fetchKycRequests();
                setSelectedKycRequest(null);
                setRejectionReason('');
                Toast.show({ type: 'info', text1: 'Rejected', text2: 'User notified.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to reject.' });
        }
    };


    // --- Filtering ---
    const getFilteredUsers = () => {
        const search = (searchQuery || '').toLowerCase();
        return (Array.isArray(users) ? users : []).filter(user => {
            const name = String(user?.name || '').toLowerCase();
            const email = String(user?.email || '').toLowerCase();
            return name.includes(search) || email.includes(search);
        });
    };

    const getFilteredKyc = () => {
        const search = (kycSearchQuery || '').toLowerCase();
        return (Array.isArray(kycRequests) ? kycRequests : []).filter(req =>
            (req.userId?.name || '').toLowerCase().includes(search) ||
            (req.userId?.email || '').toLowerCase().includes(search)
        );
    };

    const getFilteredTickets = () => {
        const search = (ticketSearchQuery || '').toLowerCase();
        return (Array.isArray(tickets) ? tickets : []).filter(ticket => {
            const subject = String(ticket?.subject || '').toLowerCase();
            const ticketId = String(ticket?.ticketId || '').toLowerCase();
            return subject.includes(search) || ticketId.includes(search);
        });
    };


    // --- Render Items ---

    const renderHeader = () => (
        <View
            style={{
                backgroundColor: 'white',
                paddingTop: 56,
                paddingBottom: 24,
                paddingHorizontal: 24,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
                borderBottomWidth: 1,
                borderBottomColor: '#fff7ed',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                zIndex: 20
            }}
        >
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <View className="flex-row items-center mb-1">
                        <View className="bg-orange-100 px-2 py-0.5 rounded-md mr-2">
                            <Text className="text-orange-700 text-[10px] font-black uppercase tracking-widest">Super Admin</Text>
                        </View>
                    </View>
                    <Text className="text-3xl font-black text-gray-900 tracking-tight">
                        Platform <Text className="text-orange-500">Hub</Text>
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowQuickMenu(true)}
                    style={{ backgroundColor: '#fff7ed', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffedd5', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
                >
                    <Ionicons name="grid" size={24} color="#f97316" />
                </TouchableOpacity>
            </View>

            {/* Navigation Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255, 247, 237, 0.5)', padding: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ffedd5', marginBottom: 24 }}>
                {[
                    { id: 'users', label: 'Users', icon: 'people' },
                    { id: 'kyc', label: 'Verification', icon: 'shield-checkmark' },
                    { id: 'tickets', label: 'Tickets', icon: 'ticket' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveSection(tab.id as any)}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            borderRadius: 12,
                            backgroundColor: activeSection === tab.id ? 'white' : 'transparent',
                            shadowColor: activeSection === tab.id ? '#000' : 'transparent',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: activeSection === tab.id ? 0.05 : 0,
                            shadowRadius: activeSection === tab.id ? 2 : 0,
                            elevation: activeSection === tab.id ? 1 : 0
                        }}
                    >
                        <Ionicons
                            name={activeSection === tab.id ? tab.icon as any : `${tab.icon}-outline` as any}
                            size={14}
                            color={activeSection === tab.id ? "#f97316" : "#9ca3af"}
                        />
                        <Text style={{
                            marginLeft: 6,
                            fontSize: 10,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: activeSection === tab.id ? '#111827' : '#9ca3af'
                        }}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search Bar */}
            <View className="bg-gray-50 flex-row items-center px-5 py-3.5 rounded-2xl border border-gray-100">
                <Ionicons name="search" size={18} color="#f97316" />
                <TextInput
                    placeholder={
                        activeSection === 'users' ? "Search users..." :
                            activeSection === 'kyc' ? "Search verification requests..." :
                                "Search tickets..."
                    }
                    className="flex-1 ml-3 font-bold text-gray-900 text-xs"
                    placeholderTextColor="#9ca3af"
                    value={
                        activeSection === 'users' ? searchQuery :
                            activeSection === 'kyc' ? kycSearchQuery :
                                ticketSearchQuery
                    }
                    onChangeText={
                        activeSection === 'users' ? setSearchQuery :
                            activeSection === 'kyc' ? setKycSearchQuery :
                                setTicketSearchQuery
                    }
                />
            </View>
        </View>
    );

    const renderUserItem = (user: User) => (
        <View
            key={user._id}
            style={{
                backgroundColor: 'white',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: '#f9fafb',
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
            }}
        >
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/Superadmin/admin_user_details', params: { id: user._id } } as any)}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                <View className="w-14 h-14 rounded-2xl bg-orange-50 items-center justify-center border border-orange-100">
                    <Text className="text-2xl">👤</Text>
                    {!user.isActive && (
                        <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center border border-white">
                            <Ionicons name="ban" size={10} color="white" />
                        </View>
                    )}
                </View>
                <View className="flex-1 ml-4 pt-1">
                    <View className="flex-row justify-between items-start">
                        <Text className="text-lg font-black text-gray-900 leading-tight" numberOfLines={1}>{user.name}</Text>
                        <View className={`px-2 py-0.5 rounded-md border ${user.isActive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Text className={`text-[8px] font-black uppercase ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                {user.isActive ? 'Active' : 'Blocked'}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="mail-outline" size={12} color="#9ca3af" />
                        <Text className="text-gray-500 text-[11px] font-medium ml-1.5" numberOfLines={1}>{user.email}</Text>
                    </View>
                </View>
                <View className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center ml-2 border border-gray-100">
                    <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
                </View>
            </TouchableOpacity>

            <View className="mt-4 pt-3 border-t border-gray-50 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => setUserMenuVisible(userMenuVisible === user._id ? null : user._id)}
                    className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
                >
                    <Ionicons name="settings-outline" size={12} color="#6b7280" />
                    <Text className="text-[10px] font-black text-gray-600 uppercase ml-1.5">Settings</Text>
                    <Ionicons name={userMenuVisible === user._id ? "chevron-up" : "chevron-down"} size={10} color="#6b7280" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <Text className="text-[9px] font-medium text-gray-300">Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
            </View>

            {userMenuVisible === user._id && (
                <View className="mt-3 flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => handleForceLogout(user)}
                        style={{ flex: 1, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                    >
                        <Ionicons name="log-out-outline" size={16} color="white" />
                        <Text className="text-white text-[10px] font-black uppercase ml-2">Logout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => toggleUserStatus(user)}
                        style={[{ flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, user.isActive ? { backgroundColor: '#fef2f2', borderColor: '#fee2e2' } : { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}
                    >
                        <Ionicons name={user.isActive ? "ban" : "checkmark-circle"} size={16} color={user.isActive ? "#ef4444" : "#16a34a"} />
                        <Text className={`text-[10px] font-black uppercase ml-2 ${user.isActive ? 'text-red-700' : 'text-green-700'}`}>{user.isActive ? 'Block' : 'Unblock'}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderKycItem = (req: KycRequest) => (
        <TouchableOpacity
            key={req._id}
            onPress={() => setSelectedKycRequest(req)}
            style={{
                backgroundColor: 'white',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: '#f9fafb',
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
            }}
        >
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-4 border border-gray-100">
                        <Text className="text-xl">📄</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-black text-base" numberOfLines={1}>{req.userId?.name || 'Unknown User'}</Text>
                        <Text className="text-gray-400 text-[10px] font-bold uppercase mt-1">{req.document.type} • {new Date(req.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${req.status === 'APPROVED' ? 'bg-green-50 border border-green-100' : req.status === 'REJECTED' ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'}`}>
                    <Text className={`text-[8px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'text-green-700' : req.status === 'REJECTED' ? 'text-red-700' : 'text-orange-700'}`}>{req.status}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderTicketItem = (ticket: Ticket) => (
        <View
            key={ticket._id}
            style={{
                backgroundColor: 'white',
                borderRadius: 28,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#f9fafb', // gray-50
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    backgroundColor: ticket.status === 'OPEN' ? '#f97316' : ticket.status === 'IN_PROGRESS' ? '#3b82f6' : '#d1d5db'
                }}
            />
            <View style={{ paddingLeft: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5 }}>{ticket.ticketId || 'TKT-#'}</Text>
                    </View>
                    <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                        borderWidth: 1,
                        backgroundColor: ticket.priority === 'HIGH' ? '#fef2f2' : ticket.priority === 'MEDIUM' ? '#fff7ed' : '#f0fdf4',
                        borderColor: ticket.priority === 'HIGH' ? '#fee2e2' : ticket.priority === 'MEDIUM' ? '#ffedd5' : '#dcfce7'
                    }}>
                        <Text style={{
                            fontSize: 8,
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            color: ticket.priority === 'HIGH' ? '#b91c1c' : ticket.priority === 'MEDIUM' ? '#c2410c' : '#15803d'
                        }}>
                            {ticket.priority}
                        </Text>
                    </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 }} numberOfLines={2}>{ticket.subject}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="person-circle-outline" size={14} color="#9ca3af" />
                    <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginLeft: 4 }}>{ticket.user?.name || 'Unknown User'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f9fafb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 9999,
                            marginRight: 8,
                            backgroundColor: ticket.status === 'OPEN' ? '#f97316' : ticket.status === 'IN_PROGRESS' ? '#3b82f6' : '#9ca3af'
                        }} />
                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#9ca3af' }}>{ticket.status.replace('-', ' ')}</Text>
                    </View>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => setSelectedTicket(ticket)}
                    >
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#ea580c', textTransform: 'uppercase', marginRight: 4 }}>View Details</Text>
                        <Ionicons name="arrow-forward" size={12} color="#ea580c" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // --- Kyc Modal ---
    const renderKycDetailsModal = () => (
        <Modal visible={!!selectedKycRequest} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-[40px] h-[90%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-black">KYC VERIFICATION</Text>
                        <TouchableOpacity onPress={() => setSelectedKycRequest(null)}>
                            <Ionicons name="close-circle" size={32} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal Dossier</Text>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-gray-500 font-bold">Full Name</Text>
                                <Text className="font-black text-gray-900">{selectedKycRequest?.personalDetails.fullName}</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-500 font-bold">Date of Birth</Text>
                                <Text className="font-black text-gray-900">{new Date(selectedKycRequest?.personalDetails.dob || '').toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Identity Document ({selectedKycRequest?.document.type})</Text>
                            <Text className="text-gray-900 font-black text-lg mb-4">{selectedKycRequest?.document.number}</Text>
                            <View className="flex-row justify-between">
                                <TouchableOpacity onPress={() => setViewingImage(selectedKycRequest?.document.frontImage || null)} className="w-[48%] aspect-video bg-gray-200 rounded-xl overflow-hidden">
                                    <Image source={{ uri: selectedKycRequest?.document.frontImage }} className="w-full h-full" />
                                    <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md"><Text className="text-[8px] text-white font-black uppercase">Front</Text></View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setViewingImage(selectedKycRequest?.document.backImage || null)} className="w-[48%] aspect-video bg-gray-200 rounded-xl overflow-hidden">
                                    <Image source={{ uri: selectedKycRequest?.document.backImage }} className="w-full h-full" />
                                    <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md"><Text className="text-[8px] text-white font-black uppercase">Back</Text></View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {selectedKycRequest?.status === 'PENDING' && (
                            <View>
                                <TextInput
                                    placeholder="REJECTION REASON (IF APPLICABLE)"
                                    className="bg-gray-50 p-4 rounded-2xl mb-4 font-black text-xs text-red-600 border border-gray-100"
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                    multiline
                                />
                                <View className="flex-row">
                                    <TouchableOpacity onPress={() => handleKycReject(selectedKycRequest?._id || '')} className="flex-1 bg-red-50 p-4 rounded-2xl mr-2 items-center">
                                        <Text className="text-red-700 font-black uppercase text-xs">Reject Access</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleApproveClick(selectedKycRequest?._id || '')} className="flex-1 bg-green-600 p-4 rounded-2xl ml-2 items-center">
                                        <Text className="text-white font-black uppercase text-xs">Approve Final</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderTicketDetailsModal = () => (
        <Modal visible={!!selectedTicket} animationType="slide" transparent={true} onRequestClose={() => setSelectedTicket(null)}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-[40px] h-[90%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{selectedTicket?.ticketId || 'TKT-#'}</Text>
                            <Text className="text-xl font-black text-black" numberOfLines={1}>{selectedTicket?.subject}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                            <Ionicons name="close-circle" size={32} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Query</Text>
                                <View className={`px-2 py-0.5 rounded-md border ${selectedTicket?.status === 'OPEN' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                    <Text className={`text-[8px] font-black uppercase ${selectedTicket?.status === 'OPEN' ? 'text-orange-700' : 'text-green-700'}`}>{selectedTicket?.status}</Text>
                                </View>
                            </View>
                            <Text className="text-gray-900 font-bold mb-4 leading-6">{selectedTicket?.message}</Text>
                            <View className="flex-row items-center">
                                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                                <Text className="text-gray-400 text-[10px] font-bold ml-1">{new Date(selectedTicket?.createdAt || '').toLocaleString()}</Text>
                            </View>
                        </View>

                        {selectedTicket?.adminResponse && (
                            <View className="bg-black p-6 rounded-3xl mb-6 self-end w-[90%]">
                                <Text className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Admin Response</Text>
                                <Text className="text-white font-bold leading-6">{selectedTicket.adminResponse}</Text>
                                <View className="flex-row items-center mt-3 justify-end">
                                    <Text className="text-gray-500 text-[10px] font-bold mr-1">{new Date(selectedTicket?.respondedAt || selectedTicket?.createdAt || '').toLocaleString()}</Text>
                                    <Ionicons name="checkmark-done" size={12} color="#22c55e" />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View className="pt-4 border-t border-gray-100">
                        {/* Status Actions */}
                        <View className="flex-row justify-between mb-4">
                            {selectedTicket?.status !== 'RESOLVED' && selectedTicket?.status !== 'CLOSED' && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'RESOLVED' })}
                                        className="flex-1 bg-green-50 py-3 rounded-xl flex-row items-center justify-center mr-2 border border-green-100"
                                    >
                                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                        <Text className="ml-2 text-green-700 font-black uppercase text-[10px]">Resolve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateTicket(selectedTicket?._id || '', { status: 'CLOSED' })}
                                        className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center ml-2 border border-gray-200"
                                    >
                                        <Ionicons name="lock-closed" size={16} color="#64748b" />
                                        <Text className="ml-2 text-gray-500 font-black uppercase text-[10px]">Close</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {(selectedTicket?.status === 'RESOLVED' || selectedTicket?.status === 'CLOSED') && (
                                <View className="flex-1 bg-gray-50 py-3 rounded-xl items-center justify-center border border-gray-100">
                                    <Text className="text-gray-400 font-black uppercase text-[10px]">Ticket is {selectedTicket.status}</Text>
                                </View>
                            )}
                        </View>

                        {/* Reply Input */}
                        {!selectedTicket?.adminResponse && selectedTicket?.status !== 'CLOSED' && (
                            <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
                                <TextInput
                                    placeholder="TYPE RESPONSE..."
                                    className="flex-1 font-black text-xs text-gray-900 uppercase py-2"
                                    value={adminReply}
                                    onChangeText={setAdminReply}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={handleSendReply}
                                    disabled={replying || !adminReply.trim()}
                                    className={`ml-2 w-10 h-10 rounded-xl items-center justify-center ${!adminReply.trim() ? 'bg-gray-200' : 'bg-orange-500'}`}
                                >
                                    {replying ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Ionicons name="send" size={18} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderQuickMenuModal = () => (
        <Modal visible={showQuickMenu} animationType="fade" transparent={true} onRequestClose={() => setShowQuickMenu(false)}>
            <TouchableOpacity
                className="flex-1 bg-black/40 justify-center items-center p-6"
                activeOpacity={1}
                onPress={() => setShowQuickMenu(false)}
            >
                <View className="bg-white w-full rounded-[48px] p-8 shadow-2xl overflow-hidden">
                    <View className="flex-row justify-between items-center mb-10">
                        <View>
                            <Text className="text-orange-500 text-[10px] font-black uppercase tracking-[3px] mb-1">Command Suite</Text>
                            <Text className="text-2xl font-black text-gray-900">Quick Access</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowQuickMenu(false)}
                            className="bg-gray-50 w-12 h-12 rounded-2xl items-center justify-center border border-gray-100"
                        >
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {[
                            { label: 'CMS Control', icon: 'megaphone', route: '/Superadmin/cms_control', color: '#6366f1', bg: '#eef2ff', desc: 'Alerts & Legal' },
                            { label: 'Gold Vault', icon: 'sparkles', route: '/Superadmin/digital_gold_view', color: '#eab308', bg: '#fefce8', desc: 'Rates & Stock' },
                            { label: 'Audit Logs', icon: 'finger-print', route: '/Superadmin/audit_logs', color: '#f97316', bg: '#fff7ed', desc: 'Security Trace' },
                            { label: 'Settings', icon: 'options', route: '/Superadmin/system_settings', color: '#0ea5e9', bg: '#f0f9ff', desc: 'System Config' },
                            { label: 'Reports', icon: 'bar-chart', route: '/Superadmin/reports', color: '#8b5cf6', bg: '#f5f3ff', desc: 'Analytics' }
                        ].map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                    setShowQuickMenu(false);
                                    router.push(item.route as any);
                                }}
                                style={{ width: '48%', marginBottom: 16 }}
                                className="bg-gray-50/50 p-5 rounded-[32px] border border-gray-100/50"
                            >
                                <View
                                    style={{ backgroundColor: item.bg }}
                                    className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-sm"
                                >
                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text className="text-gray-900 font-black text-xs uppercase tracking-tight">{item.label}</Text>
                                <Text className="text-gray-400 text-[8px] font-bold mt-1 uppercase tracking-tighter">{item.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View className="mt-6 pt-6 border-t border-gray-50 items-center">
                        <Text className="text-gray-300 text-[9px] font-black uppercase tracking-[4px]">Unified Administration v4.2</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {renderHeader()}
            <ScrollView
                className="flex-1 bg-gray-50"
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
            >
                {/* HEADERS */}
                <View className="flex-row items-center justify-between mb-4 px-2">
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {activeSection === 'users' ? `Registry (${getFilteredUsers().length})` :
                            activeSection === 'kyc' ? `Requests (${getFilteredKyc().length})` :
                                `Tickets (${getFilteredTickets().length})`}
                    </Text>
                </View>

                {/* LIST CONTENT */}
                {activeSection === 'users' ? (
                    loadingUsers ? (
                        <>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <View key={item} style={{ backgroundColor: 'white', borderRadius: 28, borderWidth: 1, borderColor: '#f9fafb', padding: 20, marginBottom: 16 }}>
                                    <View className="flex-row items-center">
                                        <Skeleton width={56} height={56} borderRadius={16} />
                                        <View className="flex-1 ml-4 pt-1">
                                            <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
                                            <Skeleton width="40%" height={12} />
                                        </View>
                                        <Skeleton width={32} height={32} borderRadius={16} />
                                    </View>
                                    <View className="mt-4 pt-3 border-t border-gray-50 flex-row items-center justify-between">
                                        <Skeleton width={80} height={20} borderRadius={8} />
                                        <Skeleton width={60} height={10} />
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : getFilteredUsers().length > 0 ? getFilteredUsers().map(renderUserItem) :
                        <View className="items-center justify-center py-20"><Text className="text-gray-400 font-bold text-xs uppercase">No users found</Text></View>
                ) : activeSection === 'kyc' ? (
                    loadingKyc ? (
                        <>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <View key={item} style={{ backgroundColor: 'white', borderRadius: 28, borderWidth: 1, borderColor: '#f9fafb', padding: 20, marginBottom: 16 }}>
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-row items-center flex-1">
                                            <Skeleton width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
                                            <View className="flex-1">
                                                <Skeleton width="70%" height={18} style={{ marginBottom: 6 }} />
                                                <Skeleton width="40%" height={12} />
                                            </View>
                                        </View>
                                        <Skeleton width={60} height={24} borderRadius={12} />
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : getFilteredKyc().length > 0 ? getFilteredKyc().map(renderKycItem) :
                        <View className="items-center justify-center py-20"><Text className="text-gray-400 font-bold text-xs uppercase">No kyc requests</Text></View>
                ) : (
                    loadingTickets ? (
                        <>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <View key={item} style={{ backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f9fafb' }}>
                                    <View className="flex-row justify-between items-start mb-4">
                                        <Skeleton width={80} height={16} borderRadius={6} />
                                        <Skeleton width={60} height={16} borderRadius={999} />
                                    </View>
                                    <View style={{ paddingLeft: 8 }}>
                                        <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
                                        <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
                                        <View className="pt-4 border-t border-gray-50 flex-row justify-between items-center">
                                            <Skeleton width={60} height={12} />
                                            <Skeleton width={80} height={12} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : getFilteredTickets().length > 0 ? getFilteredTickets().map(renderTicketItem) :
                        <View className="items-center justify-center py-20"><Text className="text-gray-400 font-bold text-xs uppercase">No tickets found</Text></View>
                )}
            </ScrollView>

            {renderKycDetailsModal()}
            {renderTicketDetailsModal()}
            {renderQuickMenuModal()}

            <ConfirmationModal
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={processKycApproval}
                title="Grant Clearance?"
                message="This will approve the user's KYC verification."
                type="success"
                confirmText="Approve Access"
                cancelText="Review More"
            />

            <Modal visible={!!viewingImage} transparent={true}>
                <View className="flex-1 bg-black items-center justify-center p-6">
                    <TouchableOpacity className="absolute top-12 right-6 z-10" onPress={() => setViewingImage(null)}>
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                    {viewingImage && <Image source={{ uri: viewingImage }} className="w-full h-[80%] rounded-3xl" resizeMode="contain" />}
                </View>
            </Modal>
        </View>
    );
}
