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
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
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
    const [metalDropdownOpen, setMetalDropdownOpen] = useState(false);


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
                <ProductListSkeleton />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Refined App Bar */}
            <SafeAreaView edges={['top']} className="bg-white border-b border-gray-50">
                <View className="px-6 py-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Catalog Control</Text>
                        <Text className="text-2xl font-bold text-gray-900">Products</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleOpenCreate}
                        className="bg-gray-900 w-11 h-11 rounded-xl items-center justify-center shadow-lg shadow-gray-900/20"
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Professional Search Bar */}
                <View className="px-6 pb-2">
                    <View className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 flex-row items-center">
                        <Ionicons name="search-outline" size={18} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                            placeholder="Find products by name or SKU"
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Refined Filter Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                >
                    {[
                        { id: 'ALL', label: 'All Products' },
                        { id: 'ACTIVE', label: 'Active' },
                        { id: 'DRAFT', label: 'Drafts' },
                        { id: 'OUT_OF_STOCK', label: 'Out of Stock' }
                    ].map((f) => (
                        <TouchableOpacity
                            key={f.id}
                            onPress={() => setActiveFilter(f.id as FilterType)}
                            className={`px-5 py-2 rounded-full border ${activeFilter === f.id ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-semibold text-[11px] ${activeFilter === f.id ? 'text-white' : 'text-gray-500'}`}>
                                {f.label}
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
                                        onPress={() => setMenuVisible(null)}
                                        className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                    >
                                        <Ionicons name="layers-outline" size={18} color="#9ca3af" />
                                        <Text className="ml-2 font-black text-xs uppercase text-gray-400">Stock</Text>
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
                            {/* ========== SECTION 1: PRODUCT MEDIA ========== */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-orange-50 w-8 h-8 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="images" size={16} color="#ea580c" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">Product Media</Text>
                                        <Text className="text-gray-400 text-[10px] font-medium">Upload up to 5 images</Text>
                                    </View>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <TouchableOpacity
                                        onPress={handlePickImage}
                                        className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[28px] items-center justify-center mr-4"
                                    >
                                        <View className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm mb-2">
                                            <Ionicons name="camera" size={22} color="#ea580c" />
                                        </View>
                                        <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Add Photo</Text>
                                    </TouchableOpacity>
                                    {selectedImages.map((uri, idx) => (
                                        <View key={idx} className="relative mr-4">
                                            <Image
                                                source={{ uri: uri.startsWith('/') ? `${BASE_URL}${uri}` : uri }}
                                                className="w-28 h-28 rounded-[28px] bg-gray-50 border-2 border-gray-100"
                                            />
                                            <TouchableOpacity
                                                onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                                className="absolute -top-1.5 -right-1.5 bg-black/90 w-8 h-8 rounded-full items-center justify-center shadow-xl border border-white/20"
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="close" size={18} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Divider */}
                            <View className="h-[1px] bg-gray-100 mb-8" />

                            {/* ========== SECTION 2: BASIC INFORMATION ========== */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-5">
                                    <View className="bg-indigo-50 w-8 h-8 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="information-circle" size={16} color="#4f46e5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">Basic Information</Text>
                                        <Text className="text-gray-400 text-[10px] font-medium">Product identity & pricing</Text>
                                    </View>
                                </View>

                                {/* Product Name */}
                                <View className="mb-5">
                                    <Text className="text-gray-700 font-bold text-xs uppercase mb-2 ml-1 tracking-wide">Product Name *</Text>
                                    <TextInput
                                        placeholder="e.g., 22K Gold Necklace"
                                        placeholderTextColor="#9ca3af"
                                        value={formData.name}
                                        onChangeText={t => setFormData({ ...formData, name: t })}
                                        className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-semibold text-base text-black"
                                    />
                                </View>

                                {/* SKU & Price Row */}
                                <View className="flex-row mb-5" style={{ gap: 12 }}>
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-bold text-xs uppercase mb-2 ml-1 tracking-wide">SKU Code *</Text>
                                        <TextInput
                                            placeholder="JC-GOLD-001"
                                            placeholderTextColor="#9ca3af"
                                            value={formData.sku}
                                            onChangeText={t => setFormData({ ...formData, sku: t })}
                                            className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-semibold text-base text-black"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-bold text-xs uppercase mb-2 ml-1 tracking-wide">Price (₹) *</Text>
                                        <TextInput
                                            placeholder="59,999"
                                            placeholderTextColor="#9ca3af"
                                            keyboardType="numeric"
                                            value={formData.price}
                                            onChangeText={t => setFormData({ ...formData, price: t })}
                                            className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-semibold text-base text-black"
                                        />
                                    </View>
                                </View>

                                {/* Category */}
                                <View>
                                    <Text className="text-gray-700 font-bold text-xs uppercase mb-3 ml-1 tracking-wide">Product Category *</Text>
                                    <View className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
                                        {categories.map((cat, index) => (
                                            <TouchableOpacity
                                                key={cat._id}
                                                onPress={() => setFormData({ ...formData, category: cat._id })}
                                                className={`px-5 py-4 flex-row justify-between items-center ${index !== categories.length - 1 ? 'border-b border-gray-50' : ''
                                                    } ${formData.category === cat._id ? 'bg-orange-50' : 'bg-white'}`}
                                            >
                                                <Text className={`font-bold text-base ${formData.category === cat._id ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    {cat.name}
                                                </Text>
                                                {formData.category === cat._id && (
                                                    <View className="bg-orange-600 w-6 h-6 rounded-full items-center justify-center">
                                                        <Ionicons name="checkmark" size={16} color="white" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Divider */}
                            <View className="h-[1px] bg-gray-100 mb-8" />

                            {/* ========== SECTION 3: METAL SPECIFICATIONS ========== */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-5">
                                    <View className="bg-yellow-50 w-8 h-8 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="diamond" size={16} color="#eab308" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">Metal Specifications</Text>
                                        <Text className="text-gray-400 text-[10px] font-medium">Purity, weight & metal type</Text>
                                    </View>
                                </View>

                                {/* Metal Type Dropdown */}
                                <View className="mb-4">
                                    <Text className="text-gray-700 font-bold text-xs uppercase mb-3 ml-1 tracking-wide">Metal Type *</Text>

                                    {/* Selected Value Display / Dropdown Trigger */}
                                    <TouchableOpacity
                                        onPress={() => setMetalDropdownOpen(!metalDropdownOpen)}
                                        className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 flex-row justify-between items-center"
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row items-center">
                                            <View className={`w-3 h-3 rounded-full mr-3 ${formData.metalType === 'GOLD' ? 'bg-yellow-500' :
                                                formData.metalType === 'SILVER' ? 'bg-gray-300' :
                                                    formData.metalType === 'PLATINUM' ? 'bg-gray-400' :
                                                        'bg-gray-200'
                                                }`} />
                                            <Text className="font-bold text-base text-gray-900">
                                                {formData.metalType ? formData.metalType.charAt(0) + formData.metalType.slice(1).toLowerCase() : 'Gold'}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={metalDropdownOpen ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color="#6b7280"
                                        />
                                    </TouchableOpacity>

                                    {/* Dropdown Options (only shown when open) */}
                                    {metalDropdownOpen && (
                                        <View className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden mt-2">
                                            {['GOLD', 'SILVER', 'PLATINUM', 'OTHERS'].map((metal, index) => (
                                                <TouchableOpacity
                                                    key={metal}
                                                    onPress={() => {
                                                        setFormData({ ...formData, metalType: metal });
                                                        setMetalDropdownOpen(false);
                                                    }}
                                                    className={`px-5 py-4 flex-row justify-between items-center ${index !== 3 ? 'border-b border-gray-50' : ''
                                                        } ${formData.metalType === metal ? 'bg-yellow-50' : 'bg-white'}`}
                                                >
                                                    <View className="flex-row items-center">
                                                        <View className={`w-3 h-3 rounded-full mr-3 ${metal === 'GOLD' ? 'bg-yellow-500' :
                                                            metal === 'SILVER' ? 'bg-gray-300' :
                                                                metal === 'PLATINUM' ? 'bg-gray-400' :
                                                                    'bg-gray-200'
                                                            }`} />
                                                        <Text className={`font-bold text-base ${formData.metalType === metal ? 'text-yellow-700' : 'text-gray-900'}`}>
                                                            {metal.charAt(0) + metal.slice(1).toLowerCase()}
                                                        </Text>
                                                    </View>
                                                    {formData.metalType === metal && (
                                                        <Ionicons name="checkmark-circle" size={20} color="#eab308" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Purity & Weight Row */}
                                <View className="flex-row mb-5" style={{ gap: 12 }}>
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-bold text-xs uppercase mb-2 ml-1 tracking-wide">Purity *</Text>
                                        <TextInput
                                            placeholder="e.g., 22K or 916"
                                            placeholderTextColor="#9ca3af"
                                            value={formData.purity}
                                            onChangeText={t => setFormData({ ...formData, purity: t })}
                                            className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-semibold text-base text-black"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-bold text-xs uppercase mb-2 ml-1 tracking-wide">Weight (g) *</Text>
                                        <TextInput
                                            placeholder="10.5"
                                            placeholderTextColor="#9ca3af"
                                            keyboardType="numeric"
                                            value={formData.weight}
                                            onChangeText={t => setFormData({ ...formData, weight: t })}
                                            className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-semibold text-base text-black"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Divider */}
                            <View className="h-[1px] bg-gray-100 mb-8" />

                            {/* ========== SECTION 4: INVENTORY CONTROL ========== */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-5">
                                    <View className="bg-green-50 w-8 h-8 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="cube" size={16} color="#16a34a" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">Inventory Control</Text>
                                        <Text className="text-gray-400 text-[10px] font-medium">Set initial stock quantity</Text>
                                    </View>
                                </View>

                                <View className="bg-white border-2 border-gray-100 rounded-[28px] p-6">
                                    {/* Stock Display */}
                                    <View className="items-center mb-6">
                                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-3">Available Units</Text>
                                        <View className="bg-gray-50 rounded-3xl px-8 py-4 border-2 border-gray-100">
                                            <Text className="text-6xl font-black text-gray-900 text-center">{formData.initialStock || '0'}</Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs font-medium mt-3">Units in Stock</Text>
                                    </View>

                                    {/* Counter Controls */}
                                    <View className="flex-row items-center justify-center" style={{ gap: 16 }}>
                                        <TouchableOpacity
                                            onPress={() => setFormData({ ...formData, initialStock: Math.max(0, parseInt(formData.initialStock || '0') - 1).toString() })}
                                            className="bg-red-500 w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-red-500/30"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="remove" size={32} color="white" />
                                        </TouchableOpacity>

                                        <View className="bg-gray-100 px-6 py-3 rounded-2xl">
                                            <Ionicons name="cube" size={28} color="#6b7280" />
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => setFormData({ ...formData, initialStock: (parseInt(formData.initialStock || '0') + 1).toString() })}
                                            className="bg-green-500 w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-green-500/30"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="add" size={32} color="white" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Quick Add Buttons */}
                                    <View className="mt-6 pt-6 border-t border-gray-100">
                                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-3 text-center">Quick Add</Text>
                                        <View className="flex-row justify-center" style={{ gap: 8 }}>
                                            {[10, 25, 50, 100].map((amount) => (
                                                <TouchableOpacity
                                                    key={amount}
                                                    onPress={() => setFormData({ ...formData, initialStock: (parseInt(formData.initialStock || '0') + amount).toString() })}
                                                    className="bg-gray-100 px-4 py-2.5 rounded-xl"
                                                    activeOpacity={0.7}
                                                >
                                                    <Text className="text-gray-700 font-black text-sm">+{amount}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {/* Reset Button */}
                                        <TouchableOpacity
                                            onPress={() => setFormData({ ...formData, initialStock: '0' })}
                                            className="mt-4 bg-red-50 border-2 border-red-100 py-3 rounded-2xl flex-row items-center justify-center"
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                                            <Text className="text-red-600 font-black text-xs uppercase tracking-wide">Reset to Zero</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Divider */}
                            <View className="h-[1px] bg-gray-100 mb-8" />

                            {/* ========== SECTION 5: PRODUCT DESCRIPTION ========== */}
                            <View className="mb-8">
                                <View className="flex-row items-center mb-5">
                                    <View className="bg-purple-50 w-8 h-8 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="document-text" size={16} color="#9333ea" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-sm uppercase tracking-tight">Product Description</Text>
                                        <Text className="text-gray-400 text-[10px] font-medium">Tell the product story</Text>
                                    </View>
                                </View>

                                <TextInput
                                    placeholder="Describe the product features, craftsmanship, and unique selling points..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    numberOfLines={5}
                                    value={formData.description}
                                    onChangeText={t => setFormData({ ...formData, description: t })}
                                    className="bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 font-medium text-base text-gray-900 min-h-[140px]"
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={submitting}
                                className="bg-orange-600 py-6 rounded-[28px] items-center shadow-2xl shadow-orange-600/40 mb-6"
                                style={{ elevation: 8 }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name={editMode ? "checkmark-circle" : "rocket"} size={24} color="white" style={{ marginRight: 12 }} />
                                        <Text className="text-white font-black text-base uppercase tracking-widest">
                                            {editMode ? 'Update Product' : 'Publish Product'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View className="h-24" />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

        </View>
    );
}
