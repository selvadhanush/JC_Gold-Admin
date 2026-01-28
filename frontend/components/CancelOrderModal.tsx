import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface CancelOrderModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    orderNumber?: string;
    isProcessing?: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    visible,
    onClose,
    onConfirm,
    orderNumber,
    isProcessing
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 32,
                        padding: 32,
                        width: '100%',
                        maxWidth: 400,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.15,
                        shadowRadius: 30,
                        elevation: 25,
                    }}
                >
                    {/* Header Aesthetic Line */}
                    <View
                        style={{
                            width: 40,
                            height: 4,
                            backgroundColor: '#ef4444',
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginBottom: 24,
                            opacity: 0.8
                        }}
                    />

                    {/* Content */}
                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: '800',
                            color: '#0f172a',
                            textAlign: 'center',
                            marginBottom: 12,
                            letterSpacing: -0.5,
                        }}
                    >
                        Cancel Order
                    </Text>

                    <Text
                        style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: '#475569',
                            textAlign: 'center',
                            marginBottom: 32,
                            fontWeight: '500',
                        }}
                    >
                        Are you sure you want to cancel order <Text style={{ fontWeight: '700', color: '#0f172a' }}>#{orderNumber}</Text>?{'\n'}
                        This action will trigger an automatic refund request.
                    </Text>

                    {/* Actions */}
                    <View style={{ gap: 12 }}>
                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isProcessing}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: '#0f172a',
                                paddingVertical: 18,
                                borderRadius: 20,
                                alignItems: 'center',
                                shadowColor: '#0f172a',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                                {isProcessing ? 'Processing...' : 'Yes, Cancel Order'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                            style={{
                                paddingVertical: 16,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 15 }}>
                                No, Keep Order
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
