import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface QuickActionItem {
    id: string;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.prototype.name | any;
    color: string;
    bg: string;
    route?: string;
    action?: () => void;
}

interface QuickActionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ visible, onClose }) => {
    const router = useRouter();

    const actions: QuickActionItem[] = [
        {
            id: 'health',
            label: 'System Health',
            description: 'Order pipeline status',
            icon: 'pulse-outline',
            color: '#10b981',
            bg: '#ecfdf5',
            route: '/Orderadmin/analytics'
        },
        {
            id: 'hub',
            label: 'Platform Hub',
            description: 'Switch admin context',
            icon: 'grid-outline',
            color: '#6366f1',
            bg: '#eef2ff',
            route: '/Orderadmin/hub'
        },
        {
            id: 'export',
            label: 'Bulk Reports',
            description: 'Instant CSV export',
            icon: 'cloud-download-outline',
            color: '#f59e0b',
            bg: '#fffbeb',
            action: () => {
                // This would be linked to the export function in manage.tsx via props if needed,
                // but for now we'll just navigate or show info
                onClose();
            }
        },
        {
            id: 'settings',
            label: 'Operations',
            description: 'Configure workflow',
            icon: 'settings-outline',
            color: '#64748b',
            bg: '#f8fafc',
            route: '/Orderadmin/settings'
        }
    ];

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    paddingTop: 80,
                    paddingRight: 24
                }}
            >
                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 32,
                        width: width * 0.8,
                        maxWidth: 320,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 20 },
                        shadowOpacity: 0.1,
                        shadowRadius: 30,
                        elevation: 20,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#f1f5f9'
                    }}
                >
                    <View style={{ padding: 24, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 }}>Quick Actions</Text>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 }}>Order Administration Hub</Text>
                    </View>

                    <View style={{ padding: 12 }}>
                        {actions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    if (item.action) item.action();
                                    if (item.route) router.push(item.route as any);
                                    onClose();
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 16,
                                    borderRadius: 24,
                                    marginBottom: 4
                                }}
                            >
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    backgroundColor: item.bg,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 16
                                }}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{item.label}</Text>
                                    <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>{item.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            padding: 20,
                            alignItems: 'center',
                            borderTopWidth: 1,
                            borderTopColor: '#f1f5f9'
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>Close Menu</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
