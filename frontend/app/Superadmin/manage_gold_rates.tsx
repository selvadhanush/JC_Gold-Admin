import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import { showToast } from '../../utils/toast';

export default function ManageGoldRates() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentRates, setCurrentRates] = useState<any[]>([]);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [selectedMetal, setSelectedMetal] = useState<'GOLD' | 'SILVER'>('GOLD');
    const [selectedPurity, setSelectedPurity] = useState('24K');
    const [newRate, setNewRate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchrates();
    }, []);

    const fetchrates = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_DIGITAL_GOLD_DASHBOARD_RATES, { headers });
            const data = await response.json();
            if (data.success) {
                setCurrentRates(data.data);
            }
        } catch (error) {
            console.error('Error fetching rates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRate = async () => {
        if (!newRate || isNaN(Number(newRate))) {
            showToast.error('Please enter a valid rate');
            return;
        }

        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_GOLD_RATE, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    date: new Date(),
                    metalType: selectedMetal,
                    purity: selectedPurity,
                    ratePerGram: Number(newRate),
                    source: 'MANUAL'
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Rate updated successfully');
                setShowModal(false);
                fetchrates();
                setNewRate('');
            } else {
                showToast.error(data.message || 'Failed to update rate');
            }
        } catch (error) {
            console.error('Update Error:', error);
            showToast.error('Failed to connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    const openUpdateModal = (metal: 'GOLD' | 'SILVER', purity: string, currentRate: number | null) => {
        setSelectedMetal(metal);
        setSelectedPurity(purity);
        setNewRate(currentRate ? currentRate.toString() : '');
        setShowModal(true);
    };

    const getPurities = (metal: 'GOLD' | 'SILVER') => {
        return metal === 'GOLD' ? ['24K', '22K', '18K'] : ['FINE', 'STERLING', 'BRITANNIA'];
    };

    const getRateDisplay = (metal: string, purity: string) => {
        const rateObj = currentRates.find(r => r.metalType === metal && r.purity === purity);
        return {
            rate: rateObj?.rate,
            display: rateObj?.rate ? `₹${rateObj.rate.toLocaleString()}` : 'Not Set'
        };
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
                <View>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Superadmin Control</Text>
                    <Text className="text-2xl font-black text-gray-900">Gold & Silver Rates</Text>
                </View>
                <TouchableOpacity onPress={fetchrates} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <Ionicons name="refresh" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#f97316" className="mt-10" />
                ) : (
                    <>
                        {/* Gold Section */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="diamond" size={16} color="#d97706" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900">Gold Rates</Text>
                            </View>

                            <View className="space-y-4">
                                {['24K', '22K', '18K'].map((purity) => {
                                    const { rate, display } = getRateDisplay('GOLD', purity);
                                    return (
                                        <TouchableOpacity
                                            key={purity}
                                            onPress={() => openUpdateModal('GOLD', purity, rate)}
                                            className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex-row items-center justify-between"
                                        >
                                            <View>
                                                <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Gold {purity}</Text>
                                                <Text className={`text-2xl font-black ${rate ? 'text-gray-900' : 'text-gray-300'}`}>{display}</Text>
                                            </View>
                                            <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center">
                                                <Ionicons name="pencil" size={18} color="#f97316" />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Silver Section */}
                        <View className="mb-32">
                            <View className="flex-row items-center mb-4">
                                <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="sparkles" size={16} color="#4b5563" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900">Silver Rates</Text>
                            </View>

                            <View className="space-y-4">
                                {['FINE', 'STERLING', 'BRITANNIA'].map((purity) => {
                                    const { rate, display } = getRateDisplay('SILVER', purity);
                                    return (
                                        <TouchableOpacity
                                            key={purity}
                                            onPress={() => openUpdateModal('SILVER', purity, rate)}
                                            className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex-row items-center justify-between"
                                        >
                                            <View>
                                                <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Silver {purity}</Text>
                                                <Text className={`text-2xl font-black ${rate ? 'text-gray-900' : 'text-gray-300'}`}>{display}</Text>
                                            </View>
                                            <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center">
                                                <Ionicons name="pencil" size={18} color="#f97316" />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Update Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-[32px] p-6 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-900 font-black text-xl">Update Rate</Text>
                                <Text className="text-gray-500 text-sm font-medium">{selectedMetal} • {selectedPurity}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full">
                                <Ionicons name="close" size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                            <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Rate Per Gram (₹)</Text>
                            <TextInput
                                value={newRate}
                                onChangeText={setNewRate}
                                keyboardType="numeric"
                                className="text-3xl font-black text-gray-900 p-0"
                                placeholder="0"
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdateRate}
                            disabled={submitting}
                            className={`w-full py-4 rounded-2xl items-center ${submitting ? 'bg-gray-300' : 'bg-primary-600'}`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Save Rate</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
