import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders, BASE_URL } from '../../api';

interface Scheme {
    _id: string;
    name: string;
    description: string;
    durationMonths: number;
    minMonthlyAmount: number;
    benefitPercentage?: number;
    isActive: boolean;
    enrollmentCount?: number;
}

export default function SchemesManagement() {
    const router = useRouter();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
    const [newScheme, setNewScheme] = useState({
        name: '',
        description: '',
        durationMonths: '',
        minMonthlyAmount: '',
        benefitPercentage: '0',
    });

    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/schemes`, { headers });

            if (!response.ok) {
                throw new Error(`Failed to fetch schemes: ${response.status}`);
            }

            const data = await response.json();
            console.log('Schemes API Response:', JSON.stringify(data, null, 2));

            if (data.success) {
                const schemes = data.data || [];
                console.log('First scheme data:', schemes[0]);
                setSchemes(schemes);
            } else {
                console.error('Failed to fetch schemes:', data.message);
                setSchemes([]);
            }
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
            setSchemes([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchemes();
    };

    const handleCreateScheme = async () => {
        if (!newScheme.name || !newScheme.description || !newScheme.durationMonths || !newScheme.minMonthlyAmount) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/schemes`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: newScheme.name,
                    description: newScheme.description,
                    durationMonths: parseInt(newScheme.durationMonths),
                    minMonthlyAmount: parseFloat(newScheme.minMonthlyAmount),
                    benefitPercentage: parseFloat(newScheme.benefitPercentage),
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert('Success', 'Scheme created successfully');
                setShowCreateModal(false);
                setNewScheme({
                    name: '',
                    description: '',
                    durationMonths: '',
                    minMonthlyAmount: '',
                    benefitPercentage: '0',
                });
                fetchSchemes();
            } else {
                Alert.alert('Error', data.message || 'Failed to create scheme');
            }
        } catch (error) {
            console.error('Create Scheme Error:', error);
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleEditScheme = async () => {
        if (!editingScheme || !editingScheme.name || !editingScheme.description || !editingScheme.durationMonths || !editingScheme.minMonthlyAmount) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const authHeaders = await getAuthHeaders();

            console.log('Editing Scheme ID:', editingScheme._id);
            console.log('Request URL:', `${BASE_URL}/api/v1/schemes/${editingScheme._id}`);

            const response = await fetch(`${BASE_URL}/api/v1/schemes/${editingScheme._id}`, {
                method: 'PUT',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingScheme.name,
                    description: editingScheme.description,
                    durationMonths: editingScheme.durationMonths,
                    minMonthlyAmount: editingScheme.minMonthlyAmount,
                    benefitPercentage: editingScheme.benefitPercentage || 0,
                    isActive: editingScheme.isActive,
                }),
            });

            const data = await response.json();
            console.log('Edit Response:', data);

            if (response.ok && data.success) {
                Alert.alert('Success', 'Scheme updated successfully');
                setShowEditModal(false);
                setEditingScheme(null);
                fetchSchemes();
            } else {
                Alert.alert('Error', data.message || 'Failed to update scheme');
            }
        } catch (error) {
            console.error('Update Scheme Error:', error);
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScheme = async (schemeId: string, schemeName: string) => {
        Alert.alert(
            'Delete Scheme',
            `Are you sure you want to delete "${schemeName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${BASE_URL}/api/v1/schemes/${schemeId}`, {
                                method: 'DELETE',
                                headers,
                            });

                            const data = await response.json();

                            if (response.ok && data.success) {
                                Alert.alert('Success', 'Scheme deleted successfully');
                                fetchSchemes();
                            } else {
                                Alert.alert('Error', data.message || 'Failed to delete scheme');
                            }
                        } catch (error) {
                            console.error('Delete Scheme Error:', error);
                            Alert.alert('Error', 'Failed to connect to server');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const openEditModal = (scheme: Scheme) => {
        setEditingScheme(scheme);
        setShowEditModal(true);
    };

    const filteredSchemes = schemes.filter(scheme =>
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Finance Admin</Text>
                        <Text className="text-2xl font-black text-black">Gold Schemes</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        className="bg-emerald-600 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="bg-gray-50 rounded-2xl px-4 py-3 flex-row items-center">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-3 text-base"
                        placeholder="Search schemes..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    {loading ? (
                        <Text className="text-center text-gray-500">Loading schemes...</Text>
                    ) : filteredSchemes.length === 0 ? (
                        <View className="items-center py-20">
                            <Ionicons name="diamond-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No schemes found</Text>
                        </View>
                    ) : (
                        filteredSchemes.map((scheme) => (
                            <TouchableOpacity
                                key={scheme._id}
                                className="bg-white border border-gray-100 rounded-[24px] p-5 mb-4 shadow-sm"
                            >
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1">
                                        <Text className="text-black font-black text-lg">{scheme.name}</Text>
                                        <Text className="text-gray-500 text-sm mt-1">{scheme.description}</Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${scheme.isActive ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                        <Text className={`text-xs font-bold ${scheme.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {scheme.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-50">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase">Duration</Text>
                                        <Text className="text-black font-black text-base">{scheme.durationMonths} months</Text>
                                    </View>
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase">Min. Monthly</Text>
                                        <Text className="text-emerald-600 font-black text-base">₹{scheme.minMonthlyAmount}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase">Total Value</Text>
                                        <Text className="text-black font-black text-base">₹{(scheme.minMonthlyAmount * scheme.durationMonths).toLocaleString()}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row mt-4 pt-4 border-t border-gray-50">
                                    <TouchableOpacity
                                        onPress={() => openEditModal(scheme)}
                                        className="flex-1 bg-blue-50 rounded-2xl p-3 mr-2 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="create-outline" size={18} color="#3b82f6" />
                                        <Text className="text-blue-600 font-bold text-sm ml-2">EDIT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteScheme(scheme._id, scheme.name)}
                                        className="flex-1 bg-red-50 rounded-2xl p-3 ml-2 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                        <Text className="text-red-600 font-bold text-sm ml-2">DELETE</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>

            {/* Create Scheme Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8" style={{ height: '80%' }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-black">New Scheme</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close-circle" size={32} color="#d1d5db" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Scheme Name</Text>
                                    <TextInput
                                        className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                        placeholder="e.g. JC Gold 11 Months"
                                        value={newScheme.name}
                                        onChangeText={(text) => setNewScheme({ ...newScheme, name: text })}
                                    />
                                </View>

                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Description</Text>
                                    <TextInput
                                        className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                        placeholder="Scheme benefits and details..."
                                        multiline
                                        numberOfLines={3}
                                        value={newScheme.description}
                                        onChangeText={(text) => setNewScheme({ ...newScheme, description: text })}
                                    />
                                </View>

                                <View className="flex-row space-x-4">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Duration (Months)</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                            placeholder="11"
                                            keyboardType="numeric"
                                            value={newScheme.durationMonths}
                                            onChangeText={(text) => setNewScheme({ ...newScheme, durationMonths: text })}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Min. Amount</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                            placeholder="1000"
                                            keyboardType="numeric"
                                            value={newScheme.minMonthlyAmount}
                                            onChangeText={(text) => setNewScheme({ ...newScheme, minMonthlyAmount: text })}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Benefit %</Text>
                                    <TextInput
                                        className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={newScheme.benefitPercentage}
                                        onChangeText={(text) => setNewScheme({ ...newScheme, benefitPercentage: text })}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleCreateScheme}
                                    className="bg-emerald-600 rounded-[24px] p-5 items-center shadow-lg shadow-emerald-600/30 mt-6"
                                >
                                    <Text className="text-white font-black text-lg">Create Scheme</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Scheme Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8" style={{ height: '80%' }}>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-black">Edit Scheme</Text>
                            <TouchableOpacity onPress={() => { setShowEditModal(false); setEditingScheme(null); }}>
                                <Ionicons name="close-circle" size={32} color="#d1d5db" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {editingScheme && (
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Scheme Name</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                            placeholder="e.g. JC Gold 11 Months"
                                            value={editingScheme.name}
                                            onChangeText={(text) => setEditingScheme({ ...editingScheme, name: text })}
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Description</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                            placeholder="Scheme benefits and details..."
                                            multiline
                                            numberOfLines={3}
                                            value={editingScheme.description}
                                            onChangeText={(text) => setEditingScheme({ ...editingScheme, description: text })}
                                        />
                                    </View>

                                    <View className="flex-row space-x-4">
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Duration (Months)</Text>
                                            <TextInput
                                                className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                                placeholder="11"
                                                keyboardType="numeric"
                                                value={String(editingScheme.durationMonths)}
                                                onChangeText={(text) => setEditingScheme({ ...editingScheme, durationMonths: parseInt(text) || 0 })}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Min. Amount</Text>
                                            <TextInput
                                                className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                                placeholder="1000"
                                                keyboardType="numeric"
                                                value={String(editingScheme.minMonthlyAmount)}
                                                onChangeText={(text) => setEditingScheme({ ...editingScheme, minMonthlyAmount: parseFloat(text) || 0 })}
                                            />
                                        </View>
                                    </View>

                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Benefit %</Text>
                                        <TextInput
                                            className="bg-gray-50 rounded-2xl p-4 text-base border border-gray-100"
                                            placeholder="0"
                                            keyboardType="numeric"
                                            value={String(editingScheme.benefitPercentage || 0)}
                                            onChangeText={(text) => setEditingScheme({ ...editingScheme, benefitPercentage: parseFloat(text) || 0 })}
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4">
                                        <Text className="text-gray-700 font-bold">Active Status</Text>
                                        <TouchableOpacity
                                            onPress={() => setEditingScheme({ ...editingScheme, isActive: !editingScheme.isActive })}
                                            className={`w-14 h-8 rounded-full ${editingScheme.isActive ? 'bg-emerald-600' : 'bg-gray-300'} justify-center`}
                                        >
                                            <View className={`w-6 h-6 rounded-full bg-white ${editingScheme.isActive ? 'self-end mr-1' : 'self-start ml-1'}`} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleEditScheme}
                                        className="bg-blue-600 rounded-[24px] p-5 items-center shadow-lg shadow-blue-600/30 mt-6"
                                    >
                                        <Text className="text-white font-black text-lg">Update Scheme</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
