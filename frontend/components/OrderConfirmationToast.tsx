import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface OrderConfirmationToastProps {
    visible: boolean;
    onHide: () => void;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
}

export const OrderConfirmationToast: React.FC<OrderConfirmationToastProps> = ({
    visible,
    onHide,
    title = 'Order Confirmed',
    message = 'Order has been verified successfully',
    type = 'success'
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            checkmarkScale.setValue(0);
            opacityAnim.setValue(0);

            // Start animations
            Animated.sequence([
                // Fade in background
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                // Scale in the card
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                // Pop in the checkmark
                Animated.spring(checkmarkScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after 2.5 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    accentColor: '#f59e0b', // Refined gold value
                    titleColor: '#0f172a', // Slate 900
                    messageColor: '#475569', // Slate 600
                    bgColor: '#ffffff',
                };
            case 'error':
                return {
                    accentColor: '#ef4444',
                    titleColor: '#0f172a',
                    messageColor: '#475569',
                    bgColor: '#ffffff',
                };
            case 'info':
                return {
                    accentColor: '#3b82f6',
                    titleColor: '#0f172a',
                    messageColor: '#475569',
                    bgColor: '#ffffff',
                };
            default:
                return {
                    accentColor: '#f59e0b',
                    titleColor: '#0f172a',
                    messageColor: '#475569',
                    bgColor: '#ffffff',
                };
        }
    };

    const config = getConfig();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={hideToast}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                        width: 'auto',
                        minWidth: 260,
                        maxWidth: width * 0.85,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: config.bgColor,
                            borderRadius: 24,
                            paddingVertical: 24,
                            paddingHorizontal: 32,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.1,
                            shadowRadius: 24,
                            elevation: 10,
                            borderWidth: 1,
                            borderColor: '#f1f5f9', // Slate 100
                        }}
                    >
                        {/* Minimalist Top Indicator */}
                        <View
                            style={{
                                width: 32,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: config.accentColor,
                                opacity: 0.8,
                                marginBottom: 20
                            }}
                        />

                        {/* Text Content Only - No Icons */}
                        <View style={{ alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: '800',
                                    color: config.titleColor,
                                    marginBottom: 6,
                                    textAlign: 'center',
                                    letterSpacing: -0.2,
                                }}
                            >
                                {title}
                            </Text>

                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: '500',
                                    color: config.messageColor,
                                    textAlign: 'center',
                                    lineHeight: 20,
                                    opacity: 0.9,
                                }}
                            >
                                {message}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
