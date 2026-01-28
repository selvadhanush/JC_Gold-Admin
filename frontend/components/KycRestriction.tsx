import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface KycRestrictionProps {
    title?: string;
    message?: string;
    buttonTitle?: string;
}

export default function KycRestriction({
    title = "KYC Verification Required",
    message = "To ensure the security of your account and follow government regulations, we require you to verify your identity before making purchases.",
    buttonTitle = "Verify Identity Now"
}: KycRestrictionProps) {
    const router = useRouter();

    return (
        <View className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 mb-6">
            <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center">
                    <Ionicons name="shield-checkmark" size={24} color="#ea580c" />
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-gray-900 font-black text-lg">{title}</Text>
                    <Text className="text-orange-600 font-black text-[10px] uppercase tracking-widest mt-0.5">Account Security</Text>
                </View>
            </View>

            <Text className="text-gray-600 text-sm leading-6 mb-6 font-medium">
                {message}
            </Text>

            <TouchableOpacity
                onPress={() => router.push('/kyc_verification')}
                className="bg-orange-600 h-16 rounded-[24px] items-center justify-center mb-4"
            >
                <View className="flex-row items-center">
                    <Text className="text-white font-black uppercase tracking-widest mr-2">{buttonTitle}</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center">
                <Ionicons name="time-outline" size={14} color="#9a3412" />
                <Text className="text-orange-900/60 text-[11px] font-bold ml-2 italic">Verification usually takes 2-3 business days</Text>
            </View>
        </View>
    );
}
