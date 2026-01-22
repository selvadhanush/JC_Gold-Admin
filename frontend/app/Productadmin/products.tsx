import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
import ProductAdminNav from '../../components/ProductAdminNav';
import * as ImagePicker from 'expo-image-picker';
import { ProductListSkeleton } from '../../components/SkeletonLoader';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    name: string;
    description: string;
    sku: string;
    price: number;
    stock: number;
    category: { _id: string; name: string };
    images: string[];
    status: 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'DISCONTINUED';
    specifications?: {
        metalType: string;
        purity: string;
        weight: number;
        size?: string;
    };
}

interface Category {
    _id: string;
    name: string;
}

type FilterType = 'ALL' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK';

export default function ProductsManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        description: '',
        category: '',
        status: 'ACTIVE',
        metalType: 'GOLD',
        purity: '',
        weight: '',
        initialStock: '0'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, activeFilter]);

    const fetchInitialData = async () => {
        try {
            const headers = await getAuthHeaders();
            const [prodRes, catRes] = await Promise.all([
                fetch(`${BASE_URL}/api/v1/products`, { headers }),
                fetch(`${BASE_URL}/api/v1/categories`, { headers })
            ]);

            const [prodData, catData] = await Promise.all([
                prodRes.json(),
                catRes.json()
            ]);

            if (prodData.success) setProducts(prodData.data || []);
            if (catData.success) setCategories(catData.data || []);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;
        if (activeFilter !== 'ALL') filtered = filtered.filter(p => p.status === activeFilter);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query) ||
                p.price.toString().includes(query)
            );
        }
        setFilteredProducts(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInitialData();
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            setSelectedImages([...selectedImages, ...newImages]);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sku: '',
            price: '',
            description: '',
            category: '',
            status: 'ACTIVE',
            metalType: 'GOLD',
            purity: '',
            weight: '',
            initialStock: '0'
        });
        setSelectedImages([]);
        setEditMode(false);
        setCurrentProductId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setModalVisible(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditMode(true);
        setCurrentProductId(product._id);
        setFormData({
            name: product.name,
            sku: product.sku,
            price: product.price.toString(),
            description: product.description,
            category: product.category?._id || '',
            status: product.status,
            metalType: product.specifications?.metalType || 'GOLD',
            purity: product.specifications?.purity || '',
            weight: product.specifications?.weight?.toString() || '',
            initialStock: product.stock.toString()
        });
        setSelectedImages(product.images || []);
        setModalVisible(true);
        setMenuVisible(null);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.sku || !formData.price || !formData.category) {
            return Alert.alert('Missing Fields', 'Please fill in all required fields (Name, SKU, Price, Category)');
        }

        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const url = editMode ? `${BASE_URL}/api/v1/products/${currentProductId}` : `${BASE_URL}/api/v1/products`;
            const method = editMode ? 'PUT' : 'POST';

            const form = new FormData();
            form.append('name', formData.name);
            form.append('sku', formData.sku);
            form.append('price', formData.price);
            form.append('description', formData.description);
            form.append('category', formData.category);
            form.append('status', formData.status);
            form.append('initialStock', formData.initialStock);

            // Specifications
            form.append('specifications[metalType]', formData.metalType);
            form.append('specifications[purity]', formData.purity);
            form.append('specifications[weight]', formData.weight);

            // Images
            selectedImages.forEach((uri, index) => {
                if (uri.startsWith('file')) {
                    const filename = uri.split('/').pop() || `product_${index}.jpg`;
                    form.append('images', {
                        uri: uri,
                        type: 'image/jpeg',
                        name: filename,
                    } as any);
                }
            });

            const cleanHeaders = { ...headers };
            delete cleanHeaders['Content-Type'];

            const res = await fetch(url, {
                method,
                headers: cleanHeaders,
                body: form
            });

            const data = await res.json();
            if (data.success) {
                setModalVisible(false);
                fetchInitialData();
                showToast.success(`Product ${editMode ? 'updated' : 'created'} successfully`);
            } else {
                showToast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Submit Error:', error);
            showToast.error('Connection failed');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteProduct = async (product: Product) => {
        Alert.alert('Delete Product', `Permanently remove "${product.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const headers = await getAuthHeaders();
                        await fetch(`${BASE_URL}/api/v1/products/${product._id}`, { method: 'DELETE', headers });
                        fetchInitialData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete product');
                    }
                }
            }
        ]);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            ACTIVE: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'ACT' },
            DRAFT: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Draft' },
            OUT_OF_STOCK: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Out' },
            DISCONTINUED: { bg: 'bg-black/10', text: 'text-black', label: 'End' },
        };
        const s = config[status] || config.DRAFT;
        return (
            <View className={`${s.bg} px-2 py-0.5 rounded-lg border border-${s.text.split('-')[1]}-200/20`}>
                <Text className={`${s.text} text-[10px] font-black uppercase tracking-tighter`}>{s.label}</Text>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <ProductListSkeleton />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium App Bar */}
            <SafeAreaView edges={['top']} className="bg-white z-50">
                <View className="px-6 py-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Inventory Management</Text>
                        <Text className="text-3xl font-black text-black">Products</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleOpenCreate}
                        className="bg-orange-600 w-12 h-12 rounded-2xl items-center justify-center shadow-xl shadow-orange-600/40"
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Advanced Search & Filter Bar */}
                <View className="px-6 pb-2">
                    <View className="relative bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 flex-row items-center">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-3 text-black font-medium"
                            placeholder="Discover products by name, sku..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2 mb-4"
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                >
                    {['ALL', 'ACTIVE', 'DRAFT', 'OUT_OF_STOCK'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setActiveFilter(f as FilterType)}
                            className={`${activeFilter === f ? 'bg-black' : 'bg-gray-100'} px-6 py-2.5 rounded-full`}
                        >
                            <Text className={`${activeFilter === f ? 'text-white' : 'text-gray-600'} font-black text-xs uppercase tracking-tight`}>
                                {f.replace(/_/g, ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
            >
                {filteredProducts.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <View className="bg-orange-50 w-24 h-24 rounded-full items-center justify-center mb-6">
                            <Ionicons name="search" size={40} color="#ea580c" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900">Zero Results</Text>
                        <Text className="text-gray-500 font-medium text-center mt-2 px-10">We couldn't find any products matching your current filters.</Text>
                    </View>
                ) : (
                    filteredProducts.map((product) => (
                        <TouchableOpacity
                            key={product._id}
                            activeOpacity={0.9}
                            className="bg-white rounded-[32px] border border-gray-100 p-5 mb-5 shadow-sm"
                            style={{ elevation: 2 }}
                        >
                            <View className="flex-row items-start">
                                {/* Visual Container */}
                                <View className="relative">
                                    <Image
                                        source={{ uri: product.images[0]?.startsWith('/') ? `${BASE_URL}${product.images[0]}` : (product.images[0] || 'https://via.placeholder.com/100') }}
                                        className="w-24 h-24 rounded-3xl bg-gray-50"
                                    />
                                </View>

                                {/* Content Details */}
                                <View className="flex-1 ml-5">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <Text className="text-lg font-black text-gray-900 flex-1 mr-2" numberOfLines={1}>
                                            {product.name}
                                        </Text>
                                        <StatusBadge status={product.status} />
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">SKU: {product.sku}</Text>
                                    </View>

                                    <View className="flex-row items-end justify-between mt-auto">
                                        <View>
                                            <Text className="text-gray-400 text-[10px] font-black uppercase">Current Price</Text>
                                            <Text className="text-xl font-black text-orange-600">₹{product.price.toLocaleString()}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-gray-400 text-[10px] font-black uppercase">Availability</Text>
                                            <View className="flex-row items-center">
                                                <View className={`w-2 h-2 rounded-full mr-2 ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                <Text className="text-sm font-black text-gray-900">{product.stock} Units</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* More Details Trigger */}
                            <TouchableOpacity
                                onPress={() => setMenuVisible(menuVisible === product._id ? null : product._id)}
                                className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center"
                            >
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">More Details</Text>
                                <Ionicons
                                    name={menuVisible === product._id ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>

                            {/* Menu Actions */}
                            {menuVisible === product._id && (
                                <View className="mt-6 pt-6 border-t border-gray-100 flex-row justify-between">
                                    <TouchableOpacity
                                        onPress={() => handleOpenEdit(product)}
                                        className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                    >
                                        <Ionicons name="create-outline" size={18} color="black" />
                                        <Text className="ml-2 font-black text-xs uppercase">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setMenuVisible(null);
                                            router.replace('/Productadmin/inventory');
                                        }}
                                        className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                    >
                                        <Ionicons name="layers-outline" size={18} color="black" />
                                        <Text className="ml-2 font-black text-xs uppercase">Stock</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteProduct(product)}
                                        className="w-12 h-12 items-center justify-center bg-red-50 rounded-2xl"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Premium Create/Edit Product Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="px-6 py-4 flex-row justify-between items-center border-b border-gray-100">
                        <View>
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Catalog System</Text>
                            <Text className="text-2xl font-black text-black">{editMode ? 'Edit Product' : 'New Product'}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                        >
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                            {/* Images Section */}
                            <Text className="text-black font-black text-xs uppercase mb-3">Product Media (Max 5)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                <TouchableOpacity
                                    onPress={handlePickImage}
                                    className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px] items-center justify-center mr-4"
                                >
                                    <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm mb-1">
                                        <Ionicons name="camera" size={20} color="#ea580c" />
                                    </View>
                                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Add Media</Text>
                                </TouchableOpacity>
                                {selectedImages.map((uri, idx) => (
                                    <View key={idx} className="relative mr-4">
                                        <Image
                                            source={{ uri: uri.startsWith('/') ? `${BASE_URL}${uri}` : uri }}
                                            className="w-24 h-24 rounded-[32px] bg-gray-50 border border-gray-100"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                            className="absolute -top-1 -right-1 bg-black w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                                        >
                                            <Ionicons name="close" size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>

                            <View className="space-y-4 mb-20">
                                <View>
                                    <Text className="text-black font-black text-xs uppercase mb-2 ml-1">Identity</Text>
                                    <TextInput
                                        placeholder="Product Name *"
                                        value={formData.name}
                                        onChangeText={t => setFormData({ ...formData, name: t })}
                                        className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                                    />
                                </View>

                                <View className="flex-row space-x-3">
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-xs uppercase mb-2 ml-1">SKU *</Text>
                                        <TextInput
                                            placeholder="JC-GOLD-001"
                                            value={formData.sku}
                                            onChangeText={t => setFormData({ ...formData, sku: t })}
                                            className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-xs uppercase mb-2 ml-1">Price (₹) *</Text>
                                        <TextInput
                                            placeholder="59999"
                                            keyboardType="numeric"
                                            value={formData.price}
                                            onChangeText={t => setFormData({ ...formData, price: t })}
                                            className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-black font-black text-xs uppercase mb-2 ml-1">Category *</Text>
                                    <View className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                                        {categories.map((cat) => (
                                            <TouchableOpacity
                                                key={cat._id}
                                                onPress={() => setFormData({ ...formData, category: cat._id })}
                                                className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${formData.category === cat._id ? 'bg-orange-50' : ''}`}
                                            >
                                                <Text className={`font-bold ${formData.category === cat._id ? 'text-orange-600' : 'text-black'}`}>{cat.name}</Text>
                                                {formData.category === cat._id && <Ionicons name="checkmark-circle" size={20} color="#ea580c" />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-black font-black text-xs uppercase mb-2 ml-1">Metal Specifications</Text>
                                    <View className="flex-row space-x-3">
                                        <View className="flex-1">
                                            <TextInput
                                                placeholder="Metal (GOLD)"
                                                value={formData.metalType}
                                                onChangeText={t => setFormData({ ...formData, metalType: t })}
                                                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <TextInput
                                                placeholder="Purity (22K)"
                                                value={formData.purity}
                                                onChangeText={t => setFormData({ ...formData, purity: t })}
                                                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <TextInput
                                                placeholder="Weight (g)"
                                                keyboardType="numeric"
                                                value={formData.weight}
                                                onChangeText={t => setFormData({ ...formData, weight: t })}
                                                className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900"
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-black font-black text-xs uppercase ml-1">Inventory Management</Text>
                                        <View className="bg-orange-600/10 px-3 py-1 rounded-full">
                                            <Text className="text-orange-600 text-[10px] font-black uppercase tracking-tighter">Stock Adjustment</Text>
                                        </View>
                                    </View>
                                    <View className="bg-gray-900 rounded-[32px] p-6 flex-row items-center justify-between shadow-lg shadow-black/10">
                                        <View>
                                            <Text className="text-white/40 text-[9px] font-black uppercase tracking-[2px] mb-1">Available Units</Text>
                                            <Text className="text-3xl font-black text-white">{formData.initialStock || '0'}</Text>
                                        </View>
                                        <View className="flex-row items-center bg-white/10 p-1.5 rounded-full border border-white/5">
                                            <TouchableOpacity
                                                onPress={() => setFormData({ ...formData, initialStock: Math.max(0, parseInt(formData.initialStock || '0') - 1).toString() })}
                                                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"
                                            >
                                                <Ionicons name="remove" size={24} color="#111827" />
                                            </TouchableOpacity>
                                            <View className="px-6">
                                                <Ionicons name="cube-outline" size={20} color="rgba(255,255,255,0.2)" />
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setFormData({ ...formData, initialStock: (parseInt(formData.initialStock || '0') + 1).toString() })}
                                                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"
                                            >
                                                <Ionicons name="add" size={24} color="#111827" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-black font-black text-xs uppercase mb-2 ml-1">Description</Text>
                                    <TextInput
                                        placeholder="Product details and story..."
                                        multiline
                                        numberOfLines={4}
                                        value={formData.description}
                                        onChangeText={t => setFormData({ ...formData, description: t })}
                                        className="bg-gray-50 border border-gray-100 rounded-2xl p-4 font-medium min-h-[120px]"
                                        textAlignVertical="top"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                    className="bg-orange-600 py-5 rounded-[24px] items-center shadow-xl shadow-orange-600/30"
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-black text-lg uppercase tracking-widest">
                                            {editMode ? 'Update Catalog' : 'Publish Product'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                <View className="h-20" />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

        </View>
    );
}
