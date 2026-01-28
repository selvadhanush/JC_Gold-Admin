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
    Image,
    Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import SuperAdminSubNav from '../../components/SuperAdminSubNav';
import { Skeleton } from '../../components/Skeleton';

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

export default function ManageKyc() {
    const router = useRouter();
    const [requests, setRequests] = useState<KycRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmActionId, setConfirmActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchKycRequests();
    }, []);

    const fetchKycRequests = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_KYC, { headers });
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error('Error fetching KYC requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (id: string) => {
        setConfirmActionId(id);
        setConfirmModalVisible(true);
    };

    const processApproval = async () => {
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
                setSelectedRequest(null);
                setConfirmModalVisible(false);
                Toast.show({
                    type: 'success',
                    text1: 'Approved Correctly',
                    text2: 'User access level has been upgraded.'
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Approval Failed',
                    text2: data.message || 'Could not approve KYC.'
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Network Error',
                text2: 'Failed to communicate with server.'
            });
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectionReason) {
            Toast.show({
                type: 'error',
                text1: 'Reason Required',
                text2: 'Please provide a reason for rejection.'
            });
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
                setSelectedRequest(null);
                setRejectionReason('');
                Toast.show({
                    type: 'info',
                    text1: 'KYC Rejected',
                    text2: 'User has been notified of the rejection.'
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to reject KYC application'
            });
        }
    };

    const filteredRequests = requests.filter(req =>
        (req.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.userId?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderRequestDetails = () => (
        <Modal
            visible={!!selectedRequest}
            animationType="slide"
            transparent={true}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-[40px] h-[90%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-black">KYC VERIFICATION</Text>
                        <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                            <Ionicons name="close-circle" size={32} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal Dossier</Text>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-gray-500 font-bold">Full Name</Text>
                                <Text className="font-black text-gray-900">{selectedRequest?.personalDetails.fullName}</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-500 font-bold">Date of Birth</Text>
                                <Text className="font-black text-gray-900">{new Date(selectedRequest?.personalDetails.dob || '').toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <View className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Identity Document ({selectedRequest?.document.type})</Text>
                            <Text className="text-gray-900 font-black text-lg mb-4">{selectedRequest?.document.number}</Text>

                            <View className="flex-row justify-between">
                                <TouchableOpacity
                                    onPress={() => setViewingImage(selectedRequest?.document.frontImage || null)}
                                    className="w-[48%] aspect-video bg-gray-200 rounded-xl overflow-hidden"
                                >
                                    <Image source={{ uri: selectedRequest?.document.frontImage }} className="w-full h-full" />
                                    <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md">
                                        <Text className="text-[8px] text-white font-black uppercase">Front Side</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setViewingImage(selectedRequest?.document.backImage || null)}
                                    className="w-[48%] aspect-video bg-gray-200 rounded-xl overflow-hidden"
                                >
                                    <Image source={{ uri: selectedRequest?.document.backImage }} className="w-full h-full" />
                                    <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md">
                                        <Text className="text-[8px] text-white font-black uppercase">Back Side</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {selectedRequest?.status === 'PENDING' && (
                            <View>
                                <TextInput
                                    placeholder="REJECTION REASON (IF APPLICABLE)"
                                    className="bg-gray-50 p-4 rounded-2xl mb-4 font-black text-xs text-red-600 border border-gray-100"
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                    multiline
                                />
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => handleReject(selectedRequest?._id || '')}
                                        className="flex-1 bg-red-50 p-4 rounded-2xl mr-2 items-center"
                                    >
                                        <Text className="text-red-700 font-black uppercase text-xs">Reject Access</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleApproveClick(selectedRequest?._id || '')}
                                        className="flex-1 bg-green-600 p-4 rounded-2xl ml-2 items-center"
                                    >
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
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View className="flex-row items-center flex-1">
                                <Skeleton width={48} height={48} borderRadius={16} style={{ marginRight: 16 }} />
                                <View className="flex-1">
                                    <Skeleton width="60%" height={18} style={{ marginBottom: 6 }} />
                                    <Skeleton width="40%" height={10} />
                                </View>
                            </View>
                            <Skeleton width={60} height={24} borderRadius={12} />
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
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Compliance Center</Text>
                        <Text className="text-2xl font-black text-black">KYC VERIFICATION</Text>
                    </View>
                    <View className="bg-black w-10 h-10 rounded-full items-center justify-center">
                        <Ionicons name="shield-checkmark" size={24} color="#ea580c" />
                    </View>
                </View>

                <View className="bg-gray-50 flex-row items-center px-5 py-4 rounded-2xl border border-gray-100">
                    <Ionicons name="search" size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Search by user identity..."
                        className="flex-1 ml-4 font-black text-gray-900 text-xs uppercase"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <SuperAdminSubNav activeTab="kyc" />

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                {filteredRequests.map((request) => (
                    <TouchableOpacity
                        key={request._id}
                        onPress={() => setSelectedRequest(request)}
                        className="bg-white rounded-[32px] border border-gray-100 p-5 mb-4 shadow-sm"
                    >
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-4">
                                    <Text className="text-xl">📄</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black font-black text-base" numberOfLines={1}>{request.userId?.name || 'Unknown User'}</Text>
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase mt-1">{request.document.type} • {new Date(request.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full ${request.status === 'APPROVED' ? 'bg-green-50' :
                                request.status === 'REJECTED' ? 'bg-red-50' : 'bg-orange-50'
                                }`}>
                                <Text className={`text-[8px] font-black uppercase tracking-widest ${request.status === 'APPROVED' ? 'text-green-700' :
                                    request.status === 'REJECTED' ? 'text-red-700' : 'text-orange-700'
                                    }`}>{request.status}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredRequests.length === 0 && (
                    <View className="items-center justify-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                        <Ionicons name="file-tray-outline" size={40} color="#cbd5e1" />
                        <Text className="text-gray-400 font-black mt-4 uppercase text-[10px] tracking-widest">No pending verifications</Text>
                    </View>
                )}
                <View className="h-32" />
            </ScrollView>

            {renderRequestDetails()}

            <ConfirmationModal
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={processApproval}
                title="Grant Clearance?"
                message="This will approve the user's KYC verification and enable high-value transaction capabilities. This action is logged."
                type="success"
                confirmText="Approve Access"
                cancelText="Review More"
            />

            {/* Image Viewer Component */}
            <Modal visible={!!viewingImage} transparent={true}>
                <View className="flex-1 bg-black items-center justify-center p-6">
                    <TouchableOpacity
                        className="absolute top-12 right-6 z-10"
                        onPress={() => setViewingImage(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                    {viewingImage && (
                        <Image
                            source={{ uri: viewingImage }}
                            className="w-full h-[80%] rounded-3xl"
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}
