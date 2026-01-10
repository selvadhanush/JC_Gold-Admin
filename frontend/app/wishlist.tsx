import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

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
                setWishlist(wishlist.filter((item) => item.product._id !== productId));
                Alert.alert('Removed', 'Product removed from wishlist');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
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
                Alert.alert('Success', 'Product added to cart', [
                    {
                        text: 'Remove from Wishlist',
                        onPress: () => removeFromWishlist(productId),
                    },
                    { text: 'Keep in Wishlist', style: 'cancel' },
                ]);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWishlist();
    };

    const renderItem = ({ item }: { item: WishlistItem }) => {
        if (!item.product) return null;
        const totalPrice = item.product.price + item.product.makingCharges;

        return (
            <View className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100">
                <TouchableOpacity
                    className="flex-row"
                    onPress={() => router.push(`/product_detail?id=${item.product._id}`)}
                    activeOpacity={0.7}
                >
                    <View className="w-28 h-28 bg-gray-100 items-center justify-center">
                        {item.product.images && item.product.images.length > 0 ? (
                            <Image
                                source={{ uri: item.product.images[0] }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="image-outline" size={32} color="#d1d5db" />
                        )}
                    </View>

                    <View className="flex-1 p-4">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-900 font-bold text-base flex-1 mr-2" numberOfLines={2}>
                                {item.product.name}
                            </Text>
                            <TouchableOpacity onPress={() => removeFromWishlist(item.product._id)}>
                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center mb-2">
                            <View className="bg-primary-50 px-2 py-1 rounded-md mr-2">
                                <Text className="text-primary-600 text-xs font-semibold">
                                    {item.product.metalType}
                                </Text>
                            </View>
                            <Text className="text-gray-500 text-xs">{item.product.weight}g</Text>
                        </View>

                        <View className="flex-row items-center justify-between mt-2">
                            <View>
                                <Text className="text-primary-600 font-bold text-lg">
                                    ₹{totalPrice.toLocaleString()}
                                </Text>
                                {item.product.stock === 0 && (
                                    <Text className="text-red-500 text-xs font-semibold mt-1">Out of Stock</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                className={`px-4 py-2 rounded-xl flex-row items-center ${item.product.stock > 0 ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}
                                onPress={() => moveToCart(item.product._id)}
                                disabled={item.product.stock === 0}
                            >
                                <Ionicons name="cart-outline" size={16} color="white" />
                                <Text className="text-white font-bold text-sm ml-1">Add to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
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
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-bold text-gray-900">Jewelry Vault</Text>
                            <Text className="text-gray-500 text-sm">{wishlist.length} Items Secured</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/cart')}>
                        <Ionicons name="cart-outline" size={24} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Wishlist Items */}
            <FlatList
                data={wishlist}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="shield-checkmark-outline" size={64} color="#d1d5db" />
                        <Text className="text-gray-400 text-base mt-4 mb-6">Your vault is currently empty</Text>
                        <TouchableOpacity
                            className="bg-primary-500 px-6 py-3 rounded-xl"
                            onPress={() => router.push('/products_browse')}
                        >
                            <Text className="text-white font-bold">Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
