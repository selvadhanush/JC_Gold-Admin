import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../api';
import { showToast } from '../utils/toast';

export default function EditProfile() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, { headers });
            const data = await response.json();
            if (data.success) {
                setName(data.data.name || '');
                setEmail(data.data.email || '');
                setPhone(data.data.phoneNumber || '');
                setAvatar(data.data.avatar || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showToast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast.error('Permission required to access gallery');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setImageUploading(true);
        const formData = new FormData();
        formData.append('profileImage', {
            uri: uri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
        } as any);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/buyer/profile/update-image`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setAvatar(data.data.avatar);
                showToast.success('Profile picture updated');
            } else {
                showToast.error(data.message || 'Image upload failed');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showToast.error('Failed to upload image');
        } finally {
            setImageUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!name || !phone) {
            showToast.error('Name and phone are required');
            return;
        }

        setSaving(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name, email, phoneNumber: phone }),
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Profile updated successfully');
                router.back();
            } else {
                showToast.error(data.message || 'Update failed');
            }
        } catch (err) {
            console.error('Update Error:', err);
            showToast.error('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="mt-4 text-gray-500 font-medium text-base">Preparing your profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{
                headerShown: false,
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <Ionicons name="chevron-back" size={28} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-gray-900">Edit Profile</Text>
                    <View className="w-10" />
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                >
                    <View className="flex-1 px-6 pt-8 pb-10">
                        <View className="items-center mb-10">
                            <TouchableOpacity
                                onPress={handlePickImage}
                                className="relative shadow-2xl shadow-black/20"
                            >
                                <View className="w-32 h-32 rounded-[40px] border-4 border-white bg-gray-200 overflow-hidden">
                                    {avatar ? (
                                        <Image source={{ uri: avatar }} className="w-full h-full" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-primary-50">
                                            <Ionicons name="person" size={50} color="#ea580c" />
                                        </View>
                                    )}
                                    {imageUploading && (
                                        <BlurView intensity={40} className="absolute inset-0 items-center justify-center">
                                            <ActivityIndicator color="#ea580c" />
                                        </BlurView>
                                    )}
                                </View>
                                <View className="absolute bottom-1 right-1 bg-primary-500 w-10 h-10 rounded-2xl border-2 border-white items-center justify-center shadow-md">
                                    <Ionicons name="camera" size={18} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text className="mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest">Tap to change photo</Text>
                        </View>

                        {/* Form Section */}
                        <View className="space-y-6">
                            <View>
                                <Text className="text-gray-900 font-black text-lg mb-6">Account Details</Text>

                                <Input
                                    label="FULL NAME"
                                    placeholder="e.g. John Doe"
                                    icon="👤"
                                    value={name}
                                    onChangeText={setName}
                                    containerClassName="mb-5"
                                    className="bg-white border-gray-100"
                                />

                                <Input
                                    label="EMAIL ADDRESS"
                                    placeholder="john@example.com"
                                    icon="📧"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    containerClassName="mb-5"
                                    className="bg-white border-gray-100"
                                />

                                <Input
                                    label="PHONE NUMBER"
                                    placeholder="+91 00000 00000"
                                    icon="📱"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    containerClassName="mb-10"
                                    className="bg-white border-gray-100"
                                />
                            </View>

                            <View className="pt-4">
                                <Button
                                    title="Save Profile"
                                    onPress={handleUpdate}
                                    loading={saving}
                                    className="bg-primary-600 h-14 shadow-xl shadow-primary-500/30 rounded-[20px]"
                                />

                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="mt-6 py-2 items-center"
                                >
                                    <Text className="text-gray-400 font-bold text-base">Discard Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
