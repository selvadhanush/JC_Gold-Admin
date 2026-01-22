import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle | ViewStyle[];
}

export const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.sequence([
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
        ]);

        Animated.loop(pulse).start();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    backgroundColor: '#E1E9EE',
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const DashboardSkeleton = () => (
    <View className="p-6 space-y-6">
        {/* Hero Section Skeleton */}
        <View className="bg-gray-100 rounded-[32px] p-6 h-48 w-full">
            <Skeleton width="40%" height={20} borderRadius={10} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={30} borderRadius={10} style={{ marginBottom: 24 }} />
            <View className="flex-row">
                <Skeleton width="30%" height={40} borderRadius={10} style={{ marginRight: 24 }} />
                <Skeleton width="30%" height={40} borderRadius={10} />
            </View>
        </View>

        {/* Health Widget Skeleton */}
        <View className="bg-gray-50 rounded-[28px] p-5 flex-row items-center border border-gray-100">
            <Skeleton width={56} height={56} borderRadius={16} style={{ marginRight: 16 }} />
            <View className="flex-1">
                <Skeleton width="60%" height={20} borderRadius={10} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={14} borderRadius={10} />
            </View>
        </View>

        {/* Quick Access Grid Skeleton */}
        <View className="flex-row flex-wrap justify-between mt-6">
            <View className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4" style={{ width: '47%' }}>
                <Skeleton width={48} height={48} borderRadius={16} style={{ marginBottom: 16 }} />
                <Skeleton width="80%" height={18} borderRadius={10} style={{ marginBottom: 8 }} />
                <Skeleton width="50%" height={12} borderRadius={10} />
            </View>
            <View className="bg-white border border-gray-100 rounded-[32px] p-6 mb-4" style={{ width: '47%' }}>
                <Skeleton width={48} height={48} borderRadius={16} style={{ marginBottom: 16 }} />
                <Skeleton width="80%" height={18} borderRadius={10} style={{ marginBottom: 8 }} />
                <Skeleton width="50%" height={12} borderRadius={10} />
            </View>
        </View>
    </View>
);

export const ProductListSkeleton = () => (
    <View className="p-6 space-y-5">
        {[1, 2, 3, 4].map((i) => (
            <View key={i} className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm flex-row items-start">
                <Skeleton width={96} height={96} borderRadius={24} />
                <View className="flex-1 ml-5">
                    <View className="flex-row justify-between mb-2">
                        <Skeleton width="60%" height={20} borderRadius={10} />
                        <Skeleton width="20%" height={16} borderRadius={8} />
                    </View>
                    <Skeleton width="40%" height={12} borderRadius={6} style={{ marginBottom: 16 }} />
                    <View className="flex-row justify-between items-end mt-2">
                        <View>
                            <Skeleton width={60} height={10} borderRadius={5} style={{ marginBottom: 4 }} />
                            <Skeleton width={80} height={20} borderRadius={10} />
                        </View>
                        <View className="items-end">
                            <Skeleton width={60} height={10} borderRadius={5} style={{ marginBottom: 4 }} />
                            <Skeleton width={70} height={14} borderRadius={7} />
                        </View>
                    </View>
                </View>
            </View>
        ))}
    </View>
);

export const CategoryListSkeleton = () => (
    <View className="p-6 space-y-5">
        {[1, 2, 3, 4].map((i) => (
            <View key={i} className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm flex-row items-center">
                <Skeleton width={80} height={80} borderRadius={24} />
                <View className="flex-1 ml-5">
                    <View className="flex-row justify-between mb-2">
                        <Skeleton width="50%" height={22} borderRadius={10} />
                        <Skeleton width="15%" height={16} borderRadius={8} />
                    </View>
                    <Skeleton width="40%" height={12} borderRadius={6} style={{ marginBottom: 10 }} />
                    <Skeleton width="80%" height={10} borderRadius={5} />
                </View>
            </View>
        ))}
    </View>
);

export const InventoryListSkeleton = () => (
    <View className="p-6 space-y-5">
        <View className="flex-row gap-x-5 mb-2">
            <Skeleton width="47%" height={80} borderRadius={20} />
            <Skeleton width="47%" height={80} borderRadius={20} />
        </View>
        {[1, 2, 3, 4].map((i) => (
            <View key={i} className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm flex-row items-center">
                <Skeleton width={64} height={64} borderRadius={20} />
                <View className="flex-1 ml-4">
                    <Skeleton width="70%" height={18} borderRadius={10} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
                    <View className="flex-row items-center">
                        <Skeleton width="80%" height={8} borderRadius={4} style={{ marginRight: 12 }} />
                        <Skeleton width={24} height={16} borderRadius={8} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);
