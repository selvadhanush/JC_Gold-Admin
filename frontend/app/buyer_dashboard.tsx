import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

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

    const initData = useCallback(async () => {
        try {
            await Promise.all([
                loadStoredUser(),
                fetchProfile(),
                fetchProducts(),
                fetchCategories(),
                fetchWishlist(),
                fetchResolvedTickets(),
                fetchGoldRate()
            ]);
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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
            if (data.success) setWishlist(data.data);
        } catch (error) { }
    };

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PRODUCTS}?limit=6&isFeatured=true`, { headers });
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
                setResolvedTickets(resolved);
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

    const renderSkeleton = () => (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center bg-white">
                <View>
                    <Skeleton width={80} height={10} className="mb-2" />
                    <Skeleton width={150} height={24} />
                </View>
                <Skeleton width={48} height={48} style={{ borderRadius: 16 }} />
            </View>
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                <Skeleton width="100%" height={200} style={{ borderRadius: 32, marginTop: 16 }} />
                <View className="flex-row justify-between mt-8">
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} className="items-center">
                            <Skeleton width={56} height={56} style={{ borderRadius: 16 }} />
                            <Skeleton width={40} height={8} className="mt-2" />
                        </View>
                    ))}
                </View>
                <View className="mt-10">
                    <Skeleton width={100} height={20} className="mb-6" />
                    <View className="flex-row">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} width={80} height={80} style={{ borderRadius: 28, marginRight: 20 }} />
                        ))}
                    </View>
                </View>
                <View className="mt-10">
                    <View className="flex-row justify-between">
                        <Skeleton width={120} height={25} />
                        <Skeleton width={60} height={20} />
                    </View>
                    <View className="flex-row flex-wrap justify-between mt-6">
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={{ width: '48%' }} className="mb-4">
                                <Skeleton width="100%" height={160} style={{ borderRadius: 24 }} />
                                <Skeleton width="80%" height={12} className="mt-3" />
                                <Skeleton width="40%" height={16} className="mt-2" />
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );

    if (loading && !refreshing) return renderSkeleton();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Premium Sticky Header */}
            <View className="px-6 py-4 flex-row justify-between items-center bg-white">
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-1">JC GOLD & JEWELS</Text>
                    <Text className="text-xl font-black text-gray-900">Welcome, {user?.name?.split(' ')[0] || 'Guest'} ✨</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/profile')}
                    className="w-12 h-12 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 overflow-hidden"
                >
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} className="w-full h-full" />
                    ) : (
                        <Ionicons name="person-outline" size={24} color="#f97316" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
            >
                <View className="px-6 pb-52">

                    {/* Premium Jewelry Cards Section */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                        {[
                            { goldTitle: 'Gold 24K', goldPrice: goldRate.toLocaleString(), silverTitle: 'Fine Silver', silverPrice: '780', bgColor: 'bg-primary-600', icon: 'diamond-outline' },
                            { goldTitle: 'Gold 22K', goldPrice: (goldRate * 0.92).toFixed(0).toLocaleString(), silverTitle: 'Sterling Silver', silverPrice: '720', bgColor: 'bg-primary-600', icon: 'sparkles-outline' },
                            { goldTitle: 'Gold 18K', goldPrice: (goldRate * 0.75).toFixed(0).toLocaleString(), silverTitle: 'Britannia Silver', silverPrice: '760', bgColor: 'bg-primary-600', icon: 'flower-outline' }
                        ].map((card, idx) => (
                            <View key={idx} className="mr-4" style={{ width: 300 }}>
                                <TouchableOpacity activeOpacity={0.8} className={`${card.bgColor} rounded-[32px] overflow-hidden shadow-xl`} style={{ elevation: 8 }}>
                                    <View className="p-6 pb-8">
                                        <View className="bg-white/20 self-start px-4 py-1.5 rounded-full mb-4">
                                            <Text className="text-white text-[8px] font-black uppercase tracking-widest">Premium Rate</Text>
                                        </View>

                                        <View className="mb-6">
                                            <Text className="text-white/80 text-[10px] font-bold mb-1">{card.goldTitle}</Text>
                                            <Text className="text-white text-3xl font-black leading-tight">₹{card.goldPrice}</Text>
                                            <Text className="text-white/70 text-[9px] mt-1">Per Gram</Text>
                                        </View>

                                        <View className="border-t border-white/20 pt-4 mb-6">
                                            <Text className="text-white/80 text-[10px] font-bold mb-1">{card.silverTitle}</Text>
                                            <Text className="text-white text-3xl font-black leading-tight">₹{card.silverPrice}</Text>
                                            <Text className="text-white/70 text-[9px] mt-1">Per Gram</Text>
                                        </View>

                                        <TouchableOpacity className="bg-white px-6 py-3 rounded-[20px] items-center">
                                            <Text className="text-primary-600 font-black text-[11px] uppercase tracking-widest">Explore Rates</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="absolute -right-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full" />
                                    <View className="absolute right-4 bottom-4 opacity-20">
                                        <Ionicons name={card.icon as any} size={120} color="white" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    <View className="mb-12">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6">Concierge Services</Text>
                        <View className="flex-row flex-wrap justify-between">
                            {[
                                { label: 'Track Orders', icon: 'receipt-outline', route: '/orders' },
                                { label: 'Digital Gold', icon: 'wallet-outline', route: '/digital_gold' },
                                { label: 'Addresses', icon: 'map-outline', route: '/addresses' },
                                { label: 'My Profile', icon: 'person-outline', route: '/profile' },
                            ].map((item, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => router.push(item.route as any)}
                                    activeOpacity={0.7}
                                    style={{ width: '48%' }}
                                    className="bg-primary-50 rounded-[32px] p-6 mb-4 border border-primary-100/50 flex-row items-center"
                                >
                                    <View className="w-10 h-10 rounded-xl bg-white items-center justify-center shadow-sm mr-4">
                                        <Ionicons name={item.icon as any} size={18} color="#f97316" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-bold text-[11px] mb-1" numberOfLines={1}>{item.label}</Text>
                                        <Text className="text-primary-600/60 text-[8px] font-black uppercase tracking-widest">{item.label === 'The Vault' ? 'Secure Items' : 'Manage'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Streamlined Support Alert Notification */}
                    {resolvedTickets.length > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/buyer_tickets')}
                            activeOpacity={0.9}
                            className="bg-teal-600 rounded-[32px] p-6 mb-12 flex-row items-center justify-between shadow-xl shadow-teal-100"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                                    <Ionicons name="notifications-outline" size={24} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-black text-lg">Ticket Solved ✨</Text>
                                    <Text className="text-white/70 text-xs font-medium">Your support request has been updated.</Text>
                                </View>
                            </View>
                            <View className="bg-white px-4 py-2 rounded-xl">
                                <Text className="text-teal-600 font-black text-[10px] uppercase">View Details</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Vault Preview Section */}
                    {wishlist.length > 0 && (
                        <View className="mb-12">
                            <View className="flex-row justify-between items-end mb-6">
                                <View>
                                    <Text className="text-xl font-black text-gray-900">Wishlist</Text>
                                    <View className="h-1 w-8 bg-primary-600 rounded-full mt-1" />
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/wishlist')}
                                    className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full"
                                >
                                    <Text className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Open Wishlist</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#f97316" className="ml-1" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {wishlist.slice(0, 4).map((item) => (
                                    <TouchableOpacity
                                        key={item._id}
                                        activeOpacity={0.8}
                                        onPress={() => router.push(`/product_detail?id=${item.product?._id}`)}
                                        className="mr-4 bg-white rounded-[32px] p-2 border border-gray-50 shadow-sm items-center w-40"
                                    >
                                        <View className="w-full h-32 bg-gray-50 rounded-[24px] overflow-hidden mb-3">
                                            {item.product?.images?.[0] ? (
                                                <Image source={{ uri: item.product.images[0] }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center">
                                                    <Ionicons name="image-outline" size={24} color="#d1d5db" />
                                                </View>
                                            )}
                                        </View>
                                        <View className="px-2 pb-2 items-center">
                                            <Text className="text-gray-900 font-bold text-[10px] text-center mb-1" numberOfLines={1}>
                                                {item.product?.name}
                                            </Text>
                                            <Text className="text-primary-600 font-black text-xs">
                                                ₹{item.product?.price?.toLocaleString()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Premium Categories Section */}
                    <View className="mb-12">
                        <View className="flex-row justify-between items-end mb-5">
                            <View>
                                <Text className="text-xl font-black text-gray-900">Collections</Text>
                                <View className="h-1 w-8 bg-primary-600 rounded-full mt-1" />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/products_browse')}
                                className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-[10px] font-black text-primary-600 uppercase tracking-widest">View Gallery</Text>
                                <Ionicons name="chevron-forward" size={12} color="#f97316" className="ml-1" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
                            {categories.map((cat, idx) => {
                                const colors = ['bg-orange-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-rose-50'];
                                const iconColors = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e'];
                                const bgColor = colors[idx % colors.length];
                                const iconColor = iconColors[idx % iconColors.length];

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
                                        className="mr-6 items-center"
                                        onPress={() => router.push(`/products_browse?category=${cat._id}`)}
                                        activeOpacity={0.8}
                                    >
                                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 border-[3px] border-primary-50 overflow-hidden shadow-md">
                                            {cat.image ? (
                                                <Image source={{ uri: cat.image }} className="w-full h-full" resizeMode="cover" />
                                            ) : categoryAsset ? (
                                                <Image source={categoryAsset} className="w-full h-full" resizeMode="contain" />
                                            ) : (
                                                <View className="w-14 h-14 bg-primary-50 rounded-full items-center justify-center">
                                                    <Ionicons name="sparkles-outline" size={24} color="#f97316" />
                                                </View>
                                            )}
                                        </View>
                                        <Text className="text-gray-900 text-[9px] font-black uppercase tracking-[2px]">{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Featured Curator Grid */}
                    <View className="mb-10">
                        <View className="flex-row justify-between items-end mb-6">
                            <View>
                                <Text className="text-xl font-black text-gray-900">Top Picks</Text>
                                <View className="h-1 w-8 bg-primary-600 rounded-full mt-1" />
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/products_browse')}
                                className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Shop All</Text>
                                <Ionicons name="chevron-forward" size={12} color="#f97316" className="ml-1" />
                            </TouchableOpacity>
                        </View>

                        {productsLoading ? (
                            <View className="flex-row flex-wrap justify-between">
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} style={{ width: '48%' }} className="mb-4">
                                        <Skeleton width="100%" height={160} style={{ borderRadius: 24 }} />
                                        <Skeleton width="80%" height={12} className="mt-3" />
                                        <Skeleton width="40%" height={16} className="mt-2" />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="flex-row flex-wrap justify-between">
                                {products.map((product) => (
                                    <TouchableOpacity
                                        key={product._id}
                                        activeOpacity={0.7}
                                        className="bg-white rounded-[32px] p-2 mb-6 border border-gray-50 shadow-lg"
                                        style={{ width: '48%', elevation: 4 }}
                                        onPress={() => router.push(`/product_detail?id=${product._id}`)}
                                    >
                                        <View className="w-full h-44 bg-gray-50 rounded-[24px] overflow-hidden mb-3">
                                            {product.images?.[0] ? (
                                                <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center">
                                                    <Ionicons name="image-outline" size={32} color="#d1d5db" />
                                                </View>
                                            )}
                                        </View>
                                        <View className="px-2 pb-2">
                                            <Text className="text-gray-900 font-bold text-sm mb-1 leading-5" numberOfLines={2}>{product.name}</Text>
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-primary-600 font-black text-xl">₹{product.price.toLocaleString()}</Text>
                                                <View className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center shadow-lg shadow-primary-500/40">
                                                    <Ionicons name="cart" size={20} color="white" />
                                                </View>
                                            </View>
                                            <View className="flex-row items-center mt-2">
                                                <View className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" />
                                                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">In Stock</Text>
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
        </SafeAreaView>
    );
}
