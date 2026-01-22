import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders, BASE_URL } from '../../api';

interface Admin {
    _id: string;
    name: string;
    email: string;
    role: {
        _id: string;
        name: string;
    };
    isActive: boolean;
}

interface Role {
    _id: string;
    name: string;
}

export default function ManageAdmins() {
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const headers = await getAuthHeaders();
            const [adminRes, roleRes] = await Promise.all([
                fetch(API_ENDPOINTS.ADMIN_MANAGEMENT, { headers }),
                fetch(`${API_ENDPOINTS.ADMIN_MANAGEMENT}/roles`, { headers }),
            ]);

            const adminData = await adminRes.json();
            const roleData = await roleRes.json();

            if (adminData.success) setAdmins(adminData.data);
            if (roleData.success) setRoles(roleData.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!name || !email || !password || !selectedRole) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setCreating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.ADMIN_MANAGEMENT, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name, email, password, roleName: selectedRole }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Admin created successfully');
                setModalVisible(false);
                fetchData();
                setName('');
                setEmail('');
                setPassword('');
                setSelectedRole('');
            } else {
                Alert.alert('Error', data.message || 'Creation failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Connection failed');
        } finally {
            setCreating(false);
        }
    };

    const toggleAdminStatus = async (admin: Admin) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_ENDPOINTS.ADMIN_MANAGEMENT}/${admin._id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ isActive: !admin.isActive }),
            });

            const data = await response.json();
            if (data.success) {
                fetchData();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update admin');
        }
    };

    const handleResetPassword = (id: string) => {
        Alert.prompt(
            "Crypto Reset",
            "Enter new master password for this administrator.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Override",
                    onPress: async (pwd) => {
                        if (!pwd) return;
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(API_ENDPOINTS.SUPER_RESET_PWD(id), {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({ newPassword: pwd }),
                            });
                            if (response.ok) Alert.alert("Success", "Security hash updated.");
                        } catch (error) {
                            Alert.alert("Error", "Bypass failed.");
                        }
                    }
                }
            ]
        );
    };

    const deleteAdmin = (id: string) => {
        Alert.alert(
            'Terminate Access',
            'Are you sure you want to permanently remove this administrator?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove permanently',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const response = await fetch(`${API_ENDPOINTS.ADMIN_MANAGEMENT}/${id}`, {
                                method: 'DELETE',
                                headers,
                            });
                            if (response.ok) fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#4f46e5" className="mt-20" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* Premium Header */}
                <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <View>
                        <View className="flex-row items-center">
                            <Ionicons name="id-card" size={14} color="#ea580c" className="mr-2" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                        </View>
                        <Text className="text-2xl font-black text-black">ADMIN REGISTRY</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        className="bg-black w-12 h-12 rounded-2xl items-center justify-center shadow-xl shadow-black/20"
                    >
                        <Ionicons name="person-add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Personnel ({admins.length})</Text>
                        <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            <Text className="text-[9px] font-black text-orange-600 uppercase">Secure Index</Text>
                        </View>
                    </View>

                    {(Array.isArray(admins) ? admins : []).map((admin) => (
                        <View key={admin._id} className="bg-white rounded-[32px] border border-gray-100 p-5 mb-5 shadow-sm">
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 rounded-[20px] bg-orange-50 items-center justify-center border border-orange-100">
                                    <Ionicons name="id-card" size={28} color="#ea580c" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-black text-gray-900" numberOfLines={1}>{admin.name}</Text>
                                        <View className={`px-2 py-0.5 rounded-lg ${admin.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <Text className={`text-[9px] font-black ${admin.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {admin.isActive ? 'ACT' : 'SUS'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-bold mt-0.5">{admin.email}</Text>
                                    <View className="flex-row items-center mt-2">
                                        <View className="bg-black/5 px-2 py-0.5 rounded-md">
                                            <Text className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{admin.role?.name || 'Authorized Personnel'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* More Details Trigger */}
                            <TouchableOpacity
                                onPress={() => setMenuVisible(menuVisible === admin._id ? null : admin._id)}
                                className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center"
                            >
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Manage Access</Text>
                                <Ionicons
                                    name={menuVisible === admin._id ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>

                            {/* Menu Actions */}
                            {menuVisible === admin._id && (
                                <View className="mt-4 pt-4 border-t border-gray-50 flex-row">
                                    <TouchableOpacity
                                        onPress={() => handleResetPassword(admin._id)}
                                        className="flex-1 items-center py-3 bg-gray-50 rounded-2xl mr-2 flex-row justify-center"
                                    >
                                        <Ionicons name="key-outline" size={18} color="black" />
                                        <Text className="ml-2 font-black text-xs uppercase">Reset</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => toggleAdminStatus(admin)}
                                        className={`flex-1 items-center py-3 ${admin.isActive ? 'bg-amber-50' : 'bg-indigo-50'} rounded-2xl mr-2 flex-row justify-center`}
                                    >
                                        <Ionicons name={admin.isActive ? "lock-closed-outline" : "lock-open-outline"} size={18} color={admin.isActive ? "#d97706" : "#4f46e5"} />
                                        <Text className={`ml-2 font-black text-xs uppercase ${admin.isActive ? 'text-amber-700' : 'text-indigo-700'}`}>
                                            {admin.isActive ? 'Suspend' : 'Active'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteAdmin(admin._id)}
                                        className="w-12 h-12 items-center justify-center bg-red-50 rounded-2xl"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View className="h-32" />
            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8 pb-12">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Commission</Text>
                                <Text className="text-3xl font-black text-black">New Personnel</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="close" size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-black font-black text-xs uppercase mb-3 ml-1">Identity</Text>
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-4 mb-4 font-bold text-black border border-gray-100"
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-4 mb-4 font-bold text-black border border-gray-100"
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            className="bg-gray-50 rounded-2xl p-4 mb-6 font-bold text-black border border-gray-100"
                            placeholder="Master Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text className="text-black font-black text-xs uppercase mb-4 ml-1">Clearance Level</Text>
                        <View className="flex-row flex-wrap gap-2 mb-8">
                            {roles.map((role) => (
                                <TouchableOpacity
                                    key={role._id}
                                    onPress={() => setSelectedRole(role.name)}
                                    className={`px-4 py-2 rounded-xl border ${selectedRole === role.name ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`font-black text-[9px] uppercase ${selectedRole === role.name ? 'text-white' : 'text-gray-400'}`}>
                                        {role.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={handleCreateAdmin}
                            disabled={creating}
                            className="bg-indigo-600 py-5 rounded-[24px] items-center shadow-xl shadow-indigo-600/30"
                        >
                            {creating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg uppercase tracking-widest">Authorize Personnel</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
