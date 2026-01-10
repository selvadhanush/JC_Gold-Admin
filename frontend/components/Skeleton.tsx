import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    variant?: 'box' | 'circle' | 'text';
    style?: ViewStyle;
    className?: string;
}

export default function Skeleton({ width, height, variant = 'box', style, className }: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    const borderRadius = variant === 'circle' ? (typeof height === 'number' ? height / 2 : 999) :
        variant === 'text' ? 4 : 16;

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    backgroundColor: '#E5E7EB',
                    borderRadius,
                    opacity,
                } as any,
                style,
            ]}
            className={className}
        />
    );
}
