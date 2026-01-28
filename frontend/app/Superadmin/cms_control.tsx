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
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';
import { Skeleton } from '../../components/Skeleton';
import { showToast } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { TextInput, Modal } from 'react-native';

const { width } = Dimensions.get('window');

export default function CMSControl() {
    const router = useRouter();
    const [loading, setLoading] = useState(false); // Changed to false as initial fetch might not be needed if no banners
    const [executing, setExecuting] = useState(false);

    // Broadcast Modal State
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');

    // Push Modal State
    const [showPushModal, setShowPushModal] = useState(false);
    const [pushTitle, setPushTitle] = useState('');
    const [pushMessage, setPushMessage] = useState('');
    const [pushUserId, setPushUserId] = useState('');

    // Newsletter Modal State
    const [showNewsletterModal, setShowNewsletterModal] = useState(false);
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterContent, setNewsletterContent] = useState('');

    // Legal Modal State
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [activeLegalType, setActiveLegalType] = useState('');
    const [legalTitle, setLegalTitle] = useState('');
    const [legalContent, setLegalContent] = useState('');

    const seedInitialLegalContent = async () => {
        setExecuting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/cms/seed`, {
                method: 'POST',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showToast.success('Production assets seeded from backend');
            } else {
                showToast.error(data.message || 'Seeding failed');
            }
        } catch (error) {
            showToast.error('Seeding error occurred');
        } finally {
            setExecuting(false);
        }
    };

    const handleSendNewsletter = async () => {
        if (!newsletterSubject || !newsletterContent) {
            showToast.error('Subject and content are required');
            return;
        }

        setExecuting(true);
        try {
            const headers = await getAuthHeaders();
            // 1. Create Draft
            const createRes = await fetch(`${BASE_URL}/api/v1/cms/newsletters`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    subject: newsletterSubject,
                    content: newsletterContent
                })
            });
            const createData = await createRes.json();

            if (createData.success) {
                // 2. Send it
                const sendRes = await fetch(`${BASE_URL}/api/v1/cms/newsletters/${createData.data._id}/send`, {
                    method: 'POST',
                    headers
                });
                const sendData = await sendRes.json();

                if (sendData.success) {
                    showToast.success('Newsletter dispatched successfully');
                    setShowNewsletterModal(false);
                    setNewsletterSubject('');
                    setNewsletterContent('');
                }
            }
        } catch (error) {
            showToast.error('Newsletter dispatch failed');
        } finally {
            setExecuting(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            showToast.error('Please enter both title and message');
            return;
        }

        setExecuting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/cms/broadcast`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    type: 'ANNOUNCEMENT'
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast.success('Global broadcast executed successfully');
                setShowBroadcastModal(false);
                setBroadcastTitle('');
                setBroadcastMessage('');
            } else {
                showToast.error(data.message || 'Broadcast failed');
            }
        } catch (error) {
            showToast.error('Execution error occurred');
        } finally {
            setExecuting(false);
        }
    };

    const handlePushAlert = async () => {
        if (!pushTitle || !pushMessage) {
            showToast.error('Title and message are required');
            return;
        }

        setExecuting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/cms/notify`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: pushUserId || null, // null for general test
                    title: pushTitle,
                    message: pushMessage,
                    type: 'PUSH'
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast.success('Push notification dispatched');
                setShowPushModal(false);
                setPushTitle('');
                setPushMessage('');
                setPushUserId('');
            }
        } catch (error) {
            showToast.error('Dispatch failed');
        } finally {
            setExecuting(false);
        }
    };

    const fetchLegalContent = async (type: string, title: string) => {
        setLegalTitle(title);
        setActiveLegalType(type);
        setShowLegalModal(true);
        setLoading(true); // Modal internal loading
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/cms/content/${type}`, { headers });
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                const item = data.data.find((d: any) => d.title === title) || data.data[0];
                setLegalContent(item.content);
            } else {
                setLegalContent('');
            }
        } catch (error) {
            showToast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const closeLegalModal = () => {
        setShowLegalModal(false);
        // Clear after a short delay to allow animation to finish
        setTimeout(() => {
            setLegalContent('');
            setLegalTitle('');
            setActiveLegalType('');
        }, 300);
    };

    const saveLegalContent = async () => {
        if (!legalContent || executing) return;

        setExecuting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/cms/content`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: activeLegalType,
                    title: legalTitle,
                    content: legalContent
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast.success(`${legalTitle} updated successfully`);
                closeLegalModal();
            } else {
                showToast.error(data.message || 'Update failed');
            }
        } catch (error) {
            showToast.error('Network or server error');
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" />

                {/* Header Skeleton */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <Skeleton width={40} height={40} borderRadius={12} style={{ marginRight: 16 }} />
                        <View>
                            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                            <Skeleton width={180} height={28} />
                        </View>
                    </View>
                    <Skeleton width={48} height={48} borderRadius={16} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                    <Skeleton width={150} height={10} style={{ marginBottom: 24 }} />

                    <View className="flex-row justify-between mb-10">
                        <Skeleton width="48%" height={120} borderRadius={32} />
                        <Skeleton width="48%" height={120} borderRadius={32} />
                    </View>

                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Skeleton width={120} height={10} style={{ marginBottom: 8 }} />
                            <Skeleton width={150} height={20} />
                        </View>
                        <Skeleton width={100} height={36} borderRadius={18} />
                    </View>

                    {[1, 2].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 40, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden', marginBottom: 32 }}>
                            <Skeleton width="100%" height={192} borderRadius={0} />
                            <View className="p-6">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1">
                                        <Skeleton width="80%" height={24} style={{ marginBottom: 8 }} />
                                        <Skeleton width="40%" height={10} />
                                    </View>
                                    <Skeleton width={60} height={24} borderRadius={12} />
                                </View>
                                <Skeleton width="100%" height={40} borderRadius={8} style={{ marginBottom: 24 }} />
                                <View className="flex-row justify-between items-center">
                                    <Skeleton width={100} height={12} />
                                    <View className="flex-row">
                                        <Skeleton width={40} height={40} borderRadius={12} style={{ marginRight: 12 }} />
                                        <Skeleton width={40} height={40} borderRadius={12} />
                                    </View>
                                </View>
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
                        onPress={() => setShowBroadcastModal(true)}
                        className="w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-600/30"
                    >
                        <Ionicons name="megaphone" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="p-6">
                    {/* Communication Tools */}
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6 ml-1">Transmission Protocols</Text>

                    <View className="flex-row justify-between mb-10">
                        <TouchableOpacity
                            onPress={() => setShowPushModal(true)}
                            className="bg-indigo-950 p-6 rounded-[32px] w-[48%] shadow-xl shadow-indigo-950/20"
                        >
                            <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center mb-4">
                                <Ionicons name="notifications" size={20} color="#818cf8" />
                            </View>
                            <Text className="text-white font-black text-xs uppercase tracking-widest">Push Alert</Text>
                            <Text className="text-indigo-300 text-[9px] font-medium mt-1">Direct to device</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowNewsletterModal(true)}
                            className="bg-white border border-gray-100 p-6 rounded-[32px] w-[48%] shadow-sm"
                        >
                            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-4">
                                <Ionicons name="mail" size={20} color="#4f46e5" />
                            </View>
                            <Text className="text-black font-black text-xs uppercase tracking-widest">Newsletter</Text>
                            <Text className="text-gray-400 text-[9px] font-medium mt-1">Bulk email dispatch</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Legal & Static Content */}
                    <View className="flex-row justify-between items-center mb-6 ml-1">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Legal Dossiers</Text>
                        <TouchableOpacity onPress={seedInitialLegalContent}>
                            <Text className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">Reset Defaults</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-gray-50 rounded-[40px] p-2 border border-gray-100">
                        {[
                            { title: 'Terms of Service', type: 'TERMS' },
                            { title: 'Privacy Policy', type: 'PRIVACY' },
                            { title: 'Refund Architecture', type: 'REFUND' },
                            { title: 'Technical FAQ', type: 'FAQ' }
                        ].map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => fetchLegalContent(item.type, item.title)}
                                className={`p-6 flex-row items-center justify-between ${i !== 3 ? 'border-b border-gray-200/50' : ''}`}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mr-4 border border-gray-100">
                                        <Ionicons name="document-text" size={20} color="#4f46e5" />
                                    </View>
                                    <View>
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">{item.title}</Text>
                                        <Text className="text-gray-400 text-[9px] font-medium mt-0.5">Manage production assets</Text>
                                    </View>
                                </View>
                                <View className="bg-white w-8 h-8 rounded-full items-center justify-center border border-gray-100">
                                    <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Broadcast Modal */}
                <Modal visible={showBroadcastModal} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/60">
                        <View className="bg-white rounded-t-[40px] p-8 pb-12">
                            <View className="flex-row justify-between items-center mb-8">
                                <Text className="text-2xl font-black text-black">BROADCAST</Text>
                                <TouchableOpacity onPress={() => setShowBroadcastModal(false)}>
                                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                        <Ionicons name="close" size={24} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-gray-50 p-6 rounded-3xl text-black font-bold mb-4 border border-gray-100"
                                placeholder="Announcement Title"
                                value={broadcastTitle}
                                onChangeText={setBroadcastTitle}
                            />

                            <TextInput
                                className="bg-gray-50 p-6 rounded-3xl text-black font-medium h-40 border border-gray-100"
                                placeholder="Compose message to all users..."
                                multiline
                                textAlignVertical="top"
                                value={broadcastMessage}
                                onChangeText={setBroadcastMessage}
                            />

                            <TouchableOpacity
                                onPress={handleBroadcast}
                                disabled={executing}
                                className="bg-indigo-600 p-6 rounded-3xl mt-8 flex-row items-center justify-center shadow-xl shadow-indigo-600/30"
                            >
                                {executing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="paper-plane" size={20} color="white" />
                                        <Text className="text-white font-black tracking-widest ml-2 uppercase">Execute Transmission</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Newsletter Modal */}
                <Modal visible={showNewsletterModal} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/60">
                        <View className="bg-white rounded-t-[40px] p-8 pb-12">
                            <View className="flex-row justify-between items-center mb-8">
                                <Text className="text-2xl font-black text-black">NEWSLETTER</Text>
                                <TouchableOpacity onPress={() => setShowNewsletterModal(false)}>
                                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                                        <Ionicons name="close" size={24} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-gray-50 p-6 rounded-3xl text-black font-bold mb-4 border border-gray-100"
                                placeholder="Email Subject"
                                value={newsletterSubject}
                                onChangeText={setNewsletterSubject}
                            />

                            <TextInput
                                className="bg-gray-50 p-6 rounded-3xl text-black font-medium h-64 border border-gray-100"
                                placeholder="Enter newsletter content..."
                                multiline
                                textAlignVertical="top"
                                value={newsletterContent}
                                onChangeText={setNewsletterContent}
                            />

                            <TouchableOpacity
                                onPress={handleSendNewsletter}
                                disabled={executing}
                                className="bg-indigo-600 p-6 rounded-3xl mt-8 flex-row items-center justify-center shadow-xl shadow-indigo-600/30"
                            >
                                {executing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="mail-open" size={20} color="white" />
                                        <Text className="text-white font-black tracking-widest ml-2 uppercase">Dispatch Bulk Email</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Push Alert Modal */}
                <Modal visible={showPushModal} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/60">
                        <View className="bg-indigo-950 rounded-t-[40px] p-8 pb-12">
                            <View className="flex-row justify-between items-center mb-8">
                                <Text className="text-2xl font-black text-white">PUSH ALERT</Text>
                                <TouchableOpacity onPress={() => setShowPushModal(false)}>
                                    <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                                        <Ionicons name="close" size={24} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-white/10 p-6 rounded-3xl text-white font-bold mb-4"
                                placeholder="Alert Title"
                                placeholderTextColor="#94a3b8"
                                value={pushTitle}
                                onChangeText={setPushTitle}
                            />

                            <TextInput
                                className="bg-white/10 p-6 rounded-3xl text-white font-medium h-32 mb-4"
                                placeholder="Push message body..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                                value={pushMessage}
                                onChangeText={setPushMessage}
                            />

                            <TextInput
                                className="bg-white/10 p-4 rounded-2xl text-white font-medium text-xs"
                                placeholder="Target User ID (Optional)"
                                placeholderTextColor="#94a3b8"
                                value={pushUserId}
                                onChangeText={setPushUserId}
                            />

                            <TouchableOpacity
                                onPress={handlePushAlert}
                                disabled={executing}
                                className="bg-white p-6 rounded-3xl mt-8 items-center justify-center"
                            >
                                {executing ? (
                                    <ActivityIndicator color="#1e1b4b" />
                                ) : (
                                    <Text className="text-indigo-950 font-black tracking-widest uppercase">Dispatch Alert</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Legal Editor Modal */}
                <Modal visible={showLegalModal} animationType="slide" transparent={true}>
                    <View className="flex-1 bg-black/40 justify-end">
                        <View className="bg-slate-50 h-[92%] rounded-t-[48px] overflow-hidden shadow-2xl">
                            {/* Sophisticated Header */}
                            <View className="bg-white px-6 pt-8 pb-6 border-b border-slate-200 flex-row justify-between items-center shadow-sm z-10">
                                <View className="flex-row items-center flex-1 mr-4">
                                    <TouchableOpacity
                                        onPress={closeLegalModal}
                                        className="w-10 h-10 bg-slate-50 rounded-2xl items-center justify-center mr-4 border border-slate-100 shrink-0"
                                    >
                                        <Ionicons name="close" size={20} color="#64748b" />
                                    </TouchableOpacity>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-0.5">
                                            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[1.5px]">MASTER DOSSIER</Text>
                                        </View>
                                        <Text
                                            className="text-lg font-black text-slate-900 uppercase tracking-tight"
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {legalTitle}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={saveLegalContent}
                                    disabled={executing}
                                    className={`px-5 py-3.5 rounded-[18px] flex-row items-center shrink-0 ${executing ? 'bg-slate-100' : 'bg-indigo-600 shadow-lg shadow-indigo-600/30'}`}
                                >
                                    {executing ? (
                                        <ActivityIndicator color="#6366f1" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={16} color="white" />
                                            <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">Commit Asset</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {loading ? (
                                <View className="flex-1 p-8 bg-white m-6 rounded-[32px] shadow-sm">
                                    <Skeleton width="60%" height={32} style={{ marginBottom: 20 }} />
                                    <Skeleton width="100%" height={20} style={{ marginBottom: 12 }} />
                                    <Skeleton width="100%" height={20} style={{ marginBottom: 12 }} />
                                    <Skeleton width="100%" height={20} style={{ marginBottom: 12 }} />
                                    <Skeleton width="80%" height={20} style={{ marginBottom: 40 }} />
                                    <Skeleton width="100%" height={250} />
                                </View>
                            ) : (
                                <View className="flex-1 p-4 bg-slate-50">
                                    {/* Document Canvas */}
                                    <View className="flex-1 bg-white rounded-[40px] shadow-sm border border-slate-200/50 overflow-hidden">
                                        <ScrollView
                                            className="flex-1"
                                            contentContainerStyle={{ padding: 32, paddingBottom: 100 }}
                                            showsVerticalScrollIndicator={false}
                                        >
                                            <View className="mb-8 pb-8 border-b border-slate-50">
                                                <Text className="text-slate-300 text-[9px] font-bold uppercase tracking-widest mb-2">Editor Protocol v2.4</Text>
                                                <Text className="text-slate-900 font-black text-2xl">Production Content</Text>
                                            </View>

                                            <TextInput
                                                className="text-slate-700 font-medium text-base leading-[26px]"
                                                multiline
                                                placeholder="Begin composing production assets..."
                                                placeholderTextColor="#cbd5e1"
                                                value={legalContent}
                                                onChangeText={setLegalContent}
                                                style={{ minHeight: 400 }}
                                                textAlignVertical="top"
                                            />

                                            <View className="mt-12 pt-8 border-t border-slate-50 items-center">
                                                <Ionicons name="shield-checkmark" size={24} color="#e2e8f0" />
                                                <Text className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">End of Dossier</Text>
                                            </View>
                                        </ScrollView>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Bottom Padding */}
                <View className="h-24" />
            </ScrollView>
        </View >
    );
}
