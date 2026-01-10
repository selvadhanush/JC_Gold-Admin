import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const GRID_PADDING = 16;
const CARD_WIDTH = (width - (GRID_PADDING * 2) - (CARD_MARGIN * 2)) / 2;

interface Product {
    _id: string;
    name: string;
    description: string;
    category: string;
    metalType: string;
    purity: string;
    weight: number;
    price: number;
    makingCharges: number;
    images: string[];
    stock: number;
}

interface Category {
    _id: string;
    name: string;
    icon: string;
}

export default function ProductsBrowse() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMetal, setSelectedMetal] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, selectedMetal, searchQuery]);

    const fetchCategories = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PRODUCT_CATEGORIES, { headers });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();

            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedMetal) params.append('metal', selectedMetal.toUpperCase());
            if (priceRange.min) params.append('minPrice', priceRange.min);
            if (priceRange.max) params.append('maxPrice', priceRange.max);

            const url = `${API_ENDPOINTS.BUYER_PRODUCTS}?${params.toString()}`;
            const response = await fetch(url, { headers });
            const data = await response.json();

            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const addToWishlist = async (productId: string) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(API_ENDPOINTS.BUYER_WISHLIST, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId }),
            });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
        }
    };

    const addToCart = async (productId: string, quantity: number = 1) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(API_ENDPOINTS.BUYER_CART, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId, quantity }),
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={{ width: CARD_WIDTH, margin: CARD_MARGIN }}
            className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
            onPress={() => router.push(`/product_detail?id=${item._id}`)}
            activeOpacity={0.9}
        >
            <View className="relative">
                <View className="w-full h-40 bg-gray-50 items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                        <Image
                            source={{ uri: item.images[0] }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="image-outline" size={40} color="#d1d5db" />
                    )}
                </View>

                <TouchableOpacity
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full items-center justify-center shadow-sm"
                    onPress={() => addToWishlist(item._id)}
                >
                    <Ionicons name="heart-outline" size={18} color="#f97316" />
                </TouchableOpacity>

                {item.stock < 5 && item.stock > 0 && (
                    <View className="absolute top-2 left-2 bg-red-500/90 px-2 py-0.5 rounded-full">
                        <Text className="text-white text-[10px] font-bold">Limited</Text>
                    </View>
                )}
            </View>

            <View className="p-3">
                <Text className="text-gray-900 font-bold text-sm mb-1" numberOfLines={1}>
                    {item.name}
                </Text>

                <View className="flex-row items-center mb-2">
                    <Text className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">
                        {item.metalType} • {item.purity}
                    </Text>
                </View>

                <View className="flex-row items-center justify-between mt-1">
                    <View>
                        <Text className="text-primary-600 font-black text-base">
                            ₹{item.price.toLocaleString()}
                        </Text>
                        <Text className="text-gray-400 text-[9px]">Incl. making</Text>
                    </View>
                    <TouchableOpacity
                        className="bg-primary-600 w-8 h-8 rounded-full items-center justify-center shadow-lg shadow-primary-600/30"
                        onPress={() => addToCart(item._id)}
                    >
                        <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderGridSkeleton = () => (
        <View className="flex-row flex-wrap px-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ width: CARD_WIDTH, margin: CARD_MARGIN }} className="mb-4">
                    <Skeleton width="100%" height={160} style={{ borderRadius: 24 }} />
                    <Skeleton width="80%" height={12} className="mt-3" />
                    <Skeleton width="40%" height={16} className="mt-2" />
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View className="px-6 py-4 bg-white border-b border-gray-50">
                <View className="flex-row items-center justify-between mb-5">
                    <View className="w-10" />
                    <Text className="text-xl font-black text-gray-900 tracking-tight">Browse Jewelry</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/cart')}
                        className="w-10 h-10 items-center justify-center rounded-full bg-primary-50"
                    >
                        <Ionicons name="cart-outline" size={22} color="#f97316" />
                    </TouchableOpacity>
                </View>

                {/* Modern Search Bar */}
                <View className="bg-gray-50 rounded-2xl px-4 py-3.5 flex-row items-center border border-gray-100">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 font-medium"
                        placeholder="Search for gold, silver, rings..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            <View className="flex-1">
                {/* Horizontal Scrollable Filters Container */}
                <View className="py-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                        {/* Category Badges */}
                        <View className="flex-row items-center py-2 gap-2">
                            <TouchableOpacity
                                className={`px-5 py-2.5 rounded-2xl border ${selectedCategory === '' ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-100'}`}
                                onPress={() => setSelectedCategory('')}
                            >
                                <Text className={`font-bold text-sm ${selectedCategory === '' ? 'text-white' : 'text-gray-500'}`}>All</Text>
                            </TouchableOpacity>
                            {categories.length > 0 ? categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat._id}
                                    className={`px-5 py-2.5 rounded-2xl border ${selectedCategory === cat._id ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-100'}`}
                                    onPress={() => setSelectedCategory(cat._id)}
                                >
                                    <Text className={`font-bold text-sm ${selectedCategory === cat._id ? 'text-white' : 'text-gray-500'}`}>{cat.name}</Text>
                                </TouchableOpacity>
                            )) : (
                                [1, 2, 3].map(i => <Skeleton key={i} width={70} height={40} style={{ borderRadius: 16 }} />)
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* Dynamic Product Grid */}
                {loading && !refreshing ? (
                    renderGridSkeleton()
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        contentContainerStyle={{ paddingHorizontal: GRID_PADDING - CARD_MARGIN, paddingBottom: 110 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <View className="bg-gray-50 p-8 rounded-full mb-6">
                                    <Ionicons name="cube-outline" size={80} color="#d1d5db" />
                                </View>
                                <Text className="text-gray-900 font-black text-xl">No Jewelry Found</Text>
                                <Text className="text-gray-400 mt-2 text-center px-10">We couldn't find any products matching your selection.</Text>
                            </View>
                        }
                    />
                )}
            </View>
            <BottomNav activeTab="explore" />
        </SafeAreaView>
    );
}
