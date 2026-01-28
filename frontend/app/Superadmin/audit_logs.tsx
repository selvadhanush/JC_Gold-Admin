import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../../api';
import { Skeleton } from '../../components/Skeleton';

const { width } = Dimensions.get('window');

interface AuditLog {
    _id: string;
    admin: {
        _id: string;
        name: string;
        email: string;
    };
    action: string;
    module: string;
    details: any;
    ipAddress: string;
    createdAt: string;
}

export default function AuditLogs() {
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeModule, setActiveModule] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const modules = ['ALL', 'AUTH', 'PRODUCT', 'ORDER', 'USER', 'SYSTEM', 'FINANCE'];

    useEffect(() => {
        fetchLogs();
    }, [activeModule]);

    const fetchLogs = async () => {
        try {
            const headers = await getAuthHeaders();
            let url = API_ENDPOINTS.SUPER_AUDIT;
            if (activeModule !== 'ALL') url += `?module=${activeModule}`;

            const response = await fetch(url, { headers });
            const data = await response.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isHighRisk = (action: string) => {
        if (!action) return false;
        const risks = ['DELETE', 'RESET', 'SUSPEND', 'UPDATE_SETTINGS', 'BLOCK'];
        return risks.some(r => action.toUpperCase().includes(r));
    };

    const search = (searchQuery || '').toLowerCase();
    const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
        if (!log) return false;

        let detailsStr = '';
        if (typeof log.details === 'string') {
            detailsStr = log.details;
        } else if (log.details && typeof log.details === 'object') {
            detailsStr = `${log.details.name || ''} ${log.details.sku || ''} ${JSON.stringify(log.details)}`;
        }

        const details = detailsStr.toLowerCase();
        const name = String(log?.admin?.name || '').toLowerCase();
        const ip = String(log?.ipAddress || '').toLowerCase();
        return details.includes(search) || name.includes(search) || ip.includes(search);
    });

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="dark-content" />

                {/* Header Skeleton */}
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                            <Skeleton width={180} height={28} />
                        </View>
                        <Skeleton width={40} height={40} borderRadius={20} />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-6 px-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} width={80} height={36} borderRadius={16} style={{ marginRight: 12 }} />
                        ))}
                    </ScrollView>

                    <Skeleton width="100%" height={48} borderRadius={16} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                    <View className="flex-row items-center justify-between mb-8">
                        <Skeleton width={120} height={12} />
                        <Skeleton width={80} height={20} borderRadius={999} />
                    </View>

                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', padding: 24, marginBottom: 20 }}>
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-2">
                                        <Skeleton width={8} height={8} borderRadius={4} style={{ marginRight: 8 }} />
                                        <Skeleton width="60%" height={16} />
                                    </View>
                                    <Skeleton width="40%" height={10} />
                                </View>
                                <Skeleton width={100} height={24} borderRadius={12} />
                            </View>
                            <Skeleton width="100%" height={60} borderRadius={24} style={{ marginBottom: 16 }} />
                            <View className="flex-row justify-between items-center">
                                <Skeleton width={120} height={10} />
                                <Skeleton width={60} height={20} borderRadius={12} />
                            </View>
                        </View>
                    ))}
                </ScrollView>
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
                <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <View className="flex-row items-center">
                                <Ionicons name="finger-print" size={14} color="#4f46e5" className="mr-2" />
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master Admin</Text>
                            </View>
                            <Text className="text-2xl font-black text-black">FORENSIC LOGS</Text>
                        </View>
                        <View className="bg-green-500 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-green-500/30">
                            <Ionicons name="finger-print" size={20} color="white" />
                        </View>
                    </View>

                    {/* Module Filter Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-6 px-6">
                        {modules.map((m) => (
                            <TouchableOpacity
                                key={m}
                                onPress={() => setActiveModule(m)}
                                className={`px-5 py-2.5 rounded-2xl mr-3 border ${activeModule === m ? 'bg-black border-black' : 'bg-gray-50 border-gray-100'}`}
                            >
                                <Text className={`font-black text-[9px] uppercase tracking-widest ${activeModule === m ? 'text-white' : 'text-gray-400'}`}>
                                    {m}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <View className="w-12" />
                    </ScrollView>

                    {/* Search Bar */}
                    <View className="bg-gray-50 flex-row items-center px-5 py-4 rounded-2xl border border-gray-100 shadow-inner">
                        <Ionicons name="search" size={18} color="#9ca3af" />
                        <TextInput
                            placeholder="Trace by detail, admin or IP..."
                            className="flex-1 ml-4 font-black text-gray-900 text-xs uppercase"
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-6 px-1">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Chain ({filteredLogs.length})</Text>
                        <View className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <Text className="text-[9px] font-black text-green-600 uppercase">Integrity Verified</Text>
                        </View>
                    </View>

                    {filteredLogs.map((log) => (
                        <View key={log._id} className="bg-white rounded-[32px] border border-gray-100 p-6 mb-5 shadow-sm">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 pr-4">
                                    <View className="flex-row items-center mb-1">
                                        <View className={`w-2 h-2 rounded-full mr-2 ${isHighRisk(log.action) ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <Text className="text-black font-black text-sm">{log.admin?.name || 'System Override'}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">{log.module}</Text>
                                        <View className="w-1 h-1 bg-gray-200 rounded-full mx-2" />
                                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">{log.action}</Text>
                                    </View>
                                </View>
                                <View className="bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                                    <Text className="text-gray-400 text-[8px] font-black uppercase">{formatDate(log.createdAt)}</Text>
                                </View>
                            </View>

                            <View className={`p-4 rounded-[24px] border ${isHighRisk(log.action) ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                <Text className={`font-bold text-xs leading-5 ${isHighRisk(log.action) ? 'text-red-900' : 'text-gray-700'}`}>
                                    {typeof log.details === 'string'
                                        ? log.details
                                        : log.details?.name
                                            ? `Impacted Entity: ${log.details.name}${log.details.sku ? ` (${log.details.sku})` : ''}`
                                            : JSON.stringify(log.details)}
                                </Text>
                            </View>

                            <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <Ionicons name="location-sharp" size={12} color="#9ca3af" />
                                    <Text className="text-gray-400 text-[9px] font-black ml-1.5 uppercase tracking-widest">IP: {log.ipAddress || 'INTERNAL_ACCESS'}</Text>
                                </View>
                                <TouchableOpacity className="bg-black/5 px-3 py-1.5 rounded-xl">
                                    <Text className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Details</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {filteredLogs.length === 0 && (
                        <View className="items-center justify-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <Ionicons name="search" size={40} color="#cbd5e1" />
                            <Text className="text-gray-400 font-black mt-4 uppercase text-[10px] tracking-widest">No Log Matches</Text>
                        </View>
                    )}
                </View>

                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
