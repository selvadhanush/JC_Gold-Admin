import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    name: string;
    description: string;
    category: {
        _id: string;
        name: string;
    };
    specifications: {
        metalType: string;
        purity: string;
        weight: number;
        size: string;
    };
    price: number;
    makingCharges: number;
    images: string[];
    stock: number;
}

export default function ProductDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isInCart, setIsInCart] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (id) {
            fetchProductDetail();
            checkCartStatus();
            checkWishlistStatus();
        }
    }, [id]);

    const fetchProductDetail = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PRODUCTS}/${id}`, { headers });
            const data = await response.json();
            if (data.success) {
                setProduct(data.data);
                fetchSimilarProducts(data.data.category?._id);
            }
        } catch (error) {
            console.error('Error fetching product detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarProducts = async (categoryId: string) => {
        try {
            if (!categoryId) return;
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PRODUCTS}?category=${categoryId}&limit=6`, { headers });
            const data = await response.json();
            if (data.success) {
                // Filter out the current product
                const filtered = data.data.filter((p: Product) => p._id !== id);
                setSimilarProducts(filtered);
            }
        } catch (error) {
            console.error('Error fetching similar products:', error);
        }
    };

    const checkCartStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, { headers });
            const data = await response.json();
            if (data.success) {
                const item = data.data.items.find((i: any) => i.product._id === id);
                setIsInCart(!!item);
                if (item) setQuantity(item.quantity);
            }
        } catch (error) { }
    };

    const checkWishlistStatus = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_WISHLIST, { headers });
            const data = await response.json();
            if (data.success) {
                const item = data.data.find((i: any) => i.product._id === id);
                setIsInWishlist(!!item);
            }
        } catch (error) { }
    };

    const addToCart = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, {
                method: 'POST',
                headers,
                body: JSON.stringify({ productId: id, quantity }),
            });
            const data = await response.json();
            if (data.success) {
                setIsInCart(true);
            }
        } catch (error) { }
    };

    const toggleWishlist = async () => {
        try {
            const headers = await getAuthHeaders();
            const method = isInWishlist ? 'DELETE' : 'POST';
            const url = isInWishlist
                ? `${API_ENDPOINTS.BUYER_WISHLIST}/${id}`
                : API_ENDPOINTS.BUYER_WISHLIST;

            const response = await fetch(url, {
                method,
                headers,
                body: isInWishlist ? undefined : JSON.stringify({ productId: id }),
            });
            const data = await response.json();
            if (data.success) {
                setIsInWishlist(!isInWishlist);
            }
        } catch (error) { }
    };

    const onShare = async () => {
        try {
            if (!product) return;
            await Share.share({
                message: `Check out this exquisite ${product.name} at JC Gold & Jewels!`,
                url: `jcgold://product/${id}`,
            });
        } catch (error) { }
    };

    const handleBuyNow = () => {
        router.push(`/checkout?productId=${id}&buyQuantity=${quantity}`);
    };

    const renderSkeleton = () => (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center h-16">
                <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
                <View className="flex-row">
                    <Skeleton width={40} height={40} style={{ borderRadius: 20, marginRight: 12 }} />
                    <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
                </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-6">
                    <Skeleton width="100%" height={450} style={{ borderRadius: 40, marginTop: 10 }} />
                    <View className="mt-8">
                        <Skeleton width={120} height={12} className="mb-2" />
                        <Skeleton width="90%" height={32} className="mb-4" />
                        <Skeleton width={150} height={28} />
                    </View>
                    <View className="flex-row flex-wrap justify-between mt-10">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} width="48%" height={80} style={{ borderRadius: 24, marginBottom: 16 }} />
                        ))}
                    </View>
                    <View className="mt-6">
                        <Skeleton width={100} height={20} className="mb-4" />
                        <Skeleton width="100%" height={100} style={{ borderRadius: 24 }} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );

    if (loading) return renderSkeleton();

    if (!product) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-10">
                <Ionicons name="alert-circle-outline" size={80} color="#f97316" />
                <Text className="text-2xl font-black text-gray-900 mt-6 text-center">Masterpiece Not Found</Text>
                <TouchableOpacity
                    className="mt-8 bg-primary-600 px-8 py-4 rounded-2xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Return to Shop</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View className="px-6 py-4 flex-row items-center justify-between z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100"
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={onShare}
                        className="w-12 h-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 mr-3"
                    >
                        <Ionicons name="share-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={toggleWishlist}
                        className="w-12 h-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100"
                    >
                        <Ionicons
                            name={isInWishlist ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isInWishlist ? '#f97316' : '#111827'}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Image Gallery */}
                <View className="relative">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setSelectedImage(index);
                        }}
                    >
                        {product.images && product.images.length > 0 ? (
                            product.images.map((img, idx) => (
                                <View key={idx} style={{ width }} className="px-6 h-[450px]">
                                    <Image
                                        source={{ uri: img }}
                                        className="w-full h-full rounded-[40px]"
                                        resizeMode="cover"
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={{ width }} className="h-[450px] items-center justify-center">
                                <View className="w-64 h-64 bg-gray-50 rounded-full items-center justify-center">
                                    <Ionicons name="image-outline" size={64} color="#d1d5db" />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Floating Indicators */}
                    <View className="absolute bottom-10 left-0 right-0 flex-row justify-center space-x-2">
                        {product.images.map((_, index) => (
                            <View
                                key={index}
                                className={`h-1.5 rounded-full ${index === selectedImage ? 'w-8 bg-gray-900' : 'w-2 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Quality Badge */}
                    <View className="absolute top-8 left-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50">
                        <View className="flex-row items-center">
                            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                            <Text className="ml-2 text-[10px] font-black uppercase tracking-widest text-gray-900">100% Certified</Text>
                        </View>
                    </View>
                </View>

                {/* Info Container */}
                <View className="px-8 mt-10">
                    <Text className="text-primary-600 font-black text-xs uppercase tracking-[3px] mb-2">{product.category?.name || 'Luxury Collection'}</Text>
                    <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-3xl font-black text-gray-900 flex-1 mr-4">{product.name}</Text>
                    </View>

                    <View className="flex-row items-end mb-10">
                        <Text className="text-3xl font-black text-primary-600">₹{product.price.toLocaleString()}</Text>
                        <Text className="text-gray-400 text-xs font-bold mb-1.5 ml-3">Incl. all taxes</Text>
                    </View>

                    {/* Trust Badges */}
                    <View className="flex-row justify-between mb-10 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                        {[
                            { icon: 'reload', label: 'EASY RETURNS' },
                            { icon: 'ribbon', label: 'HALLMARKED' },
                            { icon: 'leaf', label: 'FREE SHIPPING' },
                        ].map((badge, i) => (
                            <View key={i} className="items-center">
                                <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm mb-2">
                                    <Ionicons name={badge.icon as any} size={18} color="#f97316" />
                                </View>
                                <Text className="text-[8px] font-black text-gray-400 tracking-wider text-center">{badge.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Story / Description */}
                    <View className="mb-10">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-4">The Story</Text>
                        <Text className="text-gray-600 leading-7 text-base font-medium">
                            {product.description || "A masterfully crafted piece that blends timeless tradition with contemporary luxury. Each curve is designed to capture the essence of brilliance and elegance."}
                        </Text>
                    </View>

                    {/* Specifications Grid */}
                    <View className="mb-12">
                        <View className="flex-row justify-between items-end mb-6">
                            <View>
                                <Text className="text-xl font-black text-gray-900">Master Specs</Text>
                                <View className="h-1 w-8 bg-primary-600 rounded-full mt-1" />
                            </View>
                        </View>
                        <View className="flex-row flex-wrap justify-between">
                            {[
                                { label: 'Metal', value: product.specifications.metalType, icon: 'diamond-outline' },
                                { label: 'Purity', value: product.specifications.purity, icon: 'analytics-outline' },
                                { label: 'Weight', value: `${product.specifications.weight}g`, icon: 'scale-outline' },
                                { label: 'Size', value: product.specifications.size || 'Unique', icon: 'resize-outline' },
                            ].map((spec, i) => (
                                <View key={i} className="bg-white p-6 rounded-[32px] w-[48%] mb-4 border border-gray-100 shadow-sm">
                                    <View className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center mb-4">
                                        <Ionicons name={spec.icon as any} size={18} color="#f97316" />
                                    </View>
                                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{spec.label}</Text>
                                    <Text className="text-gray-900 font-bold text-base">{spec.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Quantity Choice */}
                    <View className="mb-12 bg-gray-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-10 -mt-10" />
                        <View className="flex-row justify-between items-center relative z-10">
                            <View>
                                <Text className="text-white font-black text-lg mb-1">Select Volume</Text>
                                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Order quantity</Text>
                            </View>
                            <View className="flex-row items-center bg-white/10 p-1.5 rounded-full border border-white/10">
                                <TouchableOpacity
                                    onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                                    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="remove" size={18} color="#111827" />
                                </TouchableOpacity>
                                <Text className="mx-6 text-xl font-black text-white">{quantity}</Text>
                                <TouchableOpacity
                                    onPress={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="add" size={18} color="#111827" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* More to Discover */}
                    {similarProducts.length > 0 && (
                        <View className="mb-40">
                            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-8">Similar Masterpieces</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
                                {similarProducts.map((simProduct) => (
                                    <TouchableOpacity
                                        key={simProduct._id}
                                        className="mr-6 bg-white rounded-[32px] border border-gray-50 shadow-sm p-2 w-52"
                                        onPress={() => {
                                            router.push(`/product_detail?id=${simProduct._id}`);
                                            // Optional: scrollToTop if needed
                                        }}
                                    >
                                        <View className="w-full h-36 bg-gray-50 rounded-[28px] overflow-hidden mb-3">
                                            {simProduct.images?.[0] ? (
                                                <Image source={{ uri: simProduct.images[0] }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center">
                                                    <Ionicons name="image-outline" size={24} color="#d1d5db" />
                                                </View>
                                            )}
                                        </View>
                                        <View className="px-2 pb-2">
                                            <Text className="text-gray-900 font-bold text-[13px] mb-1" numberOfLines={1}>{simProduct.name}</Text>
                                            <Text className="text-primary-600 font-black text-sm">₹{simProduct.price.toLocaleString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating Boutique Bar */}
            <View className="absolute bottom-6 left-6 right-6">
                <View className="flex-row bg-white/95 backdrop-blur-2xl rounded-[32px] p-3 shadow-2xl border border-gray-100 items-center">
                    <TouchableOpacity
                        onPress={addToCart}
                        activeOpacity={0.7}
                        className={`h-14 rounded-2xl items-center justify-center flex-row px-5 flex-1 mr-3 ${isInCart ? 'bg-gray-100' : 'bg-gray-900'}`}
                    >
                        <Ionicons
                            name={isInCart ? "checkmark-circle" : "cart-outline"}
                            size={20}
                            color={isInCart ? "#10b981" : "white"}
                        />
                        <Text className={`font-black text-[10px] uppercase tracking-widest ml-2 ${isInCart ? 'text-gray-900' : 'text-white'}`}>
                            {isInCart ? 'In Vault' : 'Add to Cart'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleBuyNow}
                        activeOpacity={0.8}
                        className="h-14 bg-primary-600 rounded-2xl items-center justify-center flex-row px-8 flex-[1.4] shadow-lg shadow-primary-500/30"
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-[2px]">
                            Acquire Now
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="white" className="ml-1" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
