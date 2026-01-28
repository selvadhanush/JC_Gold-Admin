import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import ConfirmationModal from './ConfirmationModal';
import { showToast } from '../utils/toast';

export default function MaintenanceScheduler() {
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [status, setStatus] = useState({
        isActive: false,
        isScheduled: false,
        remainingSeconds: 0,
        message: ''
    });
    const [delayOption, setDelayOption] = useState('30');
    const [customDelay, setCustomDelay] = useState('');
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [expectedDuration, setExpectedDuration] = useState('1 Hour');
    const [showPicker, setShowPicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);

    useEffect(() => {
        fetchStatus();
        // Poll every 15 seconds to reduce log noise
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.MAINTENANCE_STATUS);
            const data = await response.json();
            if (data.success) {
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching maintenance status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        const delay = delayOption === 'custom' ? parseInt(customDelay) : parseInt(delayOption);

        if (isNaN(delay) || delay < 0) {
            showToast.error('Please enter a valid delay in minutes');
            return;
        }

        setShowActivateModal(true);
    };

    const confirmActivate = async () => {
        const delay = delayOption === 'custom' ? parseInt(customDelay) : parseInt(delayOption);
        setActivating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.MAINTENANCE_ACTIVATE, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    delayMinutes: delay,
                    message: maintenanceMessage || undefined,
                    expectedDuration: expectedDuration || undefined
                })
            });
            const data = await response.json();
            if (data.success) {
                showToast.success(data.message);
                fetchStatus();
            } else {
                showToast.error(data.message);
            }
        } catch (error) {
            showToast.error('Failed to activate maintenance mode');
        } finally {
            setActivating(false);
            setShowActivateModal(false);
        }
    };

    const handleDeactivate = async () => {
        setShowDeactivateModal(true);
    };

    const confirmDeactivate = async () => {
        setActivating(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.MAINTENANCE_DEACTIVATE, {
                method: 'POST',
                headers
            });
            const data = await response.json();
            if (data.success) {
                showToast.success('Maintenance mode deactivated');
                fetchStatus();
            }
        } catch (error) {
            showToast.error('Failed to deactivate maintenance mode');
        } finally {
            setActivating(false);
            setShowDeactivateModal(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = () => {
        if (status.isActive) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' };
        if (status.isScheduled) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500' };
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500' };
    };

    const colors = getStatusColor();

    if (loading) {
        return (
            <View className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <View className={`${colors.bg} rounded-[32px] p-6 mb-8 border ${colors.border}`}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-1 pr-6">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="construct" size={24} color={status.isActive ? '#dc2626' : status.isScheduled ? '#f97316' : '#16a34a'} />
                        <Text className={`${colors.text} font-black text-xl ml-2`}>Maintenance Mode</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full ${colors.badge} mr-2`} />
                        <Text className={`${colors.text} text-[10px] font-bold uppercase tracking-widest`}>
                            {status.isActive ? 'ACTIVE' : status.isScheduled ? 'SCHEDULED' : 'INACTIVE'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Countdown Display */}
            {status.isScheduled && status.remainingSeconds > 0 && (
                <View className="bg-white rounded-2xl p-4 mb-4 border border-orange-200">
                    <Text className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-2">Starts In</Text>
                    <Text className="text-orange-600 font-black text-4xl">{formatTime(status.remainingSeconds)}</Text>
                </View>
            )}

            {/* Active Status Message */}
            {status.isActive && (
                <View className="bg-white rounded-2xl p-4 mb-4 border border-red-200">
                    <View className="flex-row items-center">
                        <Ionicons name="warning" size={20} color="#dc2626" />
                        <Text className="text-red-700 font-bold ml-2 flex-1">Buyers are currently locked out</Text>
                    </View>
                </View>
            )}

            {/* Controls - Only show if not active */}
            {!status.isActive && (
                <>
                    {/* Delay Selection */}
                    <Text className="text-gray-700 font-bold text-sm mb-2">Delay Before Activation</Text>
                    <TouchableOpacity
                        onPress={() => setShowPicker(true)}
                        className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 flex-row justify-between items-center"
                    >
                        <Text className="text-gray-900 font-bold">
                            {delayOption === 'custom' ? `${customDelay || '0'} minutes` : `${delayOption} minutes`}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {/* Custom Delay Input */}
                    {delayOption === 'custom' && (
                        <TextInput
                            placeholder="Enter minutes (e.g., 45)"
                            keyboardType="numeric"
                            value={customDelay}
                            onChangeText={setCustomDelay}
                            className="bg-white p-4 rounded-2xl border border-gray-200 mb-4 font-bold"
                        />
                    )}

                    {/* Message Input */}
                    <Text className="text-gray-700 font-bold text-sm mb-2">Maintenance Message (Optional)</Text>
                    <TextInput
                        placeholder="Custom message for buyers..."
                        value={maintenanceMessage}
                        onChangeText={setMaintenanceMessage}
                        multiline
                        numberOfLines={3}
                        className="bg-white p-4 rounded-2xl border border-gray-200 mb-4 font-medium"
                    />

                    {/* Expected Duration Selection */}
                    <Text className="text-gray-700 font-bold text-sm mb-2">Expected Duration</Text>
                    <TouchableOpacity
                        onPress={() => setShowDurationPicker(true)}
                        className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 flex-row justify-between items-center"
                    >
                        <Text className="text-gray-900 font-bold">
                            {expectedDuration || 'Select duration'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3">
                {!status.isActive && !status.isScheduled && (
                    <TouchableOpacity
                        onPress={handleActivate}
                        disabled={activating}
                        className="flex-1 bg-orange-600 py-4 rounded-2xl items-center"
                    >
                        {activating ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Activate</Text>
                        )}
                    </TouchableOpacity>
                )}
                {(status.isActive || status.isScheduled) && (
                    <TouchableOpacity
                        onPress={handleDeactivate}
                        disabled={activating}
                        className="flex-1 bg-green-600 py-4 rounded-2xl items-center"
                    >
                        {activating ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-black text-sm uppercase tracking-widest">Deactivate</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Delay Selection Modal */}
            <Modal visible={showPicker} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/60 p-6">
                    <View className="bg-white rounded-[32px] overflow-hidden">
                        <View className="p-6 border-b border-gray-100 flex-row justify-between items-center bg-gray-50/50">
                            <Text className="text-xl font-black text-gray-900">Select Delay</Text>
                            <TouchableOpacity
                                onPress={() => setShowPicker(false)}
                                className="bg-white p-2 rounded-full shadow-sm"
                            >
                                <Ionicons name="close" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-[400px] p-4">
                            {[
                                { label: 'Immediate (0 minutes)', value: '0' },
                                { label: '1 minute', value: '1' },
                                { label: '2 minutes', value: '2' },
                                { label: '30 minutes', value: '30' },
                                { label: '1 hour (60 minutes)', value: '60' },
                                { label: '2 hours (120 minutes)', value: '120' },
                                { label: '4 hours (240 minutes)', value: '240' },
                                { label: 'Custom', value: 'custom' }
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    onPress={() => {
                                        setDelayOption(item.value);
                                        setShowPicker(false);
                                    }}
                                    className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl ${delayOption === item.value ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'
                                        }`}
                                >
                                    <Text className={`font-bold ${delayOption === item.value ? 'text-orange-600' : 'text-gray-700'}`}>
                                        {item.label}
                                    </Text>
                                    {delayOption === item.value && (
                                        <Ionicons name="checkmark-circle" size={20} color="#f97316" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Duration Selection Modal */}
            <Modal visible={showDurationPicker} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/60 p-6">
                    <View className="bg-white rounded-[32px] overflow-hidden">
                        <View className="p-6 border-b border-gray-100 flex-row justify-between items-center bg-gray-50/50">
                            <Text className="text-xl font-black text-gray-900">Expected Duration</Text>
                            <TouchableOpacity
                                onPress={() => setShowDurationPicker(false)}
                                className="bg-white p-2 rounded-full shadow-sm"
                            >
                                <Ionicons name="close" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-[400px] p-4">
                            {[
                                { label: '5 Minutes', value: '5 Minutes' },
                                { label: '10 Minutes', value: '10 Minutes' },
                                { label: '30 Minutes', value: '30 Minutes' },
                                { label: '1 Hour', value: '1 Hour' },
                                { label: '2 Hours', value: '2 Hours' },
                                { label: '3 Hours', value: '3 Hours' },
                                { label: '5 Hours', value: '5 Hours' },
                                { label: 'Custom', value: 'Custom' }
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    onPress={() => {
                                        setExpectedDuration(item.value);
                                        setShowDurationPicker(false);
                                    }}
                                    className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl ${expectedDuration === item.value ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50'
                                        }`}
                                >
                                    <Text className={`font-bold ${expectedDuration === item.value ? 'text-orange-600' : 'text-gray-700'}`}>
                                        {item.label}
                                    </Text>
                                    {expectedDuration === item.value && (
                                        <Ionicons name="checkmark-circle" size={20} color="#f97316" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Deactivation Confirmation Modal */}
            <ConfirmationModal
                visible={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={confirmDeactivate}
                title="Deactivate Maintenance"
                message="Are you sure you want to deactivate maintenance mode? Buyers will be able to access the app immediately."
                type="danger"
                confirmText="Deactivate"
            />

            {/* Activation Confirmation Modal */}
            <ConfirmationModal
                visible={showActivateModal}
                onClose={() => setShowActivateModal(false)}
                onConfirm={confirmActivate}
                title="Activate Maintenance"
                message={`Schedule maintenance to start in ${delayOption === 'custom' ? customDelay : delayOption} minutes? This will affect all buyers.`}
                type="warning"
                confirmText="Schedule"
            />
        </View>
    );
}
