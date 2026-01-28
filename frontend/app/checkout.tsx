import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { showToast } from '../utils/toast';
import RazorpayModal from '../components/RazorpayModal';

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
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [rzpData, setRzpData] = useState<any>(null);
    const [showAddressList, setShowAddressList] = useState(false); // New state for modal

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

    const handlePlaceOrder = useCallback(async () => {
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
                payload = { productId, quantity: directQuantity, addressId: selectedAddress, paymentMethod };
                endpoint = API_ENDPOINTS.BUYER_DIRECT_ORDER;
            } else {
                payload = { addressId: selectedAddress, paymentMethod };
                endpoint = API_ENDPOINTS.BUYER_ORDERS;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                const order = data.data;

                if (paymentMethod === 'ONLINE') {
                    await initiateRazorpay(order._id);
                } else {
                    showToast.success('Order placed successfully!');
                    router.replace('/orders');
                }
            } else {
                showToast.error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Place Order Error:', error);
            showToast.error('Something went wrong');
        } finally {
            setPlacingOrder(false);
        }
    }, [selectedAddress, isDirectBuy, productId, directQuantity, paymentMethod, router]);

    const verifyPayment = useCallback(async (orderId: string, rzpOrderId: string, rzpPaymentId: string) => {
        try {
            setPlacingOrder(true);
            const headers = await getAuthHeaders();

            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_VERIFY, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    orderId,
                    razorpay_order_id: rzpOrderId,
                    razorpay_payment_id: rzpPaymentId,
                    razorpay_signature: 'SIMULATED_SIGNATURE'
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Payment successful!');
                setShowRazorpayModal(false);
                router.replace('/orders');
            } else {
                showToast.error(data.message || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Verify Error:', error);
        } finally {
            setPlacingOrder(false);
        }
    }, [router]);

    const initiateRazorpay = useCallback(async (orderId: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_ORDER, {
                method: 'POST',
                headers,
                body: JSON.stringify({ orderId })
            });

            const data = await response.json();
            if (data.success) {
                setRzpData({
                    ...data,
                    orderId
                });
                setShowRazorpayModal(true);
            }
        } catch (error) {
            console.error('Razorpay Init Error:', error);
            showToast.error('Failed to initialize payment');
        }
    }, [verifyPayment]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Securing Connection...</Text>
            </View>
        );
    }

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.03; // 3% GST
    const total = subtotal + tax;

    const selectedAddrObj = addresses.find(a => a._id === selectedAddress);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-gray-100 shadow-sm z-10">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-lg font-black text-gray-900 uppercase tracking-wide">Checkout</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="lock-closed" size={10} color="#10b981" />
                            <Text className="text-green-600 text-[10px] font-bold ml-1 uppercase tracking-wider">100% Secure</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
            >
                {/* 1. Delivery Section */}
                <View className="mb-8">
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Delivery Location</Text>
                    {selectedAddrObj ? (
                        <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 bg-orange-50 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="location" size={16} color="#f97316" />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-black text-gray-900">{selectedAddrObj.fullName}</Text>
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase">{selectedAddrObj.type || 'Home'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowAddressList(!showAddressList)}
                                    className="bg-gray-50 px-3 py-1.5 rounded-lg"
                                >
                                    <Text className="text-primary-600 text-[10px] font-bold uppercase">Change</Text>
                                </TouchableOpacity>
                            </View>
                            <Text className="text-gray-500 text-xs leading-5 ml-11">{selectedAddrObj.addressLine1}, {selectedAddrObj.city}, {selectedAddrObj.state} - {selectedAddrObj.pincode}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push('/addresses')}
                            className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center"
                        >
                            <Ionicons name="add-circle-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-900 font-bold mt-2">Add Delivery Address</Text>
                        </TouchableOpacity>
                    )}

                    {/* Simple Address List Toggle */}
                    {showAddressList && (
                        <View className="mt-4 space-y-3">
                            {addresses.map((addr) => (
                                <TouchableOpacity
                                    key={addr._id}
                                    onPress={() => { setSelectedAddress(addr._id); setShowAddressList(false); }}
                                    className={`p-4 rounded-2xl border ${selectedAddress === addr._id ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-100'}`}
                                >
                                    <Text className="font-bold text-gray-900">{addr.fullName}</Text>
                                    <Text className="text-gray-500 text-xs">{addr.city}, {addr.pincode}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => router.push('/addresses')}
                                className="p-4 rounded-2xl border border-dashed border-primary-300 bg-primary-50 items-center"
                            >
                                <Text className="font-bold text-primary-600">+ Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 2. Items Review */}
                <View className="mb-8">
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Vault Selection</Text>
                    {isDirectBuy && directProduct ? (
                        <View className="bg-white p-4 rounded-3xl border border-gray-100 flex-row items-center shadow-sm">
                            <Image source={{ uri: directProduct.images?.[0] }} className="w-16 h-16 rounded-xl bg-gray-50" />
                            <View className="flex-1 ml-4">
                                <Text className="font-bold text-gray-900" numberOfLines={1}>{directProduct.name}</Text>
                                <Text className="text-gray-500 text-xs mt-1">Qty: {directQuantity}</Text>
                            </View>
                            <Text className="font-black text-gray-900">₹{(directProduct.price || 0).toLocaleString()}</Text>
                        </View>
                    ) : (
                        <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-sm font-bold text-gray-900">{checkoutItems.length} Items</Text>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text className="text-[10px] font-bold text-primary-600 uppercase">Edit Cart</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {checkoutItems.map((item) => (
                                    <View key={item._id} className="mr-4 w-16 relative">
                                        <Image source={{ uri: item.product?.images?.[0] }} className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100" />
                                        <View className="absolute -top-1 -right-1 bg-gray-900 w-5 h-5 rounded-full items-center justify-center border border-white">
                                            <Text className="text-white text-[9px] font-bold">{item.quantity}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* 3. Payment Method */}
                <View className="mb-8">
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payment Method</Text>
                    <View className="space-y-3">
                        {[
                            { id: 'ONLINE', icon: 'card', name: 'Secure Online Payment', desc: 'UPI, Credit/Debit Cards, NetBanking' },
                            { id: 'COD', icon: 'cash', name: 'Cash on Delivery', desc: 'Pay securely at your doorstep' },
                            // { id: 'WALLET', icon: 'wallet', name: 'Gold Wallet', desc: 'Pay using your digital gold balance' } // Disabled for now if needed, or keep
                        ].map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                onPress={() => setPaymentMethod(method.id as any)}
                                activeOpacity={0.9}
                                className={`flex-row items-center p-5 rounded-3xl border-2 ${paymentMethod === method.id ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-100'}`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${paymentMethod === method.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    <Ionicons name={method.icon as any} size={20} color={paymentMethod === method.id ? 'white' : '#6b7280'} />
                                </View>
                                <View className="flex-1">
                                    <Text className={`font-bold text-sm ${paymentMethod === method.id ? 'text-white' : 'text-gray-900'}`}>{method.name}</Text>
                                    <Text className={`text-[10px] mt-0.5 ${paymentMethod === method.id ? 'text-gray-400' : 'text-gray-500'}`}>{method.desc}</Text>
                                </View>
                                {paymentMethod === method.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 4. Pricing Breakdown */}
                <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <View className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />
                    <View className="space-y-3 relative z-10">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-sm">Vault Subtotal</Text>
                            <Text className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-sm">GST (3%)</Text>
                            <Text className="text-gray-900 font-bold">₹{tax.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 text-sm">Shipping</Text>
                            <View className="bg-green-100 px-2 py-0.5 rounded">
                                <Text className="text-green-700 text-[10px] font-black uppercase">Free & Insured</Text>
                            </View>
                        </View>
                        <View className="h-[1px] bg-gray-100 my-2" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-black text-gray-900">Total Payable</Text>
                            <Text className="text-2xl font-black text-primary-600">₹{total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer Trust */}
                <View className="mt-8 flex-row justify-center items-center opacity-60">
                    <Ionicons name="shield-checkmark" size={14} color="#6b7280" />
                    <Text className="text-[10px] font-medium text-gray-500 ml-1">Payments are 256-bit Encrypted & Secure</Text>
                </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={placingOrder || !selectedAddress}
                    className={`h-16 rounded-2xl flex-row items-center justify-center ${placingOrder || !selectedAddress ? 'bg-gray-200' : 'bg-primary-600 shadow-lg shadow-primary-200'}`}
                >
                    {placingOrder ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="lock-closed" size={18} color="white" className="mr-2" />
                            <Text className="text-white font-black text-base uppercase tracking-wider">Pay ₹{total.toLocaleString()}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <RazorpayModal
                isVisible={showRazorpayModal}
                onClose={() => setShowRazorpayModal(false)}
                onSuccess={(oId, pId) => verifyPayment(rzpData.orderId, oId, pId)}
                amount={rzpData?.amount || 0}
                orderId={rzpData?.order_id || ''}
            />
        </SafeAreaView>
    );
}
