import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'success' | 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

const { width } = Dimensions.get('window');

export default function ConfirmationModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}: ConfirmationModalProps) {
    const getIcon = () => {
        switch (type) {
            case 'success': return { name: 'checkmark-circle', color: '#10b981', bg: 'bg-green-100' };
            case 'danger': return { name: 'alert-circle', color: '#ef4444', bg: 'bg-red-100' };
            case 'warning': return { name: 'warning', color: '#f59e0b', bg: 'bg-amber-100' };
            default: return { name: 'information-circle', color: '#3b82f6', bg: 'bg-blue-100' };
        }
    };

    const iconData = getIcon();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/70 px-6">
                <View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl relative overflow-hidden">
                    {/* Decorative blurred background circle */}
                    <View
                        className={`absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 ${type === 'danger' ? 'bg-red-400' :
                                type === 'success' ? 'bg-green-400' :
                                    type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                            }`}
                        style={{ transform: [{ scale: 1.5 }] }}
                    />

                    <View className={`w-24 h-24 rounded-full ${iconData.bg} items-center justify-center mb-8 shadow-inner`}>
                        <Ionicons name={iconData.name as any} size={48} color={iconData.color} />
                    </View>

                    <Text className="text-2xl font-black text-gray-900 text-center mb-3 uppercase tracking-widest">
                        {title}
                    </Text>

                    <Text className="text-gray-500 text-center mb-10 font-bold text-base leading-6 px-4">
                        {message}
                    </Text>

                    <View className="flex-row w-full gap-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 py-5 rounded-[24px] bg-gray-100 active:bg-gray-200"
                        >
                            <Text className="text-gray-500 font-black text-center uppercase tracking-[2px] text-xs">
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            className={`flex-1 py-5 rounded-[24px] active:opacity-90 shadow-xl ${type === 'danger' ? 'bg-red-500 shadow-red-200' :
                                    type === 'success' ? 'bg-green-500 shadow-green-200' :
                                        'bg-black shadow-gray-400'
                                }`}
                        >
                            <Text className="text-white font-black text-center uppercase tracking-[2px] text-xs">
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
