import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Input from '../components/Input';
import Button from '../components/Button';
import { API_ENDPOINTS, getAuthHeaders } from '../api';

export default function AddressManagement() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_ADDRESSES, { headers });
            const data = await response.json();
            if (data.success) {
                setAddresses(data.data);
            }
        } catch (error) {
            console.error('Fetch Addresses Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async () => {
        const payload = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            isDefault
        };
        const method = editingAddress ? 'PUT' : 'POST';
        const url = editingAddress
            ? `${API_ENDPOINTS.BUYER_ADDRESSES}/${editingAddress._id}`
            : API_ENDPOINTS.BUYER_ADDRESSES;

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', editingAddress ? 'Address updated' : 'Address added');
                setModalVisible(false);
                fetchAddresses();
                resetForm();
            } else {
                Alert.alert('Validation Error', data.message || 'Check your input');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save address. Please check your internet connection.');
        }
    };

    const handleDeleteAddress = (id: string) => {
        Alert.alert('Delete Address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const headers = await getAuthHeaders();
                        const response = await fetch(`${API_ENDPOINTS.BUYER_ADDRESSES}/${id}`, {
                            method: 'DELETE',
                            headers,
                        });
                        if (response.ok) fetchAddresses();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (id: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.BUYER_ADDRESSES}/${id}/default`, {
                method: 'PATCH',
                headers,
            });
            if (response.ok) fetchAddresses();
        } catch (error) {
            Alert.alert('Error', 'Failed to set default');
        }
    };

    const resetForm = () => {
        setFullName('');
        setPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setState('');
        setPincode('');
        setIsDefault(false);
        setEditingAddress(null);
    };

    const openEditModal = (addr: any) => {
        setEditingAddress(addr);
        setFullName(addr.fullName);
        setPhone(addr.phone);
        setAddressLine1(addr.addressLine1);
        setAddressLine2(addr.addressLine2);
        setCity(addr.city);
        setState(addr.state);
        setPincode(addr.pincode);
        setIsDefault(addr.isDefault);
        setModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: 'My Addresses', headerShown: true }} />
            <ScrollView className="px-6 py-4">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-gray-900">Saved Addresses</Text>
                    <TouchableOpacity
                        className="bg-primary-600 px-4 py-2 rounded-xl"
                        onPress={() => { resetForm(); setModalVisible(true); }}
                    >
                        <Text className="text-white font-bold">+ New</Text>
                    </TouchableOpacity>
                </View>

                {addresses.length === 0 && !loading && (
                    <View className="items-center py-20">
                        <Text className="text-gray-400 text-lg">No addresses saved yet</Text>
                    </View>
                )}

                {addresses.map((addr) => (
                    <View key={addr._id} className="bg-gray-50 rounded-3xl p-6 mb-4 border border-gray-100">
                        <View className="flex-row justify-between mb-2">
                            <Text className="font-bold text-lg text-gray-900">{addr.fullName}</Text>
                            {addr.isDefault && (
                                <View className="bg-primary-100 px-2 py-1 rounded-lg">
                                    <Text className="text-primary-700 text-xs font-bold uppercase">Default</Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-gray-600 mb-1">{addr.addressLine1}</Text>
                        {addr.addressLine2 ? <Text className="text-gray-600 mb-1">{addr.addressLine2}</Text> : null}
                        <Text className="text-gray-600 mb-4">{addr.city}, {addr.state} - {addr.pincode}</Text>
                        <Text className="text-gray-900 font-medium mb-4">📞 {addr.phone}</Text>

                        <View className="flex-row border-t border-gray-200 pt-4 gap-4">
                            <TouchableOpacity onPress={() => openEditModal(addr)}>
                                <Text className="text-primary-600 font-bold">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteAddress(addr._id)}>
                                <Text className="text-red-500 font-bold">Delete</Text>
                            </TouchableOpacity>
                            {!addr.isDefault && (
                                <TouchableOpacity onPress={() => handleSetDefault(addr._id)}>
                                    <Text className="text-gray-500 font-bold">Set as Default</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <ScrollView className="px-6 py-6">
                        <View className="flex-row justify-between items-center mb-10">
                            <Text className="text-3xl font-bold text-gray-900">
                                {editingAddress ? 'Edit Address' : 'New Address'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-gray-400 text-3xl">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Input label="Full Name" placeholder="Sender/Receiver name" value={fullName} onChangeText={setFullName} containerClassName="mb-4" />
                        <Input label="Phone Number" placeholder="Active phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerClassName="mb-4" />
                        <Input label="Address Line 1" placeholder="House/Flat No, Street" value={addressLine1} onChangeText={setAddressLine1} containerClassName="mb-4" />
                        <Input label="Address Line 2" placeholder="Landmark (Optional)" value={addressLine2} onChangeText={setAddressLine2} containerClassName="mb-4" />

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Input label="City" placeholder="City" value={city} onChangeText={setCity} />
                            </View>
                            <View className="flex-1">
                                <Input label="State" placeholder="State" value={state} onChangeText={setState} />
                            </View>
                        </View>

                        <Input label="Pincode" placeholder="6-digit code" value={pincode} onChangeText={setPincode} keyboardType="number-pad" containerClassName="mb-8" />

                        <TouchableOpacity
                            className="flex-row items-center mb-8"
                            onPress={() => setIsDefault(!isDefault)}
                        >
                            <View className={`w-6 h-6 rounded border ${isDefault ? 'bg-primary-600 border-primary-600' : 'border-gray-300'} items-center justify-center mr-3`}>
                                {isDefault && <Text className="text-white text-xs">✓</Text>}
                            </View>
                            <Text className="text-gray-700 font-medium">Set as default delivery address</Text>
                        </TouchableOpacity>

                        <Button
                            title={editingAddress ? 'Update Address' : 'Save Address'}
                            onPress={handleSaveAddress}
                            variant="primary"
                            size="lg"
                        />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
