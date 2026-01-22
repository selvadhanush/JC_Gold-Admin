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
    Animated,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
import ProductAdminNav from '../../components/ProductAdminNav';
import { InventoryListSkeleton } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    images: string[];
    category: { _id: string; name: string };
    status: string;
}

type FilterType = 'ALL' | 'LOW' | 'OUT';

export default function InventoryManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [newStock, setNewStock] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, activeFilter]);

    const fetchProducts = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/products`, { headers });
            const data = await response.json();
            if (data.success) setProducts(data.data || []);
        } catch (error) {
            console.error('Fetch Failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;
        if (activeFilter === 'LOW') filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
        else if (activeFilter === 'OUT') filtered = filtered.filter(p => p.stock === 0);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
        }
        setFilteredProducts(filtered);
    };

    const handleUpdateStock = async () => {
        if (!newStock || parseInt(newStock) < 0) return Alert.alert('Error', 'Invalid quantity');
        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            await fetch(`${BASE_URL}/api/v1/products/${currentProduct?._id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...currentProduct, stock: parseInt(newStock) }),
            });
            setModalVisible(false);
            fetchProducts();
        } catch (error) {
            Alert.alert('Error', 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <InventoryListSkeleton />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} className="bg-white">
                <View className="px-6 py-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Supply Chain</Text>
                        <Text className="text-3xl font-black text-black">Inventory</Text>
                    </View>
                    <View className="bg-orange-50 px-5 py-3 rounded-[24px] border border-orange-100 items-end">
                        <Text className="text-orange-700 font-black text-xl leading-none">{totalStock}</Text>
                        <Text className="text-orange-600 text-[10px] font-black uppercase tracking-tighter mt-1">Total Units</Text>
                    </View>
                </View>

                {/* Health Overview */}
                <View className="px-6 flex-row gap-x-5 mb-4">
                    <View className="flex-1 bg-red-50 rounded-2xl p-4 border border-red-100">
                        <Text className="text-red-700 text-2xl font-black">{outOfStockCount}</Text>
                        <Text className="text-red-600 text-[10px] font-black uppercase">Out of Stock</Text>
                    </View>
                    <View className="flex-1 bg-orange-50 rounded-2xl p-4 border border-orange-100">
                        <Text className="text-orange-700 text-2xl font-black">{lowStockCount}</Text>
                        <Text className="text-orange-600 text-[10px] font-black uppercase">Low Stock</Text>
                    </View>
                </View>

                {/* Search */}
                <View className="px-6 pb-2">
                    <View className="relative bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 flex-row items-center">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            className="flex-1 ml-3 text-black font-medium"
                            placeholder="Find inventory by name, SKU..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2 mb-4"
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                >
                    {['ALL', 'LOW', 'OUT'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setActiveFilter(f as FilterType)}
                            className={`${activeFilter === f ? 'bg-black' : 'bg-gray-100'} px-6 py-2.5 rounded-full`}
                        >
                            <Text className={`${activeFilter === f ? 'text-white' : 'text-gray-600'} font-black text-xs uppercase tracking-tight`}>
                                {f === 'ALL' ? 'Everything' : f === 'LOW' ? 'Needs Attention' : 'critical'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            >
                {filteredProducts.map((product) => (
                    <View
                        key={product._id}
                        className="bg-white rounded-[32px] border border-gray-100 p-5 mb-5 shadow-sm"
                    >
                        <View className="flex-row items-center">
                            <Image
                                source={{ uri: product.images[0]?.startsWith('http') ? product.images[0] : `${BASE_URL}${product.images[0]}` }}
                                className="w-16 h-16 rounded-[24px] bg-gray-50 shadow-sm"
                            />
                            <View className="flex-1 ml-4">
                                <Text className="text-lg font-black text-gray-900" numberOfLines={1}>{product.name}</Text>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">SKU: {product.sku}</Text>

                                <View className="flex-row items-center mt-3">
                                    <View className="flex-1 h-2 bg-gray-100 rounded-full mr-4 overflow-hidden">
                                        <View
                                            className={`h-full rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                                        />
                                    </View>
                                    <Text className={`font-black text-base ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                        {product.stock}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* More Details Trigger */}
                        <TouchableOpacity
                            onPress={() => setMenuVisible(menuVisible === product._id ? null : product._id)}
                            className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Manage Stock</Text>
                            <Ionicons
                                name={menuVisible === product._id ? "chevron-up" : "chevron-down"}
                                size={18}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>

                        {/* Menu Actions */}
                        {menuVisible === product._id && (
                            <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between">
                                <TouchableOpacity
                                    onPress={() => {
                                        setCurrentProduct(product);
                                        setNewStock(product.stock.toString());
                                        setModalVisible(true);
                                        setMenuVisible(null);
                                    }}
                                    className="flex-1 items-center py-3 bg-black rounded-2xl mr-2 flex-row justify-center"
                                >
                                    <Ionicons name="add-circle-outline" size={18} color="white" />
                                    <Text className="ml-2 font-black text-xs uppercase text-white">Adjust Stock</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        router.replace('/Productadmin/products');
                                        setMenuVisible(null);
                                    }}
                                    className="flex-1 items-center py-3 bg-gray-50 rounded-2xl flex-row justify-center"
                                >
                                    <Ionicons name="cube-outline" size={18} color="black" />
                                    <Text className="ml-2 font-black text-xs uppercase">Catalog</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Premium Stock Adjustment Sheet */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/60 justify-end"
                >
                    <View className="bg-white rounded-t-[40px] p-8 pb-12">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Control Panel</Text>
                                <Text className="text-3xl font-black text-black">Update Stock</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        {currentProduct && (
                            <View className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                                <Text className="text-gray-400 text-[10px] font-black uppercase mb-1">Current Balance</Text>
                                <Text className="text-4xl font-black text-black">{currentProduct.stock} <Text className="text-lg text-gray-400">UNITS</Text></Text>
                                <Text className="text-gray-900 font-bold mt-2" numberOfLines={1}>{currentProduct.name}</Text>
                            </View>
                        )}

                        <Text className="text-black font-black text-xs uppercase mb-3 ml-1">New Quantity</Text>
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-6 mb-8 font-black text-3xl text-black border border-gray-200 text-center"
                            keyboardType="numeric"
                            value={newStock}
                            onChangeText={setNewStock}
                            autoFocus
                        />

                        <TouchableOpacity
                            onPress={handleUpdateStock}
                            disabled={submitting}
                            className="bg-black py-5 rounded-[24px] items-center shadow-2xl"
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg uppercase tracking-widest">Confirm Adjustment</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}
