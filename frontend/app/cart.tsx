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
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../utils/toast';
import KycRestriction from '../components/KycRestriction';

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
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchCart();
        fetchKycStatus();
    }, []);

    const fetchKycStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const data = await response.json();
            if (data.success) {
                setKycStatus(data.data.status);
            }
        } catch (error) {
            console.error('Error fetching KYC:', error);
        }
    };

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
            <View style={{
                backgroundColor: 'white',
                borderRadius: 28,
                marginBottom: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#F3F4F6',
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3
            }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{
                        width: 100,
                        height: 100,
                        backgroundColor: '#F9FAFB',
                        borderRadius: 20,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#F3F4F6'
                    }}>
                        {item.product.images && item.product.images.length > 0 ? (
                            <Image source={{ uri: item.product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="image-outline" size={32} color="#d1d5db" />
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{ color: '#111827', fontWeight: '800', fontSize: 15, flex: 1, marginRight: 8, lineHeight: 20 }} numberOfLines={2}>{item.product.name}</Text>
                                <TouchableOpacity onPress={() => removeItem(item._id)} style={{ padding: 4 }}>
                                    <Ionicons name="close-circle" size={22} color="#FCA5A5" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5, marginTop: 4 }}>
                                {item.product.specifications?.metalType || 'JEWELRY'} • {item.product.specifications?.weight || 0}g
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 2 }}>
                                <TouchableOpacity
                                    onPress={() => updateQuantity(item._id, item.quantity - 1)}
                                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
                                >
                                    <Ionicons name="remove" size={14} color="#111827" />
                                </TouchableOpacity>
                                <Text style={{ marginHorizontal: 14, fontWeight: '800', color: '#111827', fontSize: 14 }}>{item.quantity}</Text>
                                <TouchableOpacity
                                    onPress={() => updateQuantity(item._id, item.quantity + 1)}
                                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
                                >
                                    <Ionicons name="add" size={14} color="#111827" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: '#ea580c', fontWeight: '900', fontSize: 18 }}>₹{(item.product.price * item.quantity).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderSkeleton = () => (
        <View style={{ padding: 24 }}>
            {[1, 2, 3].map(i => (
                <View key={i} style={{ backgroundColor: 'white', borderRadius: 32, marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6', padding: 16, flexDirection: 'row' }}>
                    <Skeleton width={96} height={96} style={{ borderRadius: 24 }} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="40%" height={10} style={{ marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Skeleton width={80} height={32} style={{ borderRadius: 16 }} />
                            <Skeleton width={100} height={24} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Your Selection</Text>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>Curated Vault</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/products_browse')} style={{ width: 44, height: 44, backgroundColor: '#fff7ed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffedd5' }}>
                    <Ionicons name="add" size={24} color="#ea580c" />
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
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 }}>
                            <Ionicons name="cart-outline" size={80} color="#d1d5db" />
                            <Text style={{ color: '#111827', fontSize: 20, fontWeight: '900', marginTop: 24 }}>Vault is Empty</Text>
                            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>Start adding exquisite pieces to your collection.</Text>
                        </View>
                    }
                />
            )}

            {cartItems.length > 0 && !loading && (
                <View style={{
                    position: 'absolute',
                    bottom: 100,
                    left: 20,
                    right: 20,
                    backgroundColor: '#111827',
                    borderRadius: 32,
                    padding: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                    overflow: 'hidden'
                }}>
                    <View style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, backgroundColor: 'rgba(234, 88, 12, 0.1)', borderRadius: 9999 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total Valuation</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>₹{total.toLocaleString()}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginLeft: 6 }}>TTC</Text>
                            </View>
                        </View>
                        {kycStatus === 'APPROVED' ? (
                            <TouchableOpacity
                                onPress={() => router.push('/checkout')}
                                style={{
                                    backgroundColor: 'white',
                                    paddingHorizontal: 24,
                                    height: 52,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 120
                                }}
                            >
                                <Text style={{ color: '#111827', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Checkout</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}
                    </View>

                    {kycStatus !== 'APPROVED' && (
                        <View className="mb-4">
                            <KycRestriction
                                title="KYC Verification Required"
                                message="Full verification is mandatory for all high-value jewellery transactions."
                                buttonTitle="Verify & Unlock Checkout"
                            />
                        </View>
                    )}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        paddingTop: 16
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Insured & Hallmarked</Text>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' }}>Secure Checkout</Text>
                    </View>
                </View>
            )}

            <BottomNav activeTab="cart" />
        </SafeAreaView>
    );
}
