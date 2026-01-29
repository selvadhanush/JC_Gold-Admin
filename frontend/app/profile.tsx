import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Share,
    Linking,
    Platform,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS, getAuthHeaders, fetchWithAuth } from '../api';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import * as SecureStore from 'expo-secure-store';
import { showToast } from '../utils/toast';
import ConfirmationModal from '../components/ConfirmationModal';

interface UserProfile {
    _id: string;
    name: string;
    phoneNumber: string;
    avatar?: string;
    email?: string;
    location?: string;
}

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [bankStatus, setBankStatus] = useState<string>('NOT_SUBMITTED');
    const [mpinStatus, setMpinStatus] = useState<{ isSet: boolean, locked: boolean }>({ isSet: false, locked: false });
    const [loading, setLoading] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [biometricAuth, setBiometricAuth] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showBiometricModal, setShowBiometricModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchProfile(), fetchKycStatus(), fetchMpinStatus(), fetchBankStatus()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchKycStatus = async () => {
        try {
            const response = await fetchWithAuth(API_ENDPOINTS.BUYER_KYC_STATUS);
            const data = await response.json();
            if (data.success) {
                setKycStatus(data.data.status);
            }
        } catch (error) {
            console.error('Error fetching KYC status:', error);
        }
    };

    const fetchBankStatus = async () => {
        try {
            const response = await fetchWithAuth(API_ENDPOINTS.BUYER_BANK_ACCOUNT);
            const data = await response.json();
            if (data.success && data.data) {
                setBankStatus(data.data.status);
            } else {
                setBankStatus('NOT_SUBMITTED');
            }
        } catch (error) {
            console.error('Error fetching Bank status:', error);
        }
    };

    const fetchMpinStatus = async () => {
        try {
            const response = await fetchWithAuth(API_ENDPOINTS.BUYER_MPIN_STATUS);
            const data = await response.json();
            if (data.success) {
                setMpinStatus({
                    isSet: data.data.isSet,
                    locked: data.data.locked
                });
            }
        } catch (error) {
            console.error('Error fetching MPIN status:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await fetchWithAuth(API_ENDPOINTS.BUYER_PROFILE);
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfileImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'We need access to your photos to update your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const formData = new FormData();
            formData.append('profileImage', {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: 'profile.jpg',
            } as any);

            try {
                const headers = await getAuthHeaders();
                // Remove Content-Type header to let browser set it with boundary
                const { 'Content-Type': _, ...otherHeaders } = headers as any;

                const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, {
                    method: 'PUT',
                    headers: {
                        ...otherHeaders,
                    },
                    body: formData,
                });
                const data = await response.json();
                if (data.success) {
                    setUser(prev => prev ? { ...prev, avatar: data.data.avatar || data.data.profileImage } : null);
                    showToast.success('Profile picture updated');
                }
            } catch (error) {
                console.error('Error updating profile image:', error);
                showToast.error('Failed to update profile picture');
            }
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await Promise.all([
            SecureStore.deleteItemAsync('userToken'),
            SecureStore.deleteItemAsync('userType'),
            SecureStore.deleteItemAsync('userData'),
        ]);
        router.replace('/login');
    };

    const shareApp = async () => {
        try {
            await Share.share({
                message: 'Check out JC Gold & Diamonds for exclusive jewelry schemes and collections!',
            });
        } catch (error) {
            console.error('Error sharing app:', error);
        }
    };

    const MenuItem = ({ icon, label, onPress, value, type = 'link', color = '#111827' }: any) => (
        <TouchableOpacity
            onPress={type === 'link' ? onPress : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' }}
            disabled={type === 'switch'}
        >
            <View style={{ width: 40, height: 40, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: color }}>{label}</Text>
            {value && typeof value === 'string' && (
                <View style={{ backgroundColor: (value === 'VERIFIED' || value === 'APPROVED') ? '#DCFCE7' : value === 'PENDING' ? '#FEF9C3' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: (value === 'VERIFIED' || value === 'APPROVED') ? '#15803D' : value === 'PENDING' ? '#854D0E' : '#EF4444' }}>{value}</Text>
                </View>
            )}
            {type === 'link' && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onPress}
                    trackColor={{ false: '#D1D5DB', true: '#f97316' }}
                    thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#fff' : '#f4f3f4'}
                />
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
                    <Skeleton width={100} height={24} />
                </View>
                <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
                    <Skeleton width="100%" height={200} style={{ borderRadius: 40, marginBottom: 40 }} />
                    <Skeleton width={120} height={12} style={{ marginBottom: 24 }} />
                    <Skeleton width="100%" height={300} style={{ borderRadius: 32 }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F9FAFB' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Profile</Text>
                <TouchableOpacity onPress={() => router.push('/notifications')} style={{ width: 40, height: 40, backgroundColor: '#F9FAFB', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' }}>
                    <Ionicons name="notifications-outline" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                {/* Profile Header */}
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <TouchableOpacity onPress={handleUpdateProfileImage} style={{ position: 'relative', marginBottom: 16 }}>
                        <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', borderWidth: 4, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <View style={{ width: '100%', height: '100%', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#9CA3AF' }}>{user?.name?.[0] || 'U'}</Text>
                                </View>
                            )}
                        </View>
                        <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#f97316', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' }}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{user?.name || 'User'}</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>{user?.phoneNumber}</Text>
                </View>

                {/* Account Settings */}
                <View style={{ paddingHorizontal: 24 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>Account Settings</Text>

                    <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/edit_profile')} />
                    <MenuItem icon="shield-checkmark-outline" label="KYC Verification" value={kycStatus} onPress={() => router.push('/kyc_verification')} />
                    <MenuItem icon="card-outline" label={bankStatus !== 'NOT_SUBMITTED' ? "Edit Bank Details" : "Bank Account Details"} value={bankStatus === 'NOT_SUBMITTED' ? null : bankStatus} onPress={() => router.push('/bank_details')} />
                    <MenuItem
                        icon="lock-closed-outline"
                        label="Security MPIN"
                        value={mpinStatus.isSet ? 'CONFIGURED' : 'NOT SET'}
                        color={mpinStatus.isSet ? '#111827' : '#ea580c'}
                        onPress={() => router.push(mpinStatus.isSet ? '/mpin_verification' : '/mpin_setup')}
                    />
                    <MenuItem icon="location-outline" label="My Addresses" onPress={() => router.push('/addresses')} />
                    <MenuItem icon="grid-outline" label="My Orders" onPress={() => router.push('/orders')} />
                </View>

                {/* App Settings */}
                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>App Settings</Text>

                    <MenuItem
                        icon="notifications-outline"
                        label="Push Notifications"
                        type="switch"
                        value={pushNotifications}
                        onPress={() => setPushNotifications(prev => !prev)}
                    />
                    <MenuItem
                        icon="finger-print-outline"
                        label="Biometric Login"
                        type="switch"
                        value={biometricAuth}
                        onPress={() => setShowBiometricModal(true)}
                    />
                </View>

                {/* Support & Legal */}
                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>Support & Legal</Text>

                    <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/support')} />
                    <MenuItem icon="share-social-outline" label="Share App" onPress={shareApp} />
                    <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => Linking.openURL('https://jcgold.com/terms')} />
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 40 }}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#EF4444' }}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={{ textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 16 }}>Version 1.0.0 (Build 100)</Text>
                </View>
            </ScrollView>

            <BottomNav activeTab="profile" />

            <ConfirmationModal
                visible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out? You will need to login again to access your account."
                type="danger"
                confirmText="Sign Out"
            />

            {/* Premium Biometric Coming Soon Modal */}
            <Modal
                visible={showBiometricModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBiometricModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 40, width: '100%', padding: 32, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                        {/* Decorative background element */}
                        <View style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, backgroundColor: '#FFF7ED', borderRadius: 70 }} />

                        <View style={{ width: 80, height: 80, backgroundColor: '#FFF7ED', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: 'white', shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                            <Ionicons name="finger-print" size={40} color="#f97316" />
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>Coming Soon! ✨</Text>

                        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                            Biometric login is currently under development. You'll soon be able to access your vault using Face ID or Fingerprint for ultimate security.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowBiometricModal(false)}
                            style={{ backgroundColor: '#111827', width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                        >
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Got it, Thanks!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
