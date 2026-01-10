import { View, Text, TextInput, TextInputProps } from 'react-native';
import React from 'react';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: string;
    containerClassName?: string;
}

export default function Input({
    label,
    error,
    icon,
    containerClassName = '',
    className = '',
    ...props
}: InputProps) {
    return (
        <View className={containerClassName}>
            {label && (
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </Text>
            )}
            <View className={`bg-white rounded-xl px-4 py-3 border flex-row items-center ${error ? 'border-red-500' : 'border-gray-200'
                }`}>
                {icon && <Text className="mr-3 text-lg">{icon}</Text>}
                <TextInput
                    className={`flex-1 text-base text-gray-800 ${className}`}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />
            </View>
            {error && (
                <Text className="text-sm text-red-500 mt-1">
                    {error}
                </Text>
            )}
        </View>
    );
}
