import { View, Text, TouchableOpacity } from 'react-native';
import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    onPress?: () => void;
    className?: string;
}

export default function Card({
    children,
    title,
    subtitle,
    onPress,
    className = '',
}: CardProps) {
    const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View;
    const containerProps: any = {
        className: `bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${onPress ? 'active:bg-gray-50' : ''
            } ${className}`,
    };

    if (onPress) {
        containerProps.onPress = onPress;
    }

    return (
        <Container {...containerProps}>
            {(title || subtitle) && (
                <View className="mb-4">
                    {title && (
                        <Text className="text-lg font-bold text-gray-800 mb-1">
                            {title}
                        </Text>
                    )}
                    {subtitle && (
                        <Text className="text-sm text-gray-600">
                            {subtitle}
                        </Text>
                    )}
                </View>
            )}
            {children}
        </Container>
    );
}
