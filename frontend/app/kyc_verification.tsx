import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../api';
import { showToast } from '../utils/toast';

const KYC_STEPS = [
    { id: 1, title: 'Personal', icon: 'person' },
    { id: 2, title: 'Identity', icon: 'card' },
    { id: 3, title: 'Address', icon: 'home' },
];

export default function KycVerification() {
    const router = useRouter();
    const [status, setStatus] = useState<string>('NOT_SUBMITTED');
    const [mpinSet, setMpinSet] = useState<boolean>(true);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [docType, setDocType] = useState('AADHAAR');
    const [docNumber, setDocNumber] = useState('');
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [address1, setAddress1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    useEffect(() => {
        fetchKycStatus();
        fetchMpinStatus();
    }, []);

    const fetchKycStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const data = await response.json();

            if (data.success) {
                const kyc = data.data;
                setStatus(kyc.status);

                if (kyc.status === 'REJECTED') {
                    setRejectionReason(kyc.rejectionReason);
                }

                // If partially filled or rejected, we could pre-fill, but keeping it simple for now
                if (kyc.personalDetails) {
                    setFullName(kyc.personalDetails.fullName);
                    setDob(kyc.personalDetails.dob ? kyc.personalDetails.dob.split('T')[0] : '');
                }
                if (kyc.address) {
                    setAddress1(kyc.address.line1);
                    setCity(kyc.address.city);
                    setState(kyc.address.state);
                    setPincode(kyc.address.pincode);
                }
                if (kyc.document) {
                    setDocType(kyc.document.type);
                    // Number is masked by backend, so we don't pre-fill it to avoid editing issues
                }
            }
        } catch (error) {
            console.error('Error fetching KYC:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMpinStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_MPIN_STATUS, { headers });
            const data = await response.json();
            if (data.success) {
                setMpinSet(data.data.isSet);
            }
        } catch (error) {
            console.error('Error fetching MPIN status:', error);
        }
    };

    if (!mpinSet && !loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center px-10">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="w-24 h-24 bg-orange-50 rounded-[32px] items-center justify-center mb-8">
                    <Ionicons name="lock-closed" size={48} color="#ea580c" />
                </View>
                <Text className="text-2xl font-black text-gray-900 text-center mb-4">Security Setup Required</Text>
                <Text className="text-gray-500 text-center text-base leading-6 mb-10">
                    For your protection, you must set up a 6-digit MPIN before proceeding with identity verification.
                </Text>
                <Button
                    title="Set MPIN Now"
                    onPress={() => router.push('/mpin_setup')}
                    className="w-full bg-primary-600 h-16 rounded-[22px]"
                />
            </SafeAreaView>
        );
    }

    const pickImage = async (type: 'front' | 'back') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast.error('Permission required to access gallery');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            if (type === 'front') setFrontImage(result.assets[0].uri);
            else setBackImage(result.assets[0].uri);
        }
    };

    const uploadImages = async (): Promise<{ frontImage?: string, backImage?: string } | null> => {
        try {
            const formData = new FormData();
            let hasNewFiles = false;

            if (frontImage && !frontImage.startsWith('http')) {
                const filename = frontImage.split('/').pop() || 'front.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                // @ts-ignore
                formData.append('frontImage', { uri: frontImage, name: filename, type });
                hasNewFiles = true;
            }

            if (backImage && !backImage.startsWith('http')) {
                const filename = backImage.split('/').pop() || 'back.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                // @ts-ignore
                formData.append('backImage', { uri: backImage, name: filename, type });
                hasNewFiles = true;
            }

            if (!hasNewFiles) return {};

            const headers = await getAuthHeaders();
            // @ts-ignore
            delete headers['Content-Type'];

            const response = await fetch(API_ENDPOINTS.BUYER_KYC_UPLOAD, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Image upload failed');
            }

            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Image Upload Error:', error);
            return null;
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!fullName || !dob) {
                showToast.error('Please fill all personal details');
                return;
            }
            // Basic date format check
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                showToast.error('Date of birth must be YYYY-MM-DD');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!docNumber || !frontImage) {
                showToast.error('Document number and front image are required');
                return;
            }
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!address1 || !city || !state || !pincode) {
            showToast.error('Please fill all address details');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload Images first
            const uploadedPaths = await uploadImages();
            if (!uploadedPaths) {
                showToast.error('Document upload failed. Please try again.');
                setSubmitting(false);
                return;
            }

            // 2. Prepare payload
            const payload = {
                personalDetails: { fullName, dob },
                document: {
                    type: docType,
                    number: docNumber,
                    frontImage: uploadedPaths.frontImage || frontImage,
                    backImage: uploadedPaths.backImage || backImage
                },
                address: {
                    line1: address1,
                    city,
                    state,
                    pincode,
                    country: 'India'
                }
            };

            const headers = await getAuthHeaders();
            const endpoint = status === 'REJECTED' ? API_ENDPOINTS.BUYER_KYC_RESUBMIT : API_ENDPOINTS.BUYER_KYC_SUBMIT;
            const method = status === 'REJECTED' ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers,
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('KYC submitted successfully');
                setStatus('PENDING');
            } else {
                showToast.error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('KYC Submit Error:', error);
            showToast.error('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#ea580c" />
            </SafeAreaView>
        );
    }

    if (status === 'PENDING' || status === 'APPROVED') {
        const isApproved = status === 'APPROVED';
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center px-10">
                    <View
                        className="w-32 h-32 rounded-[44px] items-center justify-center mb-10"
                        style={{ backgroundColor: isApproved ? '#dcfce7' : '#fff7ed' }}
                    >
                        <Ionicons
                            name={isApproved ? 'shield-checkmark' : 'timer'}
                            size={72}
                            color={isApproved ? '#16a34a' : '#ea580c'}
                        />
                    </View>
                    <Text className="text-3xl font-black text-gray-900 text-center mb-4">
                        {isApproved ? 'Identity Verified' : 'Under Review'}
                    </Text>
                    <Text className="text-gray-500 text-center text-lg leading-7 mb-4">
                        {isApproved
                            ? 'Your account has been fully verified. You can now enjoy full access to all features.'
                            : 'Our compliance team is reviewing your documents. You will receive a notification once approved.'}
                    </Text>
                    {!isApproved && (
                        <View className="bg-gray-50 px-4 py-2 rounded-full mb-12 flex-row items-center border border-gray-100">
                            <Ionicons name="time-outline" size={16} color="#6b7280" />
                            <Text className="text-gray-500 text-xs font-bold ml-2">Verification usually takes 2-3 business days</Text>
                        </View>
                    )}
                    <Button
                        title="Back to Dashboard"
                        onPress={() => router.replace('/buyer_dashboard')}
                        className="w-full bg-gray-900 h-16 rounded-[22px]"
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="chevron-back" size={28} color="#111827" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-gray-900">Verification</Text>
                <View className="w-10" />
            </View>

            {status === 'REJECTED' && (
                <View className="bg-rose-50 px-6 py-4 flex-row items-center border-b border-rose-100">
                    <Ionicons name="alert-circle" size={24} color="#e11d48" />
                    <View className="ml-3 flex-1">
                        <Text className="text-rose-900 font-bold text-sm">Verification Failed</Text>
                        <Text className="text-rose-700 text-xs mt-0.5">{rejectionReason || 'Please review your documents and resubmit.'}</Text>
                    </View>
                </View>
            )}

            {/* Premium Stepper */}
            <View className="flex-row px-8 pt-8 pb-4 bg-white">
                {KYC_STEPS.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <View className="items-center">
                            <View
                                className="w-12 h-12 rounded-2xl items-center justify-center shadow-sm"
                                style={{
                                    backgroundColor: step >= s.id ? '#ea580c' : '#f3f4f6',
                                    shadowColor: step >= s.id ? '#ea580c' : 'transparent'
                                }}
                            >
                                <Ionicons name={s.icon as any} size={20} color={step >= s.id ? 'white' : '#9CA3AF'} />
                            </View>
                            <Text
                                className="mt-2 text-[10px] font-black uppercase tracking-tighter"
                                style={{ color: step >= s.id ? '#ea580c' : '#9ca3af' }}
                            >
                                {s.title}
                            </Text>
                        </View>
                        {i < KYC_STEPS.length - 1 && (
                            <View className="flex-1 h-[2px] mt-6 mx-2 bg-gray-100 overflow-hidden">
                                <View className="h-full bg-orange-600" style={{ width: step > s.id ? '100%' : '0%' }} />
                            </View>
                        )}
                    </React.Fragment>
                ))}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>

                    {step === 1 && (
                        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                            <Text className="text-2xl font-black text-gray-900 mb-2">Personal Data</Text>
                            <View className="flex-row items-center mb-8">
                                <Text className="text-gray-400 font-medium">Enter your details as shown on your ID</Text>
                                <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                <Text className="ml-1 text-[11px] text-gray-400 font-bold">2-3 Days</Text>
                            </View>

                            <Input
                                label="FULL NAME"
                                placeholder="Full name"
                                value={fullName}
                                onChangeText={setFullName}
                                containerClassName="mb-6"
                                className="bg-gray-50 border-gray-50"
                            />
                            <Input
                                label="DATE OF BIRTH"
                                placeholder="YYYY-MM-DD"
                                value={dob}
                                onChangeText={setDob}
                                containerClassName="mb-4"
                                className="bg-gray-50 border-gray-50"
                            />

                            <View className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex-row items-center">
                                <Ionicons name="information-circle" size={20} color="#ea580c" />
                                <Text className="ml-3 text-orange-800 text-xs font-bold flex-1">Ensure the name exactly matches your identity document.</Text>
                            </View>
                        </View>
                    )}

                    {step === 2 && (
                        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                            <Text className="text-2xl font-black text-gray-900 mb-2">Identity Proof</Text>
                            <Text className="text-gray-400 font-medium mb-8">Upload a clear photo of your ID</Text>

                            <View className="flex-row mb-8 bg-gray-50 p-1.5 rounded-2xl">
                                {['AADHAAR', 'PAN', 'PASSPORT'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setDocType(t)}
                                        className="flex-1 py-3 items-center rounded-xl"
                                        style={{
                                            backgroundColor: docType === t ? 'white' : 'transparent',
                                            shadowColor: docType === t ? '#000' : 'transparent',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: docType === t ? 0.05 : 0,
                                            shadowRadius: 2,
                                            elevation: docType === t ? 1 : 0
                                        }}
                                    >
                                        <Text
                                            className="font-black text-[10px] tracking-widest"
                                            style={{ color: docType === t ? '#ea580c' : '#9ca3af' }}
                                        >{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Input label="DOCUMENT NUMBER" placeholder="ID number" value={docNumber} onChangeText={setDocNumber} containerClassName="mb-8" className="bg-gray-50 border-gray-50" />

                            <View className="flex-row">
                                <TouchableOpacity
                                    onPress={() => pickImage('front')}
                                    className="flex-1 aspect-[4/3] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center overflow-hidden"
                                >
                                    {frontImage ? (
                                        <Image source={{ uri: frontImage }} className="w-full h-full" />
                                    ) : (
                                        <View className="items-center">
                                            <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mb-2">
                                                <Ionicons name="camera" size={24} color="#ea580c" />
                                            </View>
                                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Front View</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <View className="w-4" />

                                <TouchableOpacity
                                    onPress={() => pickImage('back')}
                                    className="flex-1 aspect-[4/3] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center overflow-hidden"
                                >
                                    {backImage ? (
                                        <Image source={{ uri: backImage }} className="w-full h-full" />
                                    ) : (
                                        <View className="items-center">
                                            <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm mb-2">
                                                <Ionicons name="camera" size={24} color="#9ca3af" />
                                            </View>
                                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Back View</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                            <Text className="text-2xl font-black text-gray-900 mb-2">Residential Address</Text>
                            <Text className="text-gray-400 font-medium mb-8">Where can we reach you?</Text>

                            <Input label="STREET ADDRESS" placeholder="Apartment, Street, Area" value={address1} onChangeText={setAddress1} containerClassName="mb-6" className="bg-gray-50 border-gray-50" />
                            <View className="flex-row">
                                <Input label="CITY" placeholder="City" value={city} onChangeText={setCity} containerClassName="flex-1 mr-4" className="bg-gray-50 border-gray-50" />
                                <Input label="STATE" placeholder="State" value={state} onChangeText={setState} containerClassName="flex-1" className="bg-gray-50 border-gray-50" />
                            </View>
                            <Input label="ZIP / PINCODE" placeholder="000 000" value={pincode} onChangeText={setPincode} keyboardType="number-pad" containerClassName="mt-6 mb-2" className="bg-gray-50 border-gray-50" />
                        </View>
                    )}

                    <View className="mt-10 px-2">
                        {step < 3 ? (
                            <Button
                                title="Continue"
                                onPress={handleNext}
                                className="h-16 bg-primary-600 rounded-[24px] shadow-lg shadow-primary-500/40"
                            />
                        ) : (
                            <Button
                                title={status === 'REJECTED' ? "Resubmit Verification" : "Finish Verification"}
                                onPress={handleSubmit}
                                loading={submitting}
                                className="h-16 rounded-[24px] shadow-lg"
                                style={{
                                    backgroundColor: status === 'REJECTED' ? '#ea580c' : '#ea580c',
                                    shadowColor: status === 'REJECTED' ? '#ea580c' : '#ea580c',
                                    shadowOpacity: 0.4
                                }}
                            />
                        )}
                        {step > 1 && (
                            <TouchableOpacity onPress={() => setStep(step - 1)} className="mt-6 py-2 items-center">
                                <Text className="text-gray-400 font-black text-base">Back to previous step</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
