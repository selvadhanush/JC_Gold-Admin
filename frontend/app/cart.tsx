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
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

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

    const removeItem = (itemId: string) => {
        setItemToRemove(itemId);
        setShowConfirmModal(true);
    };

    const confirmRemove = async () => {
        if (!itemToRemove) return;

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_CART}/${itemToRemove}`, { method: 'DELETE', headers });
            const data = await response.json();
            if (data.success) {
                showToast.success('Piece removed from your vault');
                fetchCart();
            } else {
                showToast.error(data.message || 'Failed to remove item');
            }
        } catch (error) {
            showToast.error('Network error. Failed to remove item.');
        } finally {
            setShowConfirmModal(false);
            setItemToRemove(null);
        }
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
                marginBottom: 24,
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
                    bottom: insets.bottom + 100,
                    left: 20,
                    right: 20,
                    backgroundColor: '#111827',
                    borderRadius: 30,
                    paddingVertical: 20,
                    paddingHorizontal: 22,
                    borderWidth: 1.5,
                    borderColor: 'rgba(234, 88, 12, 0.5)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 16 },
                    shadowOpacity: 0.5,
                    shadowRadius: 24,
                    elevation: 15,
                    overflow: 'hidden'
                }}>
                    <View style={{ position: 'absolute', top: -110, right: -110, width: 260, height: 260, backgroundColor: 'rgba(234, 88, 12, 0.18)', borderRadius: 9999 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Total Valuation</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>₹{total.toLocaleString()}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', marginLeft: 4 }}>TTC</Text>
                            </View>
                        </View>
                        {kycStatus === 'APPROVED' ? (
                            <TouchableOpacity
                                onPress={() => router.push('/checkout')}
                                style={{
                                    backgroundColor: 'white',
                                    paddingHorizontal: 20,
                                    height: 46,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 110
                                }}
                            >
                                <Text style={{ color: '#111827', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 }}>Checkout</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}
                    </View>

                    {/* KYC Restriction - Made more compact */}
                    {kycStatus !== 'APPROVED' && (
                        <View className="mb-3">
                            <KycRestriction
                                title="KYC Required"
                                message="Mandatory for high-value transactions."
                                buttonTitle="Verify Now"
                            />
                        </View>
                    )}

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        paddingTop: 12
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 }}>Insured & Hallmarked</Text>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600' }}>Secure Checkout</Text>
                    </View>
                </View>
            )}

            <BottomNav activeTab="cart" />

            {/* Premium Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ flex: 1 }}
                        onPress={() => setShowConfirmModal(false)}
                    />
                    <View style={{
                        backgroundColor: 'white',
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                        padding: 24,
                        paddingBottom: insets.bottom + 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        elevation: 20
                    }}>
                        <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Ionicons name="trash-outline" size={32} color="#EF4444" />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8, textAlign: 'center' }}>Remove from Vault?</Text>
                            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>Are you sure you want to remove this exquisite piece from your curated collection?</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#4B5563', fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Keep Piece</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmRemove}
                                style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
                            >
                                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
