import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';

const { width } = Dimensions.get('window');

interface WishlistItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: number;
        makingCharges: number;
        images: string[];
        metalType: string;
        weight: number;
        stock: number;
        purity: string;
    };
}

export default function Wishlist() {
    const router = useRouter();
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_WISHLIST, { headers });
            const data = await response.json();
            if (data.success) {
                setWishlist(data.data);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            showToast.error('Failed to load your vault');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_WISHLIST}/${productId}`, {
                method: 'DELETE',
                headers,
            });
            const data = await response.json();
            if (data.success) {
                setWishlist(items => items.filter((item) => item.product._id !== productId));
                showToast.success('Removed from vault');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showToast.error('Could not remove item');
        }
    };

    const moveToCart = async (productId: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId, quantity: 1 }),
            });
            const data = await response.json();
            if (data.success) {
                showToast.success('Moved to cart successfully');
                // Optional: Remove from wishlist after moving to cart
                // removeFromWishlist(productId); 
            } else {
                showToast.error(data.message || 'Could not add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast.error('Network error');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWishlist();
    };

    const renderItem = ({ item }: { item: WishlistItem }) => {
        if (!item.product) return null;

        // Fix for NaN price: ensure values are numbers, default to 0
        const price = Number(item.product.price) || 0;
        const makingCharges = Number(item.product.makingCharges) || 0;
        const totalPrice = price + makingCharges;

        const isOutOfStock = item.product.stock === 0;

        return (
            <TouchableOpacity
                className="bg-white rounded-[32px] mb-6 shadow-sm border border-gray-100 overflow-hidden"
                onPress={() => router.push(`/product_detail?id=${item.product._id}`)}
                activeOpacity={0.9}
            >
                <View className="flex-row p-3">
                    {/* Image Section */}
                    <View className="w-32 h-32 bg-gray-50 rounded-[24px] overflow-hidden mr-4 relative">
                        {item.product.images && item.product.images.length > 0 ? (
                            <Image
                                source={{ uri: item.product.images[0] }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <Ionicons name="image-outline" size={32} color="#d1d5db" />
                            </View>
                        )}
                        {isOutOfStock && (
                            <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                <Text className="text-white text-[10px] font-black uppercase tracking-widest bg-red-500 px-2 py-1 rounded-full">
                                    Sold Out
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Content Section */}
                    <View className="flex-1 justify-between py-1">
                        <View>
                            <View className="flex-row justify-between items-start">
                                <Text className="text-gray-900 font-bold text-[13px] flex-1 mr-2 leading-5" numberOfLines={2}>
                                    {item.product.name}
                                </Text>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        removeFromWishlist(item.product._id);
                                    }}
                                    className="bg-gray-50 p-1.5 rounded-full"
                                >
                                    <Ionicons name="close" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row items-center mt-2 space-x-2">
                                <View className="bg-primary-50 px-2 py-1 rounded-lg">
                                    <Text className="text-primary-700 text-[10px] font-black uppercase tracking-wider">
                                        {item.product.metalType}
                                    </Text>
                                </View>
                                <Text className="text-gray-400 text-[10px] font-bold">
                                    {item.product.weight}g
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-end justify-between mt-2">
                            <View>
                                <Text className="text-primary-600 font-black text-lg">
                                    ₹{totalPrice.toLocaleString()}
                                </Text>
                            </View>

                            <TouchableOpacity
                                className={`px-4 py-2.5 rounded-2xl flex-row items-center space-x-1 ${isOutOfStock ? 'bg-gray-100' : 'bg-gray-900'
                                    }`}
                                onPress={() => moveToCart(item.product._id)}
                                disabled={isOutOfStock}
                            >
                                <Ionicons
                                    name={isOutOfStock ? "ban-outline" : "cart-outline"}
                                    size={16}
                                    color={isOutOfStock ? "#9ca3af" : "white"}
                                />
                                {!isOutOfStock && (
                                    <Text className="text-white font-bold text-[10px] ml-1 uppercase tracking-wide">
                                        Add
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4"
                        >
                            <Ionicons name="arrow-back" size={20} color="#111827" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-black text-gray-900">The Wishlist</Text>
                            <Text className="text-gray-400 text-[10px] uppercase tracking-[2px] font-bold">
                                {wishlist.length} Curated Items
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/cart')}
                        className="w-10 h-10 bg-gray-900 rounded-xl items-center justify-center shadow-lg shadow-gray-400/50"
                    >
                        <Ionicons name="cart-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Wishlist Items */}
            <FlatList
                data={wishlist}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-10">
                        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                            <Ionicons name="heart-dislike-outline" size={48} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-900 font-bold text-xl mb-2 text-center">Your Wishlist is Empty</Text>
                        <Text className="text-gray-500 text-center mb-10 leading-6">
                            Start curating your personal collection of fine jewelry. Save your favorites here.
                        </Text>
                        <TouchableOpacity
                            className="bg-primary-600 w-full py-4 rounded-2xl shadow-xl shadow-primary-500/30 flex-row justify-center items-center"
                            onPress={() => router.push('/products_browse')}
                        >
                            <Text className="text-white font-black uppercase tracking-widest text-xs mr-2">Discover Collection</Text>
                            <Ionicons name="arrow-forward" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
