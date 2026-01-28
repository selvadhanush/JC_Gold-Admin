import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Linking,
    Platform,
    Share,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';

const FAQS = [
    {
        question: "How do I track my order?",
        answer: "You can track your order by going to 'Profile' > 'My Orders' and selecting the specific order you want to track."
    },
    {
        question: "What is the return policy?",
        answer: "We offer a 7-day return policy for most items. The item must be in its original packaging and unused."
    },
    {
        question: "How long does KYC verification take?",
        answer: "KYC verification typically takes 24-48 hours. You will receive a notification once your documents are reviewed."
    },
    {
        question: "Is my payment secure?",
        answer: "Yes, we use industry-standard encryption and secure payment gateways to ensure your transactions are 100% safe."
    }
];

export default function Support() {
    const router = useRouter();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleContact = (type: 'whatsapp' | 'call' | 'email') => {
        let url = '';
        switch (type) {
            case 'whatsapp':
                url = 'whatsapp://send?phone=+918220158988&text=Hi, I need help with JC Gold';
                break;
            case 'call':
                url = 'tel:+918220158988';
                break;
            case 'email':
                url = 'mailto:sanjaipandian.as@gmail.com?subject=Support Inquiry';
                break;
        }

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                alert("This action is not supported on your device");
            }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{
                headerShown: false,
            }} />

            <View className="px-6 py-5 flex-row items-center justify-between border-b border-gray-50">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50">
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-gray-900">Help & Support</Text>
                <View className="w-10" />
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-10 items-center">
                    <View className="w-24 h-24 bg-orange-50 rounded-[40px] items-center justify-center mb-6 shadow-sm">
                        <Ionicons name="chatbubble-ellipses" size={48} color="#ea580c" />
                    </View>
                    <Text className="text-3xl font-black text-gray-900 text-center">Hello, how can we help?</Text>
                    <Text className="text-gray-400 font-medium text-center mt-3 px-4 leading-6">Select a contact method below or browse our FAQs to get started.</Text>
                </View>

                {/* Quick Contact Grid */}
                <View className="flex-row justify-between mb-12">
                    <TouchableOpacity
                        onPress={() => handleContact('whatsapp')}
                        className="w-[30%] bg-white py-6 rounded-[32px] items-center border border-gray-100 shadow-sm"
                    >
                        <View className="w-12 h-12 bg-green-50 rounded-2xl items-center justify-center mb-3">
                            <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
                        </View>
                        <Text className="font-bold text-[10px] text-gray-900 uppercase tracking-widest">WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleContact('call')}
                        className="w-[30%] bg-white py-6 rounded-[32px] items-center border border-gray-100 shadow-sm"
                    >
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
                            <Ionicons name="call" size={24} color="#2563eb" />
                        </View>
                        <Text className="font-bold text-[10px] text-gray-900 uppercase tracking-widest">Call Us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleContact('email')}
                        className="w-[30%] bg-white py-6 rounded-[32px] items-center border border-gray-100 shadow-sm"
                    >
                        <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center mb-3">
                            <Ionicons name="mail" size={24} color="#ea580c" />
                        </View>
                        <Text className="font-bold text-[10px] text-gray-900 uppercase tracking-widest">Email</Text>
                    </TouchableOpacity>
                </View>

                {/* Action Cards */}
                <View className="mb-14">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-6 px-2">Support Tickets</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/buyer_general_tickets')}
                        className="bg-orange-500 p-8 rounded-[36px] shadow-2xl shadow-orange-500/40 flex-row items-center justify-between mb-6"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mr-5">
                                <Ionicons name="chatbubbles" size={28} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-black text-xl">General Enquiry</Text>
                                <Text className="text-white/80 text-sm font-medium">Talk to Super Admin directly</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/buyer_tickets')}
                        className="bg-gray-900 p-8 rounded-[36px] flex-row items-center justify-between shadow-xl shadow-black/10"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center mr-5">
                                <Ionicons name="ticket" size={28} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-black text-xl">Order Support</Text>
                                <Text className="text-white/60 text-sm font-medium">Track your product/payment tickets</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="mb-14">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] mb-8 px-2">Frequently Asked Questions</Text>
                    <View className="space-y-4">
                        {FAQS.map((faq, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="bg-white rounded-[28px] border border-gray-100 overflow-hidden"
                            >
                                <View className="p-6 flex-row items-center justify-between">
                                    <Text className="flex-1 font-bold text-gray-800 pr-4 text-[15px]">{faq.question}</Text>
                                    <View className={`w-8 h-8 items-center justify-center rounded-full ${expandedFaq === index ? 'bg-orange-50' : 'bg-gray-50'}`}>
                                        <Ionicons
                                            name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color={expandedFaq === index ? "#ea580c" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>
                                {expandedFaq === index && (
                                    <View className="px-6 pb-6 pt-2">
                                        <View className="h-[1px] bg-gray-50 mb-4" />
                                        <Text className="text-gray-500 leading-6 font-medium text-sm">{faq.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


                <View className="mb-10">
                    <Text className="text-xl font-black text-gray-900 mb-6">Frequently Asked Questions</Text>
                    <View className="space-y-4">
                        {FAQS.map((faq, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="bg-white rounded-[24px] border border-gray-100 overflow-hidden"
                            >
                                <View className="p-5 flex-row items-center justify-between">
                                    <Text className="flex-1 font-bold text-gray-800 pr-4">{faq.question}</Text>
                                    <Ionicons
                                        name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </View>
                                {expandedFaq === index && (
                                    <View className="px-5 pb-5 border-t border-gray-50 pt-4">
                                        <Text className="text-gray-500 leading-6 font-medium">{faq.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
