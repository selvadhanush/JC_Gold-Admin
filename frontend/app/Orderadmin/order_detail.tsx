import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    Animated,
    StatusBar,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, getAuthHeaders } from '../../api';
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Skeleton from '../../components/Skeleton';
import { showToast } from '../../utils/toast';

interface Order {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
        phone?: string;
    };
    orderItems: any[];
    totalAmount: number;
    taxAmount: number;
    shippingAmount: number;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        phoneNumber: string;
    };
    isFinanceConfirmed?: boolean;
    isPriority?: boolean;
}

export default function AdminOrderDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [adminReply, setAdminReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [replying, setReplying] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (id) {
            fetchOrder();
            fetchTickets();
        }
    }, [id]);

    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading]);

    const fetchOrder = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders/${id}`, { headers });
            const data = await response.json();
            if (data.success) {
                setOrder(data.data);
            }
        } catch (error) {
            console.error('Fetch Order Error:', error);
            showToast.error('We encountered a problem loading the order details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/support/admin?orderId=${id}`, { headers });
            const data = await response.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error('Fetch Tickets Error:', error);
        }
    };

    const handleReplySubmit = async () => {
        if (!adminReply.trim() || !selectedTicket) return;

        setReplying(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/support/admin/${selectedTicket._id}`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminResponse: adminReply,
                    status: 'RESOLVED',
                }),
            });

            const data = await response.json();

            if (data.success) {
                showToast.success('Reply sent successfully and ticket marked as resolved.');
                setShowTicketModal(false);
                setSelectedTicket(null);
                setAdminReply('');
                fetchTickets();
            } else {
                showToast.error(data.message || 'Failed to send reply.');
            }
        } catch (error) {
            console.error('Reply Error:', error);
            showToast.error('An unexpected error occurred while sending the reply.');
        } finally {
            setReplying(false);
        }
    };

    const updateOrderStatus = async (newStatus: string) => {
        try {
            setUpdating(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                showToast.success(`The order status has been updated to ${newStatus}.`);
                fetchOrder();
                setShowStatusModal(false);
            } else {
                showToast.error(data.message || 'Failed to update order status.');
            }
        } catch (error) {
            console.error('Update Status Error:', error);
            showToast.error('An unexpected error occurred while updating the status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRequestPriority = async () => {
        try {
            setUpdating(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/orders/${id}/priority`, {
                method: 'PATCH',
                headers,
            });

            const data = await response.json();

            if (data.success) {
                showToast.success('Priority request (Verify Fast) has been sent to Finance.');
                fetchOrder();
            } else {
                showToast.error(data.message || 'Failed to send priority request.');
            }
        } catch (error) {
            console.error('Priority Request Error:', error);
            showToast.error('An unexpected error occurred.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        Alert.alert(
            '⚠️ Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            [
                { text: 'No, Keep Order', style: 'cancel' },
                {
                    text: 'Yes, Cancel Order',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/orders/${id}/cancel`, {
                                method: 'PATCH',
                                headers,
                            });

                            const data = await response.json();

                            if (data.success) {
                                showToast.success('This order has been cancelled successfully.');
                                fetchOrder();
                            } else {
                                showToast.error(data.message || 'Failed to cancel this order.');
                            }
                        } catch (error) {
                            console.error('Cancel Order Error:', error);
                            showToast.error('An unexpected error occurred while cancelling the order.');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const handlePrintBill = async () => {
        if (!order) return;
        setPrinting(true);

        try {
            const html = `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
                            .header { text-align: center; margin-bottom: 50px; border-bottom: 3px solid #000; padding-bottom: 30px; }
                            .logo { font-size: 32px; font-weight: 900; color: #000; letter-spacing: 4px; text-transform: uppercase; }
                            .invoice-title { font-size: 18px; color: #666; margin-top: 10px; letter-spacing: 2px; text-transform: uppercase; }
                            .info-section { display: flex; justify-content: space-between; margin-bottom: 60px; }
                            .info-box h3 { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 12px; font-weight: 900; }
                            .info-box p { margin: 4px 0; font-size: 15px; font-weight: 500; line-height: 1.4; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
                            th { background-color: #f9fafb; text-align: left; padding: 16px; border-bottom: 2px solid #111; font-size: 13px; text-transform: uppercase; color: #111; font-weight: 900; }
                            td { padding: 16px; border-bottom: 1px solid #eee; font-size: 15px; }
                            .totals-section { display: flex; justify-content: flex-end; }
                            .totals-box { width: 300px; }
                            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
                            .total-row.grand-total { border-top: 2px solid #000; margin-top: 15px; padding-top: 15px; font-weight: 900; font-size: 20px; color: #000; }
                            .footer { margin-top: 120px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="logo">JC GOLD & DIAMONDS</div>
                            <div class="invoice-title">Official Delivery Bill</div>
                        </div>
                        
                        <div class="info-section">
                            <div class="info-box" style="width: 45%;">
                                <h3>Customer Details</h3>
                                <p><strong>${order.user?.name || 'Customer'}</strong></p>
                                <p>${order.user?.email || ''}</p>
                                <p>${order.shippingAddress?.phoneNumber || ''}</p>
                                <p>${order.shippingAddress?.street || ''}</p>
                                <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}</p>
                            </div>
                            <div class="info-box" style="text-align: right; width: 45%;">
                                <h3>Order Information</h3>
                                <p>Order ID: <strong>#${order.orderNumber}</strong></p>
                                <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
                                <p>Status: <span style="text-transform: uppercase; font-weight: bold;">${order.orderStatus}</span></p>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50%;">Item Description</th>
                                    <th style="text-align: center; width: 15%;">Qty</th>
                                    <th style="text-align: right; width: 15%;">Price</th>
                                    <th style="text-align: right; width: 20%;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(order.orderItems || []).map(item => `
                                    <tr>
                                        <td>${item.product?.name || 'Diamond/Gold Product'}</td>
                                        <td style="text-align: center;">${item.quantity}</td>
                                        <td style="text-align: right;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                                        <td style="text-align: right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="totals-section">
                            <div class="totals-box">
                                <div class="total-row">
                                    <span style="color: #666;">Subtotal</span>
                                    <span>₹${(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="total-row">
                                    <span style="color: #666;">Tax (GST)</span>
                                    <span>₹${(order.taxAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="total-row">
                                    <span style="color: #666;">Shipping</span>
                                    <span>₹${(order.shippingAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>Grand Total</span>
                                    <span>₹${((order.totalAmount || 0) + (order.taxAmount || 0) + (order.shippingAmount || 0)).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <p>Certified Authenticity - Computer Generated Document</p>
                            <p>Thank you for choosing JC Gold & Diamonds. We value your trust.</p>
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Print Error:', error);
            showToast.error('We were unable to generate the delivery bill.');
        } finally {
            setPrinting(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            PENDING: {
                color: '#eab308',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-700',
                icon: 'time',
                gradient: ['#fef3c7', '#fde68a'],
            },
            CONFIRMED: {
                color: '#22c55e',
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                icon: 'checkmark-circle',
                gradient: ['#dcfce7', '#bbf7d0'],
            },
            PACKED: {
                color: '#a855f7',
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-700',
                icon: 'cube',
                gradient: ['#f3e8ff', '#e9d5ff'],
            },
            SHIPPED: {
                color: '#3b82f6',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
                icon: 'airplane',
                gradient: ['#dbeafe', '#bfdbfe'],
            },
            DELIVERED: {
                color: '#14b8a6',
                bg: 'bg-teal-50',
                border: 'border-teal-200',
                text: 'text-teal-700',
                icon: 'checkmark-done-circle',
                gradient: ['#ccfbf1', '#99f6e4'],
            },
            CANCELLED: {
                color: '#ef4444',
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                icon: 'close-circle',
                gradient: ['#fee2e2', '#fecaca'],
            },
        };
        return configs[status] || configs.PENDING;
    };

    const getNextStatus = (currentStatus: string) => {
        const statusFlow: Record<string, string> = {
            PENDING: 'CONFIRMED',
            CONFIRMED: 'PACKED',
            PACKED: 'SHIPPED',
            SHIPPED: 'DELIVERED',
        };
        return statusFlow[currentStatus];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />

                {/* Skeleton Header */}
                <View className="px-6 pt-12 pb-4 border-b border-gray-100 bg-white">
                    <View className="flex-row items-center justify-between">
                        <Skeleton width={44} height={44} />
                        <View className="items-center">
                            <Skeleton width={80} height={12} className="mb-2" />
                            <Skeleton width={120} height={20} />
                        </View>
                        <Skeleton width={44} height={44} />
                    </View>
                </View>

                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    {/* Hero Status Skeleton */}
                    <View className="bg-white rounded-[32px] p-8 mb-6 border border-gray-100">
                        <View className="items-center mb-6">
                            <Skeleton width={80} height={80} className="rounded-[28px] mb-4" />
                            <Skeleton width={120} height={24} className="rounded-full" />
                        </View>
                        <View className="items-center border-t border-gray-100 pt-6">
                            <Skeleton width={100} height={12} className="mb-2" />
                            <Skeleton width={180} height={40} />
                            <Skeleton width={150} height={16} className="mt-2" />
                        </View>
                    </View>

                    {/* Timeline Skeleton */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100">
                        <Skeleton width={100} height={12} className="mb-6" />
                        <View className="flex-row items-center justify-between">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <View key={i} className="items-center">
                                    <Skeleton width={40} height={40} className="rounded-full" />
                                    <Skeleton width={40} height={8} className="mt-2" />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Customer Info Skeleton */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100">
                        <Skeleton width={120} height={12} className="mb-4" />
                        <View className="flex-row items-center mb-4">
                            <Skeleton width={48} height={48} className="rounded-2xl mr-4" />
                            <View className="flex-1">
                                <Skeleton width={140} height={18} className="mb-2" />
                                <Skeleton width={100} height={14} />
                            </View>
                        </View>
                        <Skeleton width="100%" height={80} className="rounded-2xl" />
                    </View>

                    {/* Address Skeleton */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100">
                        <Skeleton width={120} height={12} className="mb-4" />
                        <View className="flex-row">
                            <Skeleton width={48} height={48} className="rounded-2xl mr-4" />
                            <View className="flex-1">
                                <Skeleton width="100%" height={16} className="mb-2" />
                                <Skeleton width="80%" height={16} className="mb-2" />
                                <Skeleton width="60%" height={16} />
                            </View>
                        </View>
                    </View>

                    <View className="h-20" />
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center p-10">
                    <View className="bg-white rounded-[40px] p-10 items-center shadow-xl">
                        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                            <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900 mb-2">Order Not Found</Text>
                        <Text className="text-gray-500 text-center mb-6">This order doesn't exist or has been removed</Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-blue-600 px-8 py-4 rounded-2xl"
                        >
                            <Text className="text-white font-black">Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = getStatusConfig(order.orderStatus);
    const nextStatus = getNextStatus(order.orderStatus);
    const canProgress = nextStatus && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && order.isFinanceConfirmed;
    const isAwaitingFinance = !order.isFinanceConfirmed && order.orderStatus !== 'CANCELLED';

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header with Glassmorphism */}
            <BlurView intensity={80} tint="light" className="border-b border-gray-100">
                <View className="px-6 pt-12 pb-4">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-11 h-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100"
                        >
                            <Ionicons name="chevron-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View className="flex-1 items-center">
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Details</Text>
                            <Text className="text-base font-black text-black">#{order.orderNumber}</Text>
                        </View>
                        <TouchableOpacity className="w-11 h-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                            <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            <Animated.ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <View className="p-6">
                    {/* Hero Status Card */}
                    <View className="bg-white rounded-[32px] p-8 mb-6 shadow-xl border border-gray-100 overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: statusConfig.color, transform: [{ translateX: 40 }, { translateY: -40 }] }} />

                        <View className="items-center mb-6">
                            <View className={`w-20 h-20 rounded-[28px] items-center justify-center mb-4 ${statusConfig.bg} border-2 ${statusConfig.border}`}>
                                <Ionicons name={statusConfig.icon} size={40} color={statusConfig.color} />
                            </View>
                            <View className={`px-6 py-2.5 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
                                <Text className={`text-sm font-black uppercase tracking-widest ${statusConfig.text}`}>
                                    {order.orderStatus}
                                </Text>
                            </View>
                        </View>

                        <View className="items-center border-t border-gray-100 pt-6">
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Amount</Text>
                            <Text className="text-4xl font-black text-gray-900">₹{order.totalAmount.toFixed(2)}</Text>
                            <Text className="text-gray-500 text-sm font-medium mt-2">{order.paymentMethod} • {order.paymentStatus}</Text>
                        </View>

                        {isAwaitingFinance && (
                            <View className="mt-6 pt-6 border-t border-gray-100 items-center">
                                <View className={`flex-row items-center px-4 py-2 rounded-2xl ${order.isPriority ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                                    <Ionicons name={order.isPriority ? 'flash' : 'time'} size={16} color={order.isPriority ? '#ef4444' : '#f59e0b'} />
                                    <Text className={`ml-2 font-bold text-[11px] ${order.isPriority ? 'text-red-600' : 'text-amber-600'}`}>
                                        {order.isPriority ? 'PRIORITY PROCESSING REQUESTED' : 'AWAITING FINANCE CONFIRMATION'}
                                    </Text>
                                </View>
                                {!order.isPriority && (
                                    <TouchableOpacity
                                        onPress={handleRequestPriority}
                                        disabled={updating}
                                        className="mt-4 flex-row items-center bg-gray-900 px-6 py-3 rounded-2xl"
                                    >
                                        <Ionicons name="speedometer-outline" size={18} color="white" />
                                        <Text className="text-white font-black text-xs ml-2 uppercase tracking-tighter">Verify Fast</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Timeline */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-lg border border-gray-100">
                        <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Order Timeline</Text>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 items-center">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-[10px] font-bold text-gray-500 mt-2">Placed</Text>
                            </View>
                            <View className={`flex-1 h-0.5 ${order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <View className="flex-1 items-center">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-[10px] font-bold text-gray-500 mt-2">Confirmed</Text>
                            </View>
                            <View className={`flex-1 h-0.5 ${order.orderStatus === 'PACKED' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <View className="flex-1 items-center">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${order.orderStatus === 'PACKED' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-[10px] font-bold text-gray-500 mt-2">Packed</Text>
                            </View>
                            <View className={`flex-1 h-0.5 ${order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <View className="flex-1 items-center">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-[10px] font-bold text-gray-500 mt-2">Shipped</Text>
                            </View>
                            <View className={`flex-1 h-0.5 ${order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                            <View className="flex-1 items-center">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${order.orderStatus === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-[10px] font-bold text-gray-500 mt-2">Delivered</Text>
                            </View>
                        </View>
                    </View>

                    {/* Customer Card */}
                    <View className="bg-blue-600 rounded-[32px] p-6 mb-6 shadow-xl overflow-hidden" style={{ backgroundColor: '#2563eb' }}>
                        <View className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full" style={{ transform: [{ translateX: 60 }, { translateY: -60 }] }} />
                        <Text className="text-white/70 text-xs font-black uppercase tracking-widest mb-4">Customer Information</Text>
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                                <Ionicons name="person" size={24} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-black text-lg">{order.user.name}</Text>
                                <Text className="text-white/70 text-sm font-medium">{getTimeAgo(order.createdAt)}</Text>
                            </View>
                        </View>
                        <View className="bg-white/10 rounded-2xl p-4 border border-white/20">
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="mail" size={16} color="white" />
                                <Text className="text-white ml-3 font-medium">{order.user.email}</Text>
                            </View>
                            {order.user.phone && (
                                <View className="flex-row items-center">
                                    <Ionicons name="call" size={16} color="white" />
                                    <Text className="text-white ml-3 font-medium">{order.user.phone}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Shipping Address */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-lg border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</Text>
                            <View className="bg-green-50 px-3 py-1.5 rounded-full">
                                <Text className="text-green-700 text-xs font-black">VERIFIED</Text>
                            </View>
                        </View>
                        <View className="flex-row">
                            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                <Ionicons name="location" size={24} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-black font-bold text-base mb-1">{order.shippingAddress.street}</Text>
                                <Text className="text-gray-600 font-medium">
                                    {order.shippingAddress.city}, {order.shippingAddress.state}
                                </Text>
                                <Text className="text-gray-600 font-medium">{order.shippingAddress.zipCode}</Text>
                                <View className="flex-row items-center mt-3 bg-gray-50 px-3 py-2 rounded-xl self-start">
                                    <Ionicons name="call" size={14} color="#6b7280" />
                                    <Text className="text-gray-700 ml-2 font-bold text-sm">{order.shippingAddress.phoneNumber}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Order Items Summary */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-lg border border-gray-100">
                        <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Order Summary</Text>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center mr-3">
                                    <Ionicons name="cube" size={24} color="#a855f7" />
                                </View>
                                <View>
                                    <Text className="text-black font-black text-xl">{order.orderItems.length}</Text>
                                    <Text className="text-gray-500 text-sm font-medium">Items</Text>
                                </View>
                            </View>
                            <TouchableOpacity className="bg-gray-50 px-4 py-2 rounded-xl">
                                <Text className="text-gray-700 font-bold text-sm">View Items</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="border-t border-gray-100 pt-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600 font-medium">Subtotal</Text>
                                <Text className="text-gray-900 font-bold">₹{(order.totalAmount - (order.taxAmount || 0) - (order.shippingAmount || 0)).toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600 font-medium">Tax</Text>
                                <Text className="text-gray-900 font-bold">₹{(order.taxAmount || 0).toFixed(2)}</Text>
                            </View>
                            <View className="flex-row justify-between mb-4">
                                <Text className="text-gray-600 font-medium">Shipping</Text>
                                <Text className="text-green-600 font-bold">FREE</Text>
                            </View>
                            <View className="h-px bg-gray-200 mb-4" />
                            <View className="flex-row justify-between">
                                <Text className="text-black font-black text-lg">Total</Text>
                                <Text className="text-blue-600 font-black text-xl">₹{order.totalAmount.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Support Tickets Section */}
                    {tickets.length > 0 && (
                        <View className="bg-amber-50 rounded-[32px] p-6 mb-6 shadow-lg border border-amber-100">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-xs font-black text-amber-600 uppercase tracking-widest">Customer Support Tickets</Text>
                                <View className="bg-amber-100 px-3 py-1.5 rounded-full">
                                    <Text className="text-amber-700 text-[10px] font-black">{tickets.length} TICKET{tickets.length > 1 ? 'S' : ''}</Text>
                                </View>
                            </View>

                            <View className="space-y-3">
                                {tickets.map((ticket, index) => (
                                    <View key={ticket._id} className={`bg-white rounded-[24px] p-4 border border-amber-200 ${index !== 0 ? 'mt-3' : ''}`}>
                                        <View className="flex-row justify-between items-start mb-3">
                                            <View className="flex-1">
                                                <Text className="text-amber-900 font-black text-base mb-1">{ticket.subject}</Text>
                                                <Text className="text-amber-600 text-[10px] font-bold uppercase">{ticket.category} ISSUE</Text>
                                            </View>
                                            <View className={`px-2 py-1 rounded-lg ${ticket.status === 'OPEN' ? 'bg-amber-500' : ticket.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                                <Text className="text-[9px] font-black uppercase text-white">{ticket.status}</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedTicket(ticket);
                                                setShowTicketModal(true);
                                            }}
                                            className="bg-amber-600 py-3 rounded-xl items-center flex-row justify-center"
                                        >
                                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="white" />
                                            <Text className="text-white font-black text-xs ml-2 uppercase tracking-tight">View Ticket & Reply</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Timestamps */}
                    <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500 text-sm font-medium">Created</Text>
                            <Text className="text-gray-700 font-bold text-sm">{formatDate(order.createdAt)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500 text-sm font-medium">Last Updated</Text>
                            <Text className="text-gray-700 font-bold text-sm">{formatDate(order.updatedAt)}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                        <View className="space-y-3 mb-6">
                            {canProgress && (
                                <TouchableOpacity
                                    onPress={() => updateOrderStatus(nextStatus)}
                                    disabled={updating}
                                    className="bg-blue-600 rounded-[28px] p-6 flex-row items-center justify-center shadow-xl"
                                    style={{ shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }}
                                >
                                    {updating ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="arrow-forward-circle" size={24} color="white" />
                                            <Text className="text-white font-black text-base ml-3 uppercase tracking-wider">
                                                Mark as {nextStatus}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <View className="flex-row gap-3 pt-4">
                                <TouchableOpacity
                                    onPress={() => setShowStatusModal(true)}
                                    className="flex-1 bg-white border-2 border-gray-200 rounded-[28px] p-5 flex-row items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="swap-horizontal" size={20} color="#374151" />
                                    <Text className="text-gray-700 font-black text-sm ml-2">Change Status</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleCancelOrder}
                                    disabled={updating}
                                    className="flex-1 bg-red-50 border-2 border-red-200 rounded-[28px] p-5 flex-row items-center justify-center"
                                >
                                    <Ionicons name="close-circle" size={20} color="#dc2626" />
                                    <Text className="text-red-600 font-black text-sm ml-2">Cancel</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={handlePrintBill}
                                disabled={printing}
                                className="mt-4 bg-gray-900 rounded-[28px] p-5 flex-row items-center justify-center shadow-lg"
                                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                            >
                                {printing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="document-text" size={20} color="white" />
                                        <Text className="text-white font-black text-sm ml-2 uppercase tracking-widest">Download Delivery Bill</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bottom Padding for Navigation */}
                <View className="h-48" />
            </Animated.ScrollView>

            {/* Premium Status Change Modal */}
            <Modal visible={showStatusModal} transparent animationType="slide">
                <BlurView intensity={90} tint="dark" className="flex-1">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setShowStatusModal(false)}
                        className="flex-1 justify-end"
                    >
                        <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-[40px] shadow-2xl">
                            <View className="p-6 pb-10">
                                <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
                                <View className="flex-row justify-between items-center mb-8">
                                    <View>
                                        <Text className="text-black font-black text-2xl">Change Status</Text>
                                        <Text className="text-gray-500 font-medium mt-1">Select new order status</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowStatusModal(false)}
                                        className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center"
                                    >
                                        <Ionicons name="close" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>

                                <View className="space-y-3">
                                    {['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((status) => {
                                        const config = getStatusConfig(status);
                                        const isCurrent = order.orderStatus === status;
                                        return (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => updateOrderStatus(status)}
                                                disabled={updating || isCurrent}
                                                className={`p-5 rounded-[24px] border-2 flex-row items-center ${isCurrent
                                                    ? `${config.bg} ${config.border}`
                                                    : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCurrent ? config.bg : 'bg-gray-50'}`}>
                                                    <Ionicons name={config.icon} size={24} color={isCurrent ? config.color : '#9ca3af'} />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className={`font-black text-base ${isCurrent ? config.text : 'text-gray-700'}`}>
                                                        {status}
                                                    </Text>
                                                    {isCurrent && (
                                                        <Text className="text-gray-500 text-xs font-medium mt-0.5">Current Status</Text>
                                                    )}
                                                </View>
                                                {isCurrent && (
                                                    <View className={`w-6 h-6 rounded-full items-center justify-center ${config.bg}`}>
                                                        <Ionicons name="checkmark" size={16} color={config.color} />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </BlurView>
            </Modal>

            {/* Ticket Details & Reply Modal */}
            <Modal visible={showTicketModal} transparent animationType="slide">
                <BlurView intensity={90} tint="dark" className="flex-1">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setShowTicketModal(false)}
                        className="flex-1 justify-end"
                    >
                        <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-[40px] shadow-2xl max-h-[85%]">
                            <View className="p-6 pb-10">
                                <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="text-black font-black text-2xl">Support Ticket</Text>
                                        <Text className="text-gray-500 font-medium mt-1">Review and respond</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowTicketModal(false)}
                                        className="w-10 h-10 bg-gray-100 rounded-2xl items-center justify-center"
                                    >
                                        <Ionicons name="close" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {selectedTicket && (
                                        <>
                                            {/* Ticket Header */}
                                            <View className="bg-amber-50 rounded-[28px] p-5 mb-6 border border-amber-100">
                                                <View className="flex-row justify-between items-start mb-3">
                                                    <View className="flex-1">
                                                        <Text className="text-amber-900 font-black text-lg mb-1">{selectedTicket.subject}</Text>
                                                        <Text className="text-amber-600 text-xs font-bold uppercase">{selectedTicket.category} ISSUE</Text>
                                                    </View>
                                                    <View className={`px-3 py-1.5 rounded-lg ${selectedTicket.status === 'OPEN' ? 'bg-amber-500' : selectedTicket.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                                        <Text className="text-[10px] font-black uppercase text-white">{selectedTicket.status}</Text>
                                                    </View>
                                                </View>

                                                {/* Customer Info */}
                                                <View className="bg-white/60 rounded-xl p-3 mb-3">
                                                    <Text className="text-amber-600 text-[9px] font-black uppercase mb-2">Customer</Text>
                                                    <Text className="text-amber-900 font-bold text-sm">{selectedTicket.user?.name}</Text>
                                                    <Text className="text-amber-700 text-xs font-medium">{selectedTicket.user?.email}</Text>
                                                </View>

                                                {/* Customer Message */}
                                                <View className="bg-white/60 rounded-xl p-4">
                                                    <Text className="text-amber-600 text-[9px] font-black uppercase mb-2">Customer Message</Text>
                                                    <Text className="text-amber-900 font-medium leading-relaxed">{selectedTicket.message}</Text>
                                                </View>
                                            </View>

                                            {/* Existing Admin Response (if any) */}
                                            {selectedTicket.adminResponse && (
                                                <View className="bg-green-50 rounded-[28px] p-5 mb-6 border border-green-100">
                                                    <Text className="text-green-600 text-[9px] font-black uppercase mb-2">Your Previous Response</Text>
                                                    <Text className="text-green-900 font-medium leading-relaxed">{selectedTicket.adminResponse}</Text>
                                                    <Text className="text-green-600 text-xs font-medium mt-2">
                                                        Sent on {new Date(selectedTicket.respondedAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Reply Box (only if not resolved) */}
                                            {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                                                <View className="mb-6">
                                                    <Text className="text-gray-900 font-black text-base mb-3">Your Response</Text>
                                                    <View className="bg-gray-50 rounded-[24px] p-4 border border-gray-200 mb-4">
                                                        <TextInput
                                                            placeholder="Type your official response to the customer..."
                                                            value={adminReply}
                                                            onChangeText={setAdminReply}
                                                            multiline
                                                            numberOfLines={6}
                                                            className="text-gray-900 font-medium min-h-[120px]"
                                                            style={{ textAlignVertical: 'top' }}
                                                            placeholderTextColor="#9ca3af"
                                                        />
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={handleReplySubmit}
                                                        disabled={replying || !adminReply.trim()}
                                                        className={`h-14 rounded-[24px] items-center justify-center shadow-lg ${replying || !adminReply.trim() ? 'bg-gray-300' : 'bg-blue-600'}`}
                                                        style={{ shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                                                    >
                                                        {replying ? (
                                                            <ActivityIndicator color="white" />
                                                        ) : (
                                                            <View className="flex-row items-center">
                                                                <Ionicons name="send" size={18} color="white" />
                                                                <Text className="text-white font-black uppercase tracking-widest text-xs ml-2">Send Reply & Resolve</Text>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </BlurView>
            </Modal>
        </View>
    );
}
