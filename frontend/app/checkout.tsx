import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';

const { width } = Dimensions.get('window');

interface CheckoutItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        price: number;
        images: string[];
    };
    quantity: number;
}

export default function Checkout() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { productId, buyQuantity } = params;

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE' | 'WALLET'>('COD');
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
    const [directProduct, setDirectProduct] = useState<any>(null);
    const [directQuantity, setDirectQuantity] = useState<number>(1);

    const isDirectBuy = !!productId;

    useEffect(() => {
        if (buyQuantity) {
            setDirectQuantity(Number(buyQuantity));
        }
        initCheckout();
    }, [buyQuantity]);

    const initCheckout = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchAddresses(),
                isDirectBuy ? fetchDirectProduct() : fetchCartItems()
            ]);
        } catch (error) {
            console.error('Checkout Init Error:', error);
            showToast.error('Failed to initialize checkout');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_ADDRESSES, { headers });
            const data = await response.json();
            if (data.success) {
                setAddresses(data.data);
                const defaultAddr = data.data.find((a: any) => a.isDefault);
                if (defaultAddr) setSelectedAddress(defaultAddr._id);
                else if (data.data.length > 0) setSelectedAddress(data.data[0]._id);
            }
        } catch (error) {
            console.error('Fetch Addresses Error:', error);
        }
    };

    const fetchDirectProduct = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_PRODUCTS}/${productId}`, { headers });
            const data = await response.json();
            if (data.success) {
                setDirectProduct(data.data);
            }
        } catch (error) {
            console.error('Fetch Product Error:', error);
        }
    };

    const fetchCartItems = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_CART, { headers });
            const data = await response.json();
            if (data.success) {
                setCheckoutItems(data.data.items || []);
            }
        } catch (error) {
            console.error('Fetch Cart Error:', error);
        }
    };

    const calculateSubtotal = () => {
        if (isDirectBuy && directProduct) {
            return (directProduct.price || 0) * directQuantity;
        }
        return checkoutItems.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 0)), 0);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            showToast.error('Please select a delivery address');
            return;
        }

        setPlacingOrder(true);
        try {
            const headers = await getAuthHeaders();
            let payload;
            let endpoint;

            if (isDirectBuy) {
                payload = {
                    productId,
                    quantity: directQuantity,
                    addressId: selectedAddress,
                    paymentMethod
                };
                endpoint = API_ENDPOINTS.BUYER_DIRECT_ORDER;
            } else {
                payload = {
                    addressId: selectedAddress,
                    paymentMethod
                };
                endpoint = API_ENDPOINTS.BUYER_ORDERS;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Order placed successfully!');
                router.replace('/orders');
            } else {
                showToast.error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Place Order Error:', error);
            showToast.error('Something went wrong');
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="mt-4 text-gray-500">Preparing your order...</Text>
            </View>
        );
    }

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.03; // 3% GST
    const total = subtotal + tax;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">{isDirectBuy ? 'Direct Purchase' : 'Final Checkout'}</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
                {/* Delivery Address Section - UPDATED TO BE MORE PROMINENT */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-xl font-bold text-gray-900">Delivery Address</Text>
                            <Text className="text-gray-500 text-sm">Where should we send your items?</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/addresses')}
                            className="bg-primary-50 px-4 py-2 rounded-xl"
                        >
                            <Text className="text-primary-600 font-bold">+ New</Text>
                        </TouchableOpacity>
                    </View>

                    {addresses.length > 0 ? (
                        <View className="space-y-3">
                            {addresses.map((addr) => (
                                <TouchableOpacity
                                    key={addr._id}
                                    onPress={() => setSelectedAddress(addr._id)}
                                    className={`p-5 rounded-3xl border-2 shadow-sm ${selectedAddress === addr._id ? 'bg-primary-50 border-primary-500' : 'bg-white border-gray-100'}`}
                                >
                                    <View className="flex-row items-center">
                                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${selectedAddress === addr._id ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                                            {selectedAddress === addr._id && <View className="w-2 h-2 bg-white rounded-full" />}
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="font-bold text-gray-900 text-lg mr-2">{addr.fullName}</Text>
                                                {addr.isDefault && (
                                                    <View className="bg-primary-100 px-2 py-0.5 rounded-md">
                                                        <Text className="text-primary-700 text-[10px] font-bold uppercase">Default</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text className="text-gray-600" numberOfLines={1}>{addr.addressLine1}</Text>
                                            <Text className="text-gray-500 text-sm">{addr.city}, {addr.state} - {addr.pincode}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push('/addresses')}
                            className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center"
                        >
                            <View className="bg-gray-50 p-4 rounded-full mb-3">
                                <Ionicons name="location-outline" size={32} color="#f97316" />
                            </View>
                            <Text className="text-gray-900 font-bold text-lg">No Addresses Found</Text>
                            <Text className="text-gray-500 text-center mt-1">Please add a delivery address to continue your purchase.</Text>
                            <View className="mt-4 bg-primary-600 px-6 py-2 rounded-xl">
                                <Text className="text-white font-bold">Add Address Now</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Items Section */}
                <View className="mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Items Summary</Text>
                    {isDirectBuy && directProduct ? (
                        <View className="bg-white p-4 rounded-3xl flex-row items-center border border-gray-100 shadow-sm">
                            <View className="bg-gray-50 p-2 rounded-2xl mr-4">
                                <Image
                                    source={{ uri: directProduct.images[0] }}
                                    className="w-20 h-20 rounded-xl"
                                    resizeMode="contain"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-gray-900 text-lg" numberOfLines={1}>{directProduct.name}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-gray-500 mr-3">Quantity:</Text>
                                    <View className="flex-row items-center bg-gray-50 rounded-xl px-1 py-1 border border-gray-100">
                                        <TouchableOpacity
                                            onPress={() => directQuantity > 1 && setDirectQuantity(directQuantity - 1)}
                                            className="w-8 h-8 items-center justify-center bg-white rounded-lg shadow-sm"
                                        >
                                            <Ionicons name="remove" size={16} color="#4b5563" />
                                        </TouchableOpacity>
                                        <Text className="mx-4 font-black text-gray-900">{directQuantity}</Text>
                                        <TouchableOpacity
                                            onPress={() => setDirectQuantity(directQuantity + 1)}
                                            className="w-8 h-8 items-center justify-center bg-white rounded-lg shadow-sm"
                                        >
                                            <Ionicons name="add" size={16} color="#4b5563" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text className="text-primary-600 font-bold text-lg mt-2">₹{directProduct.price.toLocaleString()}</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="space-y-3">
                            {checkoutItems.map((item) => (
                                <View key={item._id} className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-100">
                                    <Image
                                        source={{ uri: item.product.images[0] }}
                                        className="w-14 h-14 rounded-lg mr-4"
                                    />
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-900" numberOfLines={1}>{item.product.name}</Text>
                                        <Text className="text-gray-500 text-sm">Qty: {item.quantity}</Text>
                                    </View>
                                    <Text className="font-bold text-primary-600">₹{item.product.price.toLocaleString()}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View className="mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Payment Method</Text>
                    <View className="flex-row gap-3">
                        {['COD', 'ONLINE', 'WALLET'].map((method) => (
                            <TouchableOpacity
                                key={method}
                                onPress={() => setPaymentMethod(method as any)}
                                className={`flex-1 p-5 rounded-3xl border-2 items-center justify-center ${paymentMethod === method ? 'bg-primary-50 border-primary-500 shadow-sm' : 'bg-white border-gray-100'}`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${paymentMethod === method ? 'bg-primary-100' : 'bg-gray-50'}`}>
                                    <Ionicons
                                        name={method === 'COD' ? 'cash' : method === 'ONLINE' ? 'card' : 'wallet'}
                                        size={22}
                                        color={paymentMethod === method ? '#f97316' : '#9ca3af'}
                                    />
                                </View>
                                <Text className={`text-xs font-bold ${paymentMethod === method ? 'text-primary-700' : 'text-gray-500'}`}>{method}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Price Details */}
                <View className="bg-white p-8 rounded-[40px] border border-gray-100 mb-32 shadow-sm">
                    <Text className="text-gray-900 font-bold text-xl mb-6">Execution Summary</Text>
                    <View className="space-y-4">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-base">Cart Subtotal</Text>
                            <Text className="text-gray-900 font-bold text-base">₹{subtotal.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-base">Gst & Taxes (3%)</Text>
                            <Text className="text-gray-900 font-bold text-base">₹{tax.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-base">Shipping Fee</Text>
                            <Text className="text-green-600 font-bold text-base">FREE</Text>
                        </View>
                        <View className="h-[1] bg-gray-100 my-2" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-xl font-extrabold text-gray-900">Total Payable</Text>
                            <Text className="text-2xl font-black text-primary-600">₹{total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Bottom Action */}
            <View className="absolute bottom-0 left-0 right-0 bg-white px-6 pt-4 pb-10 border-t border-gray-100 shadow-2xl">
                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={placingOrder || !selectedAddress}
                    className={`h-16 rounded-2xl flex-row items-center justify-center px-8 ${placingOrder || !selectedAddress ? 'bg-gray-300' : 'bg-primary-600 shadow-xl shadow-primary-600/40'}`}
                >
                    {placingOrder ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <View className="flex-1">
                                <Text className="text-white/70 text-xs font-bold uppercase">Confirm & Pay</Text>
                                <Text className="text-white font-black text-xl">₹{total.toLocaleString()}</Text>
                            </View>
                            <View className="bg-white/20 p-2 rounded-xl">
                                <Ionicons name="chevron-forward" size={24} color="white" />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
                {!selectedAddress && !loading && (
                    <Text className="text-red-500 text-center mt-3 font-semibold">⚠️ Please select a delivery address</Text>
                )}
            </View>
        </SafeAreaView>
    );
}
