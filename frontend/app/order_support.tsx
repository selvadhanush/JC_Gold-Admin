import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import Toast from 'react-native-toast-message';

export default function OrderSupport() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [category, setCategory] = useState<'PRODUCT' | 'PAYMENT' | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCategorySelect = (cat: 'PRODUCT' | 'PAYMENT') => {
        setCategory(cat);
    };

    const handleSubmit = async () => {
        if (!category || !subject || !message) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all the details.'
            });
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_SUPPORT, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    orderId,
                    category,
                    subject,
                    message,
                }),
            });

            const data = await response.json();
            if (data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Ticket Submitted',
                    text2: 'We will get back to you soon.'
                });
                router.back();
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100"
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-base font-black text-gray-900">Support Inquiry</Text>
                <View className="w-12" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} className="px-6">
                    <View className="mt-8 mb-10">
                        <Text className="text-2xl font-black text-gray-900 mb-2">How can we help?</Text>
                        <Text className="text-gray-500 font-medium">Select a category and describe your issue.</Text>
                    </View>

                    {/* Category Selection */}
                    <View className="flex-row justify-between mb-2">
                        <TouchableOpacity
                            onPress={() => handleCategorySelect('PRODUCT')}
                            className={`w-[48%] py-6 rounded-[28px] border-2 items-center ${category === 'PRODUCT' ? 'bg-primary-50 border-primary-600' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${category === 'PRODUCT' ? 'bg-primary-600' : 'bg-gray-200'}`}>
                                <Ionicons name="cube-outline" size={24} color="white" />
                            </View>
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${category === 'PRODUCT' ? 'text-primary-600' : 'text-gray-400'}`}>Product Issue</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleCategorySelect('PAYMENT')}
                            className={`w-[48%] py-6 rounded-[28px] border-2 items-center ${category === 'PAYMENT' ? 'bg-orange-50 border-orange-500' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${category === 'PAYMENT' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                                <Ionicons name="card-outline" size={24} color="white" />
                            </View>
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${category === 'PAYMENT' ? 'text-orange-600' : 'text-gray-400'}`}>Payment Issue</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="h-6 mb-4" />

                    {category && (
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
                                        placeholder="Describe your issue in detail..."
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
                                disabled={loading}
                                className={`h-16 rounded-[28px] items-center justify-center shadow-xl ${category === 'PRODUCT' ? 'bg-primary-600 shadow-primary-500/30' :
                                    'bg-orange-500 shadow-orange-500/30'
                                    }`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-black uppercase tracking-widest text-xs">Submit Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    <View className="h-10" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
