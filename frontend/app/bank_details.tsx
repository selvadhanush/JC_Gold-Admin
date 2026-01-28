import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../api';
import Input from '../components/Input';
import Button from '../components/Button';
import { showToast } from '../utils/toast';

export default function BankDetailsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bankData, setBankData] = useState({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        accountType: 'SAVINGS',
        passbookImage: null as string | null,
        status: 'PENDING'
    });

    useEffect(() => {
        fetchBankDetails();
    }, []);

    const fetchBankDetails = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_BANK_ACCOUNT, { headers });
            const data = await response.json();
            if (data.success && data.data) {
                setBankData(data.data);
            }
        } catch (error) {
            console.error('Error fetching bank details:', error);
            showToast.error('Failed to load bank details');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need access to your photos to upload your passbook image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setBankData(prev => ({ ...prev, passbookImage: result.assets[0].uri }));
        }
    };

    const handleSave = async () => {
        const { accountHolderName, accountNumber, ifscCode, bankName, branchName, passbookImage } = bankData;

        if (!accountHolderName || !accountNumber || !ifscCode || !bankName || !branchName || !passbookImage) {
            return Alert.alert('Missing Information', 'Please fill in all fields and upload a passbook image.');
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('accountHolderName', accountHolderName);
            formData.append('accountNumber', accountNumber);
            formData.append('ifscCode', ifscCode);
            formData.append('bankName', bankName);
            formData.append('branchName', branchName);
            formData.append('accountType', bankData.accountType);

            if (passbookImage && !passbookImage.startsWith('http')) {
                formData.append('passbookImage', {
                    uri: passbookImage,
                    type: 'image/jpeg',
                    name: 'passbook.jpg',
                } as any);
            }

            const headers = await getAuthHeaders();
            const { 'Content-Type': _, ...otherHeaders } = headers as any;

            const response = await fetch(API_ENDPOINTS.BUYER_BANK_ACCOUNT, {
                method: 'POST',
                headers: {
                    ...otherHeaders,
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Bank details saved successfully!');
                router.back();
            } else {
                showToast.error(data.message || 'Failed to save bank details');
            }
        } catch (error) {
            console.error('Save Bank Details Error:', error);
            showToast.error('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#ea580c" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-50 bg-white">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Settings</Text>
                    <Text className="text-xl font-black text-gray-900">Bank Account 🏦</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="px-6 py-8">

                        {bankData.status === 'APPROVED' && (
                            <View className="bg-green-50 p-4 rounded-2xl flex-row items-center mb-6">
                                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                <Text className="ml-2 text-green-700 font-bold text-xs">Your bank details are verified.</Text>
                            </View>
                        )}

                        <View className="space-y-6">
                            <Input
                                label="ACCOUNT HOLDER NAME"
                                placeholder="Name as per bank records"
                                value={bankData.accountHolderName}
                                onChangeText={(text) => setBankData(prev => ({ ...prev, accountHolderName: text }))}
                                icon="👤"
                                className="bg-gray-50 border-gray-100"
                            />

                            <Input
                                label="ACCOUNT NUMBER"
                                placeholder="Your 12-16 digit account number"
                                value={bankData.accountNumber}
                                onChangeText={(text) => setBankData(prev => ({ ...prev, accountNumber: text }))}
                                keyboardType="numeric"
                                icon="💳"
                                className="bg-gray-50 border-gray-100"
                            />

                            <Input
                                label="IFSC CODE"
                                placeholder="e.g. SBIN0001234"
                                value={bankData.ifscCode}
                                onChangeText={(text) => setBankData(prev => ({ ...prev, ifscCode: text.toUpperCase() }))}
                                autoCapitalize="characters"
                                icon="🏛️"
                                className="bg-gray-50 border-gray-100"
                            />

                            <Input
                                label="BANK NAME"
                                placeholder="e.g. State Bank of India"
                                value={bankData.bankName}
                                onChangeText={(text) => setBankData(prev => ({ ...prev, bankName: text }))}
                                icon="🏦"
                                className="bg-gray-50 border-gray-100"
                            />

                            <Input
                                label="BRANCH NAME"
                                placeholder="e.g. Downtown Branch"
                                value={bankData.branchName}
                                onChangeText={(text) => setBankData(prev => ({ ...prev, branchName: text }))}
                                icon="📍"
                                className="bg-gray-50 border-gray-100"
                            />

                            <View className="mb-4">
                                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 px-1">Account Type</Text>
                                <View className="flex-row space-x-4">
                                    <TouchableOpacity
                                        onPress={() => setBankData(prev => ({ ...prev, accountType: 'SAVINGS' }))}
                                        className={`flex-1 py-4 rounded-2xl border items-center ${bankData.accountType === 'SAVINGS' ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <Text className={`font-black ${bankData.accountType === 'SAVINGS' ? 'text-primary-800' : 'text-gray-500'}`}>Savings</Text>
                                    </TouchableOpacity>
                                    <View className="w-4" />
                                    <TouchableOpacity
                                        onPress={() => setBankData(prev => ({ ...prev, accountType: 'CURRENT' }))}
                                        className={`flex-1 py-4 rounded-2xl border items-center ${bankData.accountType === 'CURRENT' ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <Text className={`font-black ${bankData.accountType === 'CURRENT' ? 'text-primary-800' : 'text-gray-500'}`}>Current</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="mb-8">
                                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 px-1">Passbook / Cancelled Cheque Image</Text>
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="w-full h-48 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 items-center justify-center overflow-hidden"
                                >
                                    {bankData.passbookImage ? (
                                        <Image source={{ uri: bankData.passbookImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="items-center">
                                            <Ionicons name="cloud-upload-outline" size={40} color="#9ca3af" />
                                            <Text className="text-gray-400 font-bold text-xs mt-2">Tap to upload image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Button
                                title={saving ? "Saving..." : "Save Bank Details"}
                                onPress={handleSave}
                                disabled={saving}
                                loading={saving}
                                className="bg-primary-600 h-16 rounded-[24px] shadow-xl shadow-primary-500/30"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
