import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RazorpayModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: (orderId: string, paymentId: string) => void;
    amount: number; // in Paise
    orderId: string;
    businessName?: string;
}

export default function RazorpayModal({
    isVisible,
    onClose,
    onSuccess,
    amount,
    orderId,
    businessName = "JC GOLD & DIAMONDS"
}: RazorpayModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'methods' | 'processing' | 'success'>('methods');
    const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true
            }).start();
            setPaymentStep('methods');
            setIsProcessing(false);
        }
    }, [isVisible]);

    const handleSimulatePayment = () => {
        setPaymentStep('processing');
        setIsProcessing(true);

        // Simulate payment gateway delay
        setTimeout(() => {
            setPaymentStep('success');
            setIsProcessing(false);

            // Short delay to show success state before triggering parent callback
            setTimeout(() => {
                onSuccess(orderId, `pay_sim_${Math.random().toString(36).substring(7).toUpperCase()}`);
            }, 1500);
        }, 2500);
    };

    const PaymentMethod = ({ icon, label, sublabel }: { icon: any, label: string, sublabel: string }) => (
        <TouchableOpacity
            onPress={handleSimulatePayment}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' }}
        >
            <View style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, marginRight: 16 }}>
                <Ionicons name={icon} size={20} color="#3399FF" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>{label}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>{sublabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
        </TouchableOpacity>
    );

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                {/* Backdrop */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
                />

                <Animated.View
                    style={[
                        { transform: [{ translateY: slideAnim }] },
                        { backgroundColor: 'white', borderTopLeftRadius: 48, borderTopRightRadius: 48, overflow: 'hidden' }
                    ]}
                >
                    {/* Header */}
                    <View style={{ backgroundColor: '#242633', paddingHorizontal: 32, paddingTop: 32, paddingBottom: 40 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 40, height: 40, backgroundColor: '#3399FF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                    <Ionicons name="flash" size={20} color="white" />
                                </View>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 2 }}>Test Mode</Text>
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Razorpay <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Simulator</Text></Text>
                                </View>
                            </View>
                            {!isProcessing && (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Ionicons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8 }}>Payable to {businessName}</Text>
                            <Text style={{ color: 'white', fontSize: 48, fontWeight: '900', fontStyle: 'italic' }}>
                                <Text style={{ fontSize: 24, fontStyle: 'normal', color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>₹</Text>
                                {(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={{ padding: 32, paddingBottom: 48, backgroundColor: 'white' }}>
                        {paymentStep === 'methods' ? (
                            <>
                                <View style={{ backgroundColor: 'rgba(240,248,255,0.5)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(220,230,255,0.5)', marginBottom: 32 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 32, height: 32, backgroundColor: '#E0F2FE', borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Ionicons name="shield-checkmark" size={16} color="#3399FF" />
                                        </View>
                                        <Text style={{ color: '#0B5394', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Secure Payment Gateway</Text>
                                    </View>
                                    <Text style={{ color: 'rgba(11,83,148,0.6)', fontSize: 11, lineHeight: 20 }}>This is a secure simulation environment. No actual money will be debited from your account.</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={handleSimulatePayment}
                                    activeOpacity={0.9}
                                    style={{ height: 64, backgroundColor: '#3399FF', borderRadius: 16, shadowColor: '#3399FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
                                >
                                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, marginRight: 12 }}>Pay Now</Text>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{ marginTop: 16, height: 56, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Text style={{ color: '#9CA3AF', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Cancel Transaction</Text>
                                </TouchableOpacity>

                                <View style={{ marginTop: 32, paddingTop: 32, borderTopWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 }}>
                                        <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
                                        <Text style={{ marginLeft: 8, fontSize: 9, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 }}>PCI-DSS Compliant Simulation</Text>
                                    </View>
                                </View>
                            </>
                        ) : paymentStep === 'processing' ? (
                            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#3399FF" />
                                <View style={{ marginTop: 32, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 }}>Processing Payment</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>Please do not press back or close the app while we secure your transaction.</Text>
                                </View>

                                <View style={{ marginTop: 48, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="lock-closed" size={12} color="#10b981" />
                                        <Text style={{ marginLeft: 8, fontSize: 10, fontWeight: '900', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 2 }}>Encrypted</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                                <View style={{ width: 96, height: 96, backgroundColor: '#ECFDF5', borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                                    <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8, fontStyle: 'italic' }}>Payment Successful</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>Transaction completed successfully. Verifying with server...</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
