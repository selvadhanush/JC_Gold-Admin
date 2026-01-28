import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';

const { width } = Dimensions.get('window');

export default function BuyerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [resolvedTickets, setResolvedTickets] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [goldRate, setGoldRate] = useState<number>(7250);
    const [wallet, setWallet] = useState<any>({ goldBalance: 0 });
    const [dashboardRates, setDashboardRates] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<string[]>([]);
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [mpinSet, setMpinSet] = useState<boolean>(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const maintenanceStatus = useMaintenanceStatus('buyer');

    const showToast = (message: string) => {
        setToastMessage(message);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    const initData = useCallback(async () => {
        try {
            await Promise.all([
                loadStoredUser(),
                fetchProfile(),
                fetchProducts(),
                fetchCategories(),
                fetchWishlist(),
                fetchResolvedTickets(),
                fetchGoldRate(),
                fetchWallet(),
                fetchDashboardRates(),
                fetchCart(),
                fetchKycStatus(),
                fetchMpinStatus()
            ]);
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchDashboardRates = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_DASHBOARD_RATES, { headers });
            const data = await response.json();
            if (data.success) {
                setDashboardRates(data.data);
            }
        } catch (error) { }
    };

    // Helper to get rate for display
    const getRate = (metal: string, purity: string) => {
        const rateObj = dashboardRates.find(r => r.metalType === metal && r.purity === purity);
        return {
            price: rateObj?.rate ? rateObj.rate.toLocaleString() : '---',
            change: rateObj?.change || 0,
            hasHistory: rateObj?.hasHistory || false
        };
    };

    useFocusEffect(
        useCallback(() => {
            fetchCart();
            fetchWishlist();
        }, [])
    );

    useEffect(() => {
        initData();
    }, [initData]);

    const onRefresh = () => {
        setRefreshing(true);
        initData();
    };

    const loadStoredUser = async () => {
        try {
            const stored = await SecureStore.getItemAsync('userData');
            if (stored) setUser(JSON.parse(stored));
        } catch (error) { }
    };

    const fetchProfile = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PROFILE, { headers });
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
                await SecureStore.setItemAsync('userData', JSON.stringify(data.data));
            }
        } catch (error) { }
    };

    const fetchWishlist = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_WISHLIST, { headers });
            const data = await response.json();
            if (data.success) {
                setWishlist(data.data);
                const ids = data.data.map((item: any) => item.product._id);
                setWishlistItems(ids);
            }
        } catch (error) { }
    };

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PRODUCTS}`, { headers });
            const data = await response.json();
            if (data.success) setProducts(data.data);
        } catch (error) { } finally {
            setProductsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_PRODUCT_CATEGORIES, { headers });
            const data = await response.json();
            if (data.success) setCategories(data.data);
        } catch (error) { }
    };

    const fetchResolvedTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_SUPPORT, { headers });
            const data = await response.json();
            if (data.success) {
                const resolved = data.data.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED');

                // Get previously seen tickets
                const seenStore = await SecureStore.getItemAsync('seen_resolved_tickets');
                const seenIds: string[] = seenStore ? JSON.parse(seenStore) : [];

                // Filter out tickets that have been seen
                const newResolved = resolved.filter((t: any) => !seenIds.includes(t._id));

                setResolvedTickets(newResolved);

                // If we have new tickets to show, mark them as seen for the NEXT time
                if (newResolved.length > 0) {
                    const newIds = newResolved.map((t: any) => t._id);
                    const updatedSeen = [...seenIds, ...newIds];
                    // Use a Set to avoid duplicates just in case, though the logic above avoids it
                    const uniqueSeen = Array.from(new Set(updatedSeen));
                    await SecureStore.setItemAsync('seen_resolved_tickets', JSON.stringify(uniqueSeen));
                }
            }
        } catch (error) { }
    };

    const fetchGoldRate = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, { headers });
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                const active = data.data.find((r: any) => r.isActive && r.metalType === 'GOLD');
                if (active) setGoldRate(active.ratePerGram);
            }
        } catch (error) { }
    };

    const fetchWallet = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_DIGITAL_GOLD_WALLET, { headers });
            const data = await response.json();
            if (data.success) setWallet(data.data.wallet);
        } catch (error) { }
    };

    const addToWishlist = async (productId: string) => {
        try {
            if (wishlistItems.includes(productId)) {
                showToast('Already in wishlist');
                return;
            }
            const headers = await getAuthHeaders();
            await fetch(API_ENDPOINTS.BUYER_WISHLIST, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId }),
            });
            setWishlistItems([...wishlistItems, productId]);
            showToast('Added to wishlist 💖');
        } catch (error) { }
    };

    const fetchCart = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, { headers });
            const data = await response.json();
            if (data.success && data.data && data.data.items) {
                const ids = data.data.items
                    .filter((item: any) => item.product)
                    .map((item: any) => item.product._id);
                setCartItems(ids);
            }
        } catch (error) { console.error('Fetch Cart Error:', error); }
    };

    const fetchKycStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const data = await response.json();
            if (data.success) {
                setKycStatus(data.data.status);
            }
        } catch (error) {
            console.error('Fetch KYC Status Error:', error);
        }
    };

    const fetchMpinStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_MPIN_STATUS, { headers });
            const data = await response.json();
            if (data.success) {
                setMpinSet(data.data.isSet);
            }
        } catch (error) {
            console.error('Fetch MPIN Status Error:', error);
        }
    };

    const addToCart = async (productId: string) => {
        try {
            if (cartItems.includes(productId)) {
                showToast('Already in cart');
                return;
            }
            const headers = await getAuthHeaders();
            await fetch(API_ENDPOINTS.BUYER_CART, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId, quantity: 1 }),
            });
            setCartItems([...cartItems, productId]);
            showToast('Added to cart successfully ✨');
        } catch (error) { }
    };

    const renderSkeleton = () => (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                <View>
                    <Skeleton width={80} height={10} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={24} />
                </View>
                <Skeleton width={48} height={48} style={{ borderRadius: 16 }} />
            </View>
            <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
                <Skeleton width="100%" height={200} style={{ borderRadius: 32, marginTop: 16 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ alignItems: 'center' }}>
                            <Skeleton width={56} height={56} style={{ borderRadius: 16 }} />
                            <Skeleton width={40} height={8} style={{ marginTop: 8 }} />
                        </View>
                    ))}
                </View>
                <View style={{ marginTop: 40 }}>
                    <Skeleton width={100} height={20} style={{ marginBottom: 24 }} />
                    <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} width={80} height={80} style={{ borderRadius: 28, marginRight: 20 }} />
                        ))}
                    </View>
                </View>
                <View style={{ marginTop: 40 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Skeleton width={120} height={25} />
                        <Skeleton width={60} height={20} />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 24 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={{ width: '48%', marginBottom: 16 }}>
                                <Skeleton width="100%" height={160} style={{ borderRadius: 24 }} />
                                <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
                                <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );

    if (loading && !refreshing) return renderSkeleton();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Toast Notification */}
            {toastVisible && (
                <View style={{ position: 'absolute', top: 60, left: 24, right: 24, zIndex: 100, alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
                        <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{toastMessage}</Text>
                    </View>
                </View>
            )}

            {/* Custom Premium Sticky Header */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                <View>
                    <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, color: '#9CA3AF', marginBottom: 4 }}>JC GOLD & JEWELS</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Welcome, {user?.name?.split(' ')[0] || 'Guest'}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}
                >
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Ionicons name="person-outline" size={24} color="#f97316" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
            >
                <View style={{ paddingHorizontal: 24, paddingBottom: 208 }}>

                    {/* Maintenance Mode Scheduled Banner */}
                    {maintenanceStatus.isScheduled && !maintenanceStatus.isActive && (
                        <View
                            style={{
                                backgroundColor: '#FFFBEB',
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 32,
                                borderWidth: 1,
                                borderColor: '#FEF3C7',
                                flexDirection: 'row',
                                alignItems: 'center',
                                shadowColor: '#F59E0B',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                                elevation: 3
                            }}
                        >
                            <View style={{ width: 48, height: 48, backgroundColor: '#FEF3C7', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <Ionicons name="construct-outline" size={24} color="#D97706" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#92400E', fontWeight: '900', fontSize: 13, marginBottom: 2 }}>Maintenance Scheduled</Text>
                                <Text style={{ color: '#B45309', fontSize: 11, fontWeight: '600' }}>
                                    System will be offline in {Math.floor(maintenanceStatus.remainingSeconds / 60)} minutes.
                                </Text>
                            </View>
                            <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Alert</Text>
                            </View>
                        </View>
                    )}

                    {/* KYC Verification Reminder Banner */}
                    {kycStatus !== 'APPROVED' && (
                        <TouchableOpacity
                            onPress={() => router.push('/kyc_verification')}
                            activeOpacity={0.9}
                            style={{
                                backgroundColor: '#FEF2F2',
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 32,
                                borderWidth: 1,
                                borderColor: '#FEE2E2',
                                flexDirection: 'row',
                                alignItems: 'center',
                                shadowColor: '#EF4444',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2
                            }}
                        >
                            <View style={{ width: 48, height: 48, backgroundColor: '#FEE2E2', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <Ionicons name="shield-half-outline" size={24} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#1F2937', fontWeight: '900', fontSize: 13, marginBottom: 2 }}>KYC Verification Required</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="time-outline" size={10} color="#6B7280" />
                                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>Takes 2-3 business days</Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Verify</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* MPIN Security Requirement Banner */}
                    {!mpinSet && (
                        <TouchableOpacity
                            onPress={() => router.push('/mpin_setup')}
                            activeOpacity={0.9}
                            style={{
                                backgroundColor: '#111827',
                                borderRadius: 24,
                                padding: 20,
                                marginBottom: 32,
                                flexDirection: 'row',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.2,
                                shadowRadius: 20,
                                elevation: 10
                            }}
                        >
                            <View style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <Ionicons name="shield-half" size={24} color="#f97316" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, marginBottom: 2 }}>Secure Your Account</Text>
                                <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '500' }}>Setup a 6-digit MPIN for high-value access.</Text>
                            </View>
                            <View style={{ backgroundColor: '#f97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Setup</Text>
                            </View>
                        </TouchableOpacity>
                    )}


                    {/* Premium Jewelry Cards Section */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
                        {[
                            {
                                goldTitle: 'Gold 24K',
                                goldRate: getRate('GOLD', '24K'),
                                silverTitle: 'Fine Silver',
                                silverRate: getRate('SILVER', 'FINE'),
                                bgColor: '#ea580c',
                                icon: 'diamond-outline'
                            },
                            {
                                goldTitle: 'Gold 22K',
                                goldRate: getRate('GOLD', '22K'),
                                silverTitle: 'Sterling Silver',
                                silverRate: getRate('SILVER', 'STERLING'),
                                bgColor: '#ea580c',
                                icon: 'sparkles-outline'
                            },
                            {
                                goldTitle: 'Gold 18K',
                                goldRate: getRate('GOLD', '18K'),
                                silverTitle: 'Britannia Silver',
                                silverRate: getRate('SILVER', 'BRITANNIA'),
                                bgColor: '#ea580c',
                                icon: 'flower-outline'
                            }
                        ].map((card, idx) => (
                            <View key={idx} style={{ marginRight: 16, width: 300 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={{ backgroundColor: card.bgColor, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}
                                >
                                    <View style={{ padding: 24, paddingBottom: 32 }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999, marginBottom: 16 }}>
                                            <Text style={{ color: 'white', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>Premium Rate</Text>
                                        </View>

                                        <View style={{ marginBottom: 24 }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{card.goldTitle}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', lineHeight: 32 }}>₹{card.goldRate.price}</Text>
                                                {card.goldRate.hasHistory && card.goldRate.change !== 0 && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: card.goldRate.change > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
                                                        <Ionicons
                                                            name={card.goldRate.change > 0 ? "caret-up" : "caret-down"}
                                                            size={12}
                                                            color={card.goldRate.change > 0 ? "#22c55e" : "#ef4444"}
                                                        />
                                                        <Text style={{ fontSize: 12, fontWeight: '900', marginLeft: 4, color: card.goldRate.change > 0 ? '#4ade80' : '#f87171' }}>
                                                            {card.goldRate.change > 0 ? '+' : ''}{card.goldRate.change}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 4 }}>Per Gram</Text>
                                        </View>

                                        <View style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingTop: 16 }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{card.silverTitle}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', lineHeight: 32 }}>₹{card.silverRate.price}</Text>
                                                {card.silverRate.hasHistory && card.silverRate.change !== 0 && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: card.silverRate.change > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
                                                        <Ionicons
                                                            name={card.silverRate.change > 0 ? "caret-up" : "caret-down"}
                                                            size={12}
                                                            color={card.silverRate.change > 0 ? "#22c55e" : "#ef4444"}
                                                        />
                                                        <Text style={{ fontSize: 12, fontWeight: '900', marginLeft: 4, color: card.silverRate.change > 0 ? '#4ade80' : '#f87171' }}>
                                                            {card.silverRate.change > 0 ? '+' : ''}{card.silverRate.change}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 4 }}>Per Gram</Text>
                                        </View>


                                    </View>

                                    <View style={{ position: 'absolute', right: -48, bottom: -48, width: 224, height: 224, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 9999 }} />
                                    <View style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.2 }}>
                                        <Ionicons name={card.icon as any} size={120} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={{ marginBottom: 48 }}>
                        {/* Digital Gold Section */}
                        <TouchableOpacity
                            onPress={() => router.push('/digital_gold')}
                            activeOpacity={0.9}
                            style={{ backgroundColor: '#111827', borderRadius: 32, padding: 24, marginBottom: 32, shadowColor: '#9CA3AF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginRight: 8 }}>Digital Gold Vault</Text>
                                        <Ionicons name="lock-closed" size={12} color="#fbbf24" />
                                    </View>
                                    <Text style={{ color: 'white', fontSize: 30, fontWeight: '900' }}>{wallet.goldBalance?.toFixed(3)}g</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Total Gold Balance</Text>
                                </View>
                                <View style={{ width: 48, height: 48, backgroundColor: '#1F2937', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151' }}>
                                    <Ionicons name="logo-bitcoin" size={24} color="#fbbf24" />
                                </View>
                            </View>

                            <View style={{ borderTopWidth: 1, borderColor: '#1F2937', paddingTop: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Invested: </Text>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>₹{(wallet.totalInvested || 0).toLocaleString()}</Text>
                                        <Text style={{ color: '#6B7280', fontSize: 9, marginLeft: 8 }}>(@ ₹{((wallet.totalInvested || 0) / (wallet.goldBalance || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/g)</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                                        <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginRight: 4 }}>Manage</Text>
                                        <Ionicons name="arrow-forward" size={10} color="#fbbf24" />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Current Value: </Text>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>₹{((wallet.goldBalance || 0) * goldRate).toLocaleString()}</Text>
                                    </View>
                                    {(wallet.totalProfit !== 0) && (
                                        <View style={{ backgroundColor: (wallet.totalProfit || 0) >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ color: (wallet.totalProfit || 0) >= 0 ? '#4ade80' : '#f87171', fontSize: 9, fontWeight: 'bold' }}>
                                                {(wallet.totalProfit || 0) >= 0 ? '+' : ''}{wallet.profitPercentage?.toFixed(1)}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Gold Schemes Highlight */}
                        <TouchableOpacity
                            onPress={() => router.push('/schemes')}
                            activeOpacity={0.9}
                            style={{ backgroundColor: '#ea580c', borderRadius: 32, padding: 24, marginBottom: 32, shadowColor: '#fed7aa', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, overflow: 'hidden' }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>Savings Plan</Text>
                                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic' }}>Gold Schemes 💎</Text>
                                </View>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="ribbon" size={24} color="white" />
                                </View>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 24 }}>Invest monthly and earn up to 10% bonus on your jewellery purchase.</Text>
                            <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
                                <Text style={{ color: '#ea580c', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Enroll Now</Text>
                            </View>
                            <View style={{ position: 'absolute', right: -32, bottom: -32, opacity: 0.1 }}>
                                <Ionicons name="sparkles" size={150} color="white" />
                            </View>
                        </TouchableOpacity>

                        {/* My Activity Section */}
                        <View style={{ marginBottom: 40 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24 }}>My Activity</Text>
                            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 32, overflow: 'hidden' }}>
                                <TouchableOpacity
                                    onPress={() => router.push('/schemes')}
                                    style={{ paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 40, height: 40, backgroundColor: '#ffedd5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                            <Ionicons name="ribbon" size={20} color="#f97316" />
                                        </View>
                                        <Text style={{ color: '#111827', fontWeight: 'bold' }}>My Gold Schemes</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Account Settings */}
                        <View style={{ marginBottom: 40 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24 }}>Account Settings</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {[
                                    { label: 'Track Orders', icon: 'receipt-outline', route: '/orders' },
                                    { label: 'Addresses', icon: 'map-outline', route: '/addresses' },
                                    { label: 'My Schemes', icon: 'ribbon-outline', route: '/schemes' },
                                    { label: 'My Profile', icon: 'person-outline', route: '/profile' },
                                ].map((item, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => router.push(item.route as any)}
                                        activeOpacity={0.7}
                                        style={{ width: '48%', backgroundColor: '#fff7ed', borderRadius: 32, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,237,213,0.5)', flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, marginRight: 16 }}>
                                            <Ionicons name={item.icon as any} size={18} color="#f97316" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }} numberOfLines={1}>{item.label}</Text>
                                            <Text style={{ color: 'rgba(234,88,12,0.6)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label === 'The Vault' ? 'Secure Items' : 'Manage'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Streamlined Support Alert Notification */}
                    {resolvedTickets.length > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/buyer_tickets')}
                            activeOpacity={0.9}
                            style={{ backgroundColor: '#0d9488', borderRadius: 32, padding: 24, marginBottom: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#ccfbf1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                    <Ionicons name="notifications-outline" size={24} color="white" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>Ticket Solved ✨</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>Your support request has been updated.</Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: '#0d9488', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>View Details</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Vault Preview Section */}
                    {wishlist.length > 0 && (
                        <View style={{ marginBottom: 48 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Wishlist</Text>
                                    <View style={{ height: 4, width: 32, backgroundColor: '#ea580c', borderRadius: 9999, marginTop: 4 }} />
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/wishlist')}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                                >
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 2 }}>Open Wishlist</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#f97316" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                {wishlist.slice(0, 4).map((item) => (
                                    <TouchableOpacity
                                        key={item._id}
                                        activeOpacity={0.8}
                                        onPress={() => router.push(`/product_detail?id=${item.product?._id}`)}
                                        style={{ marginRight: 16, backgroundColor: 'white', borderRadius: 32, padding: 8, borderWidth: 1, borderColor: '#F9FAFB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, alignItems: 'center', width: 160 }}
                                    >
                                        <View style={{ width: '100%', height: 128, backgroundColor: '#F9FAFB', borderRadius: 24, overflow: 'hidden', marginBottom: 12 }}>
                                            {item.product?.images?.[0] ? (
                                                <Image source={{ uri: item.product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            ) : (
                                                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Ionicons name="image-outline" size={24} color="#d1d5db" />
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ paddingHorizontal: 8, paddingBottom: 8, alignItems: 'center' }}>
                                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 10, textAlign: 'center', marginBottom: 4 }} numberOfLines={1}>
                                                {item.product?.name}
                                            </Text>
                                            <Text style={{ color: '#ea580c', fontWeight: '900', fontSize: 12 }}>
                                                ₹{item.product?.price?.toLocaleString()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Premium Categories Section */}
                    <View style={{ marginBottom: 48 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Collections</Text>
                                <View style={{ height: 4, width: 32, backgroundColor: '#ea580c', borderRadius: 9999, marginTop: 4 }} />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/products_browse')}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                            >
                                <Text style={{ fontSize: 10, fontWeight: '900', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 2 }}>View Gallery</Text>
                                <Ionicons name="chevron-forward" size={12} color="#f97316" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', overflow: 'visible' }}>
                            {categories.map((cat, idx) => {
                                // Map names to local assets
                                const localAssets: { [key: string]: any } = {
                                    'anklet': require('../assets/anklet.png'),
                                    'coin': require('../assets/Goldcoin.png'),
                                    'necklace': require('../assets/necklace.png'),
                                    'wedding': require('../assets/weddingrings.png'),
                                    'ring': require('../assets/Rings.png'),
                                };

                                const getLocalAsset = (name: string) => {
                                    const lowerName = name.toLowerCase();
                                    for (const key in localAssets) {
                                        if (lowerName.includes(key)) return localAssets[key];
                                    }
                                    return null;
                                };

                                const categoryAsset = getLocalAsset(cat.name);

                                return (
                                    <TouchableOpacity
                                        key={cat._id}
                                        style={{ marginRight: 24, alignItems: 'center' }}
                                        onPress={() => router.push(`/products_browse?category=${cat._id}`)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ width: 80, height: 80, backgroundColor: 'white', borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 3, borderColor: '#fff7ed', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
                                            {cat.image ? (
                                                <Image source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            ) : categoryAsset ? (
                                                <Image source={categoryAsset} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                                            ) : (
                                                <View style={{ width: 56, height: 56, backgroundColor: '#fff7ed', borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Ionicons name="sparkles-outline" size={24} color="#f97316" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ color: '#111827', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Featured Curator Grid */}
                    <View style={{ marginBottom: 40 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                            <View>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>All Products</Text>
                                <View style={{ height: 4, width: 32, backgroundColor: '#ea580c', borderRadius: 9999, marginTop: 4 }} />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/products_browse')}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                            >
                                <Text style={{ fontSize: 10, fontWeight: '900', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 2 }}>Shop All</Text>
                                <Ionicons name="chevron-forward" size={12} color="#f97316" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>

                        {productsLoading ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} style={{ width: '48%', marginBottom: 16 }}>
                                        <Skeleton width="100%" height={160} style={{ borderRadius: 24 }} />
                                        <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
                                        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {products.map((product) => (
                                    <TouchableOpacity
                                        key={product._id}
                                        activeOpacity={0.9}
                                        style={{ backgroundColor: 'white', borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, width: '48%', overflow: 'hidden' }}
                                        onPress={() => router.push(`/product_detail?id=${product._id}`)}
                                    >
                                        <View style={{ position: 'relative' }}>
                                            <View style={{ width: '100%', height: 160, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
                                                {product.images?.[0] ? (
                                                    <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                ) : (
                                                    <Ionicons name="image-outline" size={40} color="#d1d5db" />
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}
                                                onPress={() => addToWishlist(product._id)}
                                            >
                                                <Ionicons name={wishlistItems.includes(product._id) ? "diamond" : "diamond-outline"} size={18} color={wishlistItems.includes(product._id) ? "#ec4899" : "#f97316"} />
                                            </TouchableOpacity>

                                            {product.stock < 5 && product.stock > 0 && (
                                                <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>Limited</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View style={{ padding: 12 }}>
                                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }} numberOfLines={1}>{product.name}</Text>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    {product.specifications?.metalType || ''} . {product.specifications?.purity || ''} . {product.specifications?.weight || 0}g
                                                </Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                                <View>
                                                    <Text style={{ color: '#ea580c', fontWeight: '900', fontSize: 16 }}>₹{product.price.toLocaleString()}</Text>
                                                    <Text style={{ color: '#9ca3af', fontSize: 9 }}>Incl. making</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={{ backgroundColor: '#ea580c', width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', shadowColor: '#ea580c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                                                    onPress={() => addToCart(product._id)}
                                                >
                                                    <Ionicons name={cartItems.includes(product._id) ? "cart" : "add"} size={18} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <BottomNav activeTab="home" />
        </SafeAreaView >
    );
}
