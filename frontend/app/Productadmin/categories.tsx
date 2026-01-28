import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Image,
    Switch,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
import * as ImagePicker from 'expo-image-picker';
import { CategoryListSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface Category {
    _id: string;
    name: string;
    description: string;
    image?: string;
    isActive: boolean;
    productCount?: number;
    updatedAt: string;
}

export default function CategoriesManagement() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/categories`, { headers });
            const data = await response.json();
            if (data.success) setCategories(data.data || []);
        } catch (error) {
            console.error('Fetch Categories Failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) return Alert.alert('Error', 'Name is required');

        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const url = editMode ? `${BASE_URL}/api/v1/categories/${currentCategory?._id}` : `${BASE_URL}/api/v1/categories`;

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);

            if (selectedImage && selectedImage.startsWith('file')) {
                const filename = selectedImage.split('/').pop() || 'image.jpg';
                formDataToSend.append('image', {
                    uri: selectedImage,
                    type: 'image/jpeg',
                    name: filename,
                } as any);
            }

            const cleanHeaders = { ...headers };
            delete cleanHeaders['Content-Type'];

            const res = await fetch(url, {
                method: editMode ? 'PUT' : 'POST',
                headers: cleanHeaders,
                body: formDataToSend,
            });

            const data = await res.json();
            if (data.success) {
                setModalVisible(false);
                fetchCategories();
            }
        } catch (error) {
            Alert.alert('Error', 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (category: Category) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(`${BASE_URL}/api/v1/categories/${category._id}/status`, {
                method: 'PATCH',
                headers,
            });
            fetchCategories();
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const deleteCategory = async (category: Category) => {
        Alert.alert('Delete Category', `Permanently remove "${category.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const headers = await getAuthHeaders();
                        await fetch(`${BASE_URL}/api/v1/categories/${category._id}`, { method: 'DELETE', headers });
                        fetchCategories();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete category');
                    }
                }
            }
        ]);
    };

    const StatusBadge = ({ isActive }: { isActive: boolean }) => {
        return (
            <View className={`${isActive ? 'bg-green-500/10' : 'bg-gray-500/10'} px-2 py-0.5 rounded-lg border border-${isActive ? 'green' : 'gray'}-200/20`}>
                <Text className={`${isActive ? 'text-green-600' : 'text-gray-600'} text-[10px] font-black uppercase tracking-tighter`}>
                    {isActive ? 'ACT' : 'HIDDEN'}
                </Text>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-white">
                <CategoryListSkeleton />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Premium Header */}
            <SafeAreaView edges={['top']} className="bg-white px-6 py-4 flex-row justify-between items-center z-50">
                <View>
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Store Organization</Text>
                    <Text className="text-3xl font-black text-black">Categories</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        setEditMode(false);
                        setFormData({ name: '', description: '' });
                        setSelectedImage(null);
                        setModalVisible(true);
                    }}
                    className="bg-black w-12 h-12 rounded-2xl items-center justify-center shadow-xl shadow-black/40"
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCategories} tintColor="#ea580c" />}
            >
                {categories.map((category) => (
                    <View
                        key={category._id}
                        className={`bg-white rounded-[32px] border border-gray-100 p-5 mb-5 shadow-sm ${!category.isActive ? 'opacity-80' : ''}`}
                    >
                        <View className="flex-row items-center">
                            {/* Image Visual */}
                            <Image
                                source={{ uri: category.image?.startsWith('http') ? category.image : `${BASE_URL}${category.image}` }}
                                className="w-20 h-20 rounded-[24px] bg-gray-50 shadow-sm"
                            />

                            {/* Info */}
                            <View className="flex-1 ml-5">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-xl font-black text-gray-900 flex-1 mr-2" numberOfLines={1}>
                                        {category.name}
                                    </Text>
                                    <StatusBadge isActive={category.isActive} />
                                </View>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    {category.productCount || 0} Listed Items
                                </Text>

                                <View className="flex-row items-center mt-3">
                                    <Text className="text-gray-400 text-[10px] font-semibold" numberOfLines={2}>
                                        {category.description || 'No description provided'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* More Details Trigger */}
                        <TouchableOpacity
                            onPress={() => setMenuVisible(menuVisible === category._id ? null : category._id)}
                            className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Manage Category</Text>
                            <Ionicons
                                name={menuVisible === category._id ? "chevron-up" : "chevron-down"}
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>

                        {/* Menu Actions */}
                        {menuVisible === category._id && (
                            <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between">
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditMode(true);
                                        setCurrentCategory(category);
                                        setFormData({ name: category.name, description: category.description });
                                        setSelectedImage(category.image || null);
                                        setModalVisible(true);
                                        setMenuVisible(null);
                                    }}
                                    className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                >
                                    <Ionicons name="create-outline" size={18} color="black" />
                                    <Text className="ml-2 font-black text-xs uppercase">Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        toggleStatus(category);
                                        setMenuVisible(null);
                                    }}
                                    className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                >
                                    <Ionicons name={category.isActive ? "eye-off-outline" : "eye-outline"} size={18} color="black" />
                                    <Text className="ml-2 font-black text-xs uppercase">{category.isActive ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        deleteCategory(category);
                                        setMenuVisible(null);
                                    }}
                                    className="w-12 h-12 items-center justify-center bg-red-50 rounded-2xl"
                                >
                                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Premium Create/Edit Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent={true}>
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8 pb-12">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Organization</Text>
                                <Text className="text-3xl font-black text-black">{editMode ? 'Edit' : 'Create'}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-black font-black text-xs uppercase mb-3 ml-1">Thumbnail</Text>
                        <TouchableOpacity
                            onPress={handleImagePick}
                            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] w-full h-40 items-center justify-center mb-6 overflow-hidden"
                        >
                            {selectedImage ? (
                                <Image
                                    source={{ uri: selectedImage.startsWith('http') ? selectedImage : (selectedImage.startsWith('file') ? selectedImage : `${BASE_URL}${selectedImage}`) }}
                                    className="w-full h-full"
                                />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="cloud-upload" size={32} color="#9ca3af" />
                                    <Text className="text-gray-400 font-bold mt-2">Pick an image</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text className="text-black font-black text-xs uppercase mb-3 ml-1">Identity</Text>
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-4 mb-4 font-bold text-black border border-gray-100"
                            placeholder="Category Name"
                            value={formData.name}
                            onChangeText={(t) => setFormData({ ...formData, name: t })}
                        />
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-4 mb-8 font-medium text-black border border-gray-100"
                            placeholder="Brief description"
                            multiline
                            value={formData.description}
                            onChangeText={(t) => setFormData({ ...formData, description: t })}
                        />

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            className="bg-orange-600 py-5 rounded-[24px] items-center shadow-xl shadow-orange-600/30"
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg uppercase tracking-widest">Save Category</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}
