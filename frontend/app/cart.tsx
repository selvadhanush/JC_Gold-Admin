import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import { showToast } from '../utils/toast';

const { width } = Dimensions.get('window');

interface CartItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: number;
        images: string[];
        specifications?: {
            metalType?: string;
            weight?: number;
        };
    };
    quantity: number;
    priceAtAdd: number;
}

export default function Cart() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, { headers });
            const data = await response.json();
            if (data.success) {
                setCartItems(data.data.items || []);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        // Optimistic Update
        const previousCartItems = [...cartItems];
        const updatedItems = cartItems.map(item =>
            item._id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_CART}/${itemId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ quantity: newQuantity }),
            });
            const data = await response.json();

            if (!data.success) {
                // Revert on failure
                setCartItems(previousCartItems);
                showToast.error(data.message || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Update Quantity Error:', error);
            setCartItems(previousCartItems);
            showToast.error('Network error. Could not update quantity.');
        }
    };

    const removeItem = async (itemId: string) => {
        Alert.alert('Remove Piece', 'Are you sure you want to remove this piece from your vault?', [
            { text: 'Keep', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const headers = await getAuthHeaders();
                        await fetch(`${API_ENDPOINTS.BUYER_CART}/${itemId}`, { method: 'DELETE', headers });
                        fetchCart();
                    } catch (error) { }
                },
            },
        ]);
    };

    const subtotal = cartItems.reduce((sum, item) => sum + ((item.priceAtAdd || item.product.price) * item.quantity), 0);
    const tax = subtotal * 0.03;
    const total = subtotal + tax;

    const renderItem = ({ item }: { item: CartItem }) => {
        if (!item.product) return null;

        return (
            <View className="bg-white rounded-[32px] mb-6 overflow-hidden border border-gray-100 shadow-sm p-4">
                <View className="flex-row">
                    <View className="w-24 h-24 bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100">
                        {item.product.images && item.product.images.length > 0 ? (
                            <Image source={{ uri: item.product.images[0] }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <Ionicons name="image-outline" size={32} color="#d1d5db" />
                            </View>
                        )}
                    </View>
                    <View className="flex-1 ml-4 justify-between">
                        <View>
                            <View className="flex-row justify-between items-start">
                                <Text className="text-gray-900 font-bold text-sm flex-1 mr-2" numberOfLines={2}>{item.product.name}</Text>
                                <TouchableOpacity onPress={() => removeItem(item._id)}>
                                    <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-gray-400 text-[10px] uppercase font-black tracking-widest mt-1">
                                {item.product.specifications?.metalType || 'JEWELRY'} • {item.product.specifications?.weight || 0}g
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-end">
                            <View className="flex-row items-center bg-gray-50 rounded-2xl px-1 py-1 border border-gray-100">
                                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-8 items-center justify-center">
                                    <Ionicons name="remove" size={16} color="#111827" />
                                </TouchableOpacity>
                                <Text className="mx-3 font-black text-gray-900">{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 items-center justify-center">
                                    <Ionicons name="add" size={16} color="#111827" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-primary-600 font-black text-lg">₹{(item.product.price * item.quantity).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View className="px-6 py-6">
            {[1, 2, 3].map(i => (
                <View key={i} className="bg-white rounded-[32px] mb-6 border border-gray-100 p-4 flex-row">
                    <Skeleton width={96} height={96} style={{ borderRadius: 24 }} />
                    <View className="flex-1 ml-4">
                        <Skeleton width="90%" height={16} className="mb-2" />
                        <Skeleton width="40%" height={10} className="mb-4" />
                        <View className="flex-row justify-between items-center">
                            <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
                            <Skeleton width={100} height={24} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-50">
                <View>
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-1">Your Selection</Text>
                    <Text className="text-2xl font-black text-gray-900">Curated Vault</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/products_browse')} className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                    <Ionicons name="add-outline" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={cartItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 250 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCart()} colors={['#f97316']} />}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <Ionicons name="cart-outline" size={80} color="#d1d5db" />
                            <Text className="text-gray-900 text-xl font-black mt-6">Vault is Empty</Text>
                            <Text className="text-gray-400 text-center mt-2">Start adding exquisite pieces to your collection.</Text>
                        </View>
                    }
                />
            )}

            {cartItems.length > 0 && !loading && (
                <View className="absolute bottom-28 left-6 right-6 bg-gray-900/60 backdrop-blur-3xl rounded-[40px] p-8 shadow-2xl border border-white/10 overflow-hidden">
                    <View className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full" />
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Valuation</Text>
                            <View className="flex-row items-end">
                                <Text className="text-white text-2xl font-black">₹{total.toLocaleString()}</Text>
                                <Text className="text-white/40 text-[9px] font-bold ml-2 mb-1">TTC</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/checkout')}
                            className="bg-white px-8 h-14 rounded-2xl items-center justify-center shadow-lg"
                        >
                            <Text className="text-gray-900 font-black uppercase tracking-widest text-xs">Checkout</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between border-t border-white/10 pt-4">
                        <Text className="text-white/40 text-[9px] font-bold uppercase tracking-tighter">Insured & Hallmarked</Text>
                        <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                    </View>
                </View>
            )}

            <BottomNav activeTab="cart" />
        </SafeAreaView>
    );
}
