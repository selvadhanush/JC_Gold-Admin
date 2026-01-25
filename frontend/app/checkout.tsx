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
    const [isSimulating, setIsSimulating] = useState(false);

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

    const handleSimulateSuccess = async () => {
        if (!rzpData) return;
        setIsSimulating(true);
        // Artificial delay for realism
        setTimeout(async () => {
            await verifyPayment(rzpData.orderId, rzpData.order_id, 'pay_test_' + Date.now());
            setIsSimulating(false);
            setShowRazorpayModal(false);
        }, 2000);
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

            <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 24 }}
            >
                {/* Delivery Address Section */}
                <View className="mb-10">
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
                                    activeOpacity={0.7}
                                    className={`p-6 rounded-[32px] border-2 shadow-sm ${selectedAddress === addr._id ? 'bg-orange-50/50 border-orange-500 shadow-orange-100' : 'bg-white border-gray-100'}`}
                                >
                                    <View className="flex-row items-center">
                                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${selectedAddress === addr._id ? 'border-orange-600 bg-orange-600' : 'border-gray-200'}`}>
                                            {selectedAddress === addr._id && <View className="w-2 h-2 bg-white rounded-full" />}
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1.5">
                                                <Text className="font-black text-gray-900 text-lg mr-2 uppercase tracking-tight">{addr.fullName}</Text>
                                                {addr.isDefault && (
                                                    <View className="bg-orange-100 px-2.5 py-1 rounded-lg">
                                                        <Text className="text-orange-700 text-[9px] font-black uppercase tracking-widest">Default</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text className="text-gray-500 font-medium leading-5 mb-1" numberOfLines={1}>{addr.addressLine1}</Text>
                                            <Text className="text-gray-400 text-xs font-bold tracking-wider">{addr.city}, {addr.state} - {addr.pincode}</Text>
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

                <View className="mb-10">
                    <Text className="text-xl font-black text-gray-900 mb-5">Items Summary</Text>
                    {isDirectBuy && directProduct ? (
                        <View className="bg-white p-6 rounded-[32px] flex-row items-center border border-gray-100 shadow-sm">
                            <View className="bg-gray-50 p-2 rounded-2xl mr-4">
                                {directProduct.images && directProduct.images.length > 0 ? (
                                    <Image
                                        source={{ uri: directProduct.images[0] }}
                                        className="w-20 h-20 rounded-xl"
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center">
                                        <Ionicons name="image-outline" size={24} color="#d1d5db" />
                                    </View>
                                )}
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
                                <Text className="text-primary-600 font-bold text-lg mt-2">₹{(directProduct.price || 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="space-y-3">
                            {checkoutItems.map((item) => {
                                if (!item.product) return null;
                                return (
                                    <View key={item._id} className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-100">
                                        {item.product.images && item.product.images.length > 0 ? (
                                            <Image
                                                source={{ uri: item.product.images[0] }}
                                                className="w-14 h-14 rounded-lg mr-4"
                                            />
                                        ) : (
                                            <View className="w-14 h-14 rounded-lg mr-4 bg-gray-100 items-center justify-center">
                                                <Ionicons name="image-outline" size={20} color="#d1d5db" />
                                            </View>
                                        )}
                                        <View className="flex-1">
                                            <Text className="font-bold text-gray-900" numberOfLines={1}>{item.product.name}</Text>
                                            <Text className="text-gray-500 text-sm">Qty: {item.quantity}</Text>
                                        </View>
                                        <Text className="font-bold text-primary-600">₹{(item.product.price || 0).toLocaleString()}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View className="mb-10">
                    <Text className="text-xl font-black text-gray-900 mb-5">Payment Method</Text>
                    <View className="flex-row gap-3">
                        {['COD', 'ONLINE', 'WALLET'].map((method) => (
                            <TouchableOpacity
                                key={method}
                                onPress={() => setPaymentMethod(method as any)}
                                className={`flex-1 p-5 rounded-3xl border-2 items-center justify-center ${paymentMethod === method ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-100'}`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${paymentMethod === method ? 'bg-orange-100' : 'bg-gray-50'}`}>
                                    <Ionicons
                                        name={method === 'COD' ? 'cash-outline' : method === 'ONLINE' ? 'card-outline' : 'wallet-outline'}
                                        size={22}
                                        color={paymentMethod === method ? '#f97316' : '#9ca3af'}
                                    />
                                </View>
                                <Text className={`text-xs font-bold ${paymentMethod === method ? 'text-orange-700' : 'text-gray-500'}`}>{method}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Price Details */}
                <View className="bg-white p-8 rounded-[32px] border border-gray-100 mb-32 shadow-sm">
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
            <View className="bg-white px-6 pt-6 pb-12 border-t border-gray-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={placingOrder || !selectedAddress}
                    activeOpacity={0.8}
                    className={`h-16 rounded-[24px] flex-row items-center px-8 ${placingOrder || !selectedAddress ? 'bg-gray-200' : 'bg-primary-600 shadow-xl shadow-primary-200'}`}
                >
                    {placingOrder ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="white" />
                        </View>
                    ) : (
                        <>
                            <View className="flex-1">
                                <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">Confirm & Pay</Text>
                                <Text className="text-white font-black text-xl">₹{total.toLocaleString()}</Text>
                            </View>
                            <View className="bg-white/20 w-10 h-10 rounded-xl items-center justify-center">
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
                {!selectedAddress && !loading && (
                    <View className="flex-row items-center justify-center mt-4">
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text className="text-red-500 ml-2 font-bold text-xs uppercase tracking-wider">Please select a delivery address</Text>
                    </View>
                )}
            </View>

            {/* Razorpay Simulation Modal */}
            <Modal
                transparent={true}
                visible={showRazorpayModal}
                animationType="fade"
                onRequestClose={() => !isSimulating && setShowRazorpayModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="bg-white w-full rounded-[40px] overflow-hidden shadow-2xl">
                        {/* Razorpay Header */}
                        <View className="bg-[#242633] px-8 py-8 flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-[#3399FF] rounded-2xl items-center justify-center mr-4 shadow-lg shadow-blue-500/50">
                                    <Ionicons name="flash" size={22} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white/40 font-black text-[10px] tracking-widest uppercase mb-0.5">Test Environment</Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-black text-xl">Razorpay</Text>
                                        <Text className="text-white/60 font-medium text-xl ml-1">Sim</Text>
                                    </View>
                                </View>
                            </View>
                            {!isSimulating && (
                                <TouchableOpacity
                                    onPress={() => setShowRazorpayModal(false)}
                                    className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center"
                                >
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="p-8">
                            <View className="mb-10 items-center">
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[3px] mb-3">Total Amount Payable</Text>
                                <Text className="text-gray-900 text-5xl font-black italic">
                                    <Text className="text-2xl not-italic mr-1 text-gray-400">₹</Text>
                                    {rzpData ? (rzpData.amount / 100).toLocaleString() : '0'}
                                </Text>
                                <View className="mt-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                    <Text className="text-gray-400 text-[10px] font-bold">ID: {rzpData?.order_id}</Text>
                                </View>
                            </View>

                            <View className="bg-blue-50/50 rounded-[32px] p-6 mb-10 border border-blue-100/50">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-6 h-6 bg-[#3399FF] rounded-full items-center justify-center mr-2">
                                        <Ionicons name="shield-checkmark" size={14} color="white" />
                                    </View>
                                    <Text className="text-[#242633] font-black text-xs uppercase tracking-wider">Trusted Payment Simulation</Text>
                                </View>
                                <Text className="text-gray-500 text-xs leading-5">Confirming this transaction will mark your order as **CONFIRMED** in our system. This is a secure testing environment.</Text>
                            </View>

                            {isSimulating ? (
                                <View className="py-6 items-center">
                                    <ActivityIndicator size="large" color="#3399FF" />
                                    <Text className="text-[#3399FF] font-black text-[10px] uppercase tracking-[4px] mt-6 italic">Authorizing...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center justify-between">
                                    <TouchableOpacity
                                        onPress={() => setShowRazorpayModal(false)}
                                        className="h-14 px-8 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
                                    >
                                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSimulateSuccess}
                                        activeOpacity={0.9}
                                        className="flex-1 h-14 ml-4 bg-[#3399FF] rounded-2xl shadow-lg shadow-blue-500/30 flex-row items-center justify-center px-4"
                                    >
                                        <Text className="text-white font-black uppercase tracking-[1px] text-[11px]">Simulate Success</Text>
                                        <View className="ml-2 bg-white/20 p-1 rounded-lg">
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View className="bg-gray-50 py-6 items-center border-t border-gray-100">
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={10} color="#9ca3af" />
                                <Text className="text-gray-400 text-[9px] font-black uppercase tracking-[3px] ml-2">Secure Test Session</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
