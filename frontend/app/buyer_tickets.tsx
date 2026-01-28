import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import { Skeleton } from '../components/Skeleton';

const { width } = Dimensions.get('window');

// --- Types ---
interface Ticket {
    _id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    adminResponse?: string;
    respondedAt?: string;
    createdAt: string;
    order?: {
        _id: string;
        orderNumber: string;
        totalAmount: number;
        orderItems: any[];
    };
}

// --- Helper Functions ---
const getStatusStyles = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
        case 'RESOLVED':
        case 'CLOSED':
            return {
                bgStyle: styles.statusResolvedBg,
                textStyle: styles.statusResolvedText,
                icon: 'checkmark-circle-outline' as const,
                color: '#10b981',
                label: 'Resolved'
            };
        case 'OPEN':
            return {
                bgStyle: styles.statusOpenBg,
                textStyle: styles.statusOpenText,
                icon: 'flash-outline' as const,
                color: '#3b82f6',
                label: 'Active Request'
            };
        default:
            return {
                bgStyle: styles.statusProcessingBg,
                textStyle: styles.statusProcessingText,
                icon: 'time-outline' as const,
                color: '#f59e0b',
                label: 'Processing'
            };
    }
};

const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('product')) return 'cube-outline' as const;
    if (cat.includes('delivery')) return 'car-outline' as const;
    if (cat.includes('payment') || cat.includes('refund')) return 'card-outline' as const;
    if (cat.includes('account')) return 'person-circle-outline' as const;
    return 'help-circle-outline' as const;
};

// --- Sub-Components (Fixes Context Crash) ---

// 1. Extracted Filter Tab
const FilterTab = ({ item, isActive, onPress }: { item: any, isActive: boolean, onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
            styles.filterTabBase,
            isActive ? styles.filterTabActive : styles.filterTabInactive
        ]}
    >
        <Ionicons
            name={item.icon}
            size={14}
            color={isActive ? 'white' : '#94a3b8'}
            style={{ marginRight: 8 }}
        />
        <Text style={[
            styles.filterTabText,
            isActive ? { color: 'white' } : { color: '#94a3b8' }
        ]}>
            {item.label}
        </Text>
    </TouchableOpacity>
);

// 2. Extracted Ticket Card
const TicketCard = ({ ticket, router }: { ticket: Ticket; router: ReturnType<typeof useRouter> }) => {
    if (!ticket) return null;

    const status = getStatusStyles(ticket.status);
    const categoryIcon = getCategoryIcon(ticket.category);

    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardAbstractIcon}>
                <Ionicons name={categoryIcon} size={120} color="#000" />
            </View>

            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <View style={styles.categoryBadge}>
                        <View style={styles.categoryIconBg}>
                            <Ionicons name={categoryIcon} size={16} color="#475569" />
                        </View>
                        <Text style={styles.categoryText}>{ticket.category}</Text>
                    </View>
                    <Text style={styles.subjectText}>{ticket.subject}</Text>
                </View>
                <View style={[styles.statusBadge, status.bgStyle]}>
                    <Ionicons name={status.icon} size={12} color={status.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.statusText, status.textStyle]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.descriptionContainer}>
                <View style={styles.descriptionRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color="#cbd5e1" style={{ marginRight: 12, marginTop: 4 }} />
                    <Text style={styles.descriptionText}>
                        {ticket.description}
                    </Text>
                </View>
            </View>

            {ticket.order && (
                <TouchableOpacity
                    onPress={() => router.push(`/order_detail?id=${ticket.order?._id}`)}
                    style={styles.orderCard}
                >
                    <View style={styles.orderCardInner}>
                        <View style={styles.orderIconBg}>
                            <Ionicons name="receipt-outline" size={20} color="#6366f1" />
                        </View>
                        <View>
                            <Text style={styles.orderLabel}>Linked Invoice</Text>
                            <Text style={styles.orderNumber}>#{ticket.order.orderNumber}</Text>
                        </View>
                    </View>
                    <View style={styles.chevronBg}>
                        <Ionicons name="chevron-forward-outline" size={16} color="#6366f1" />
                    </View>
                </TouchableOpacity>
            )}

            {ticket.adminResponse && (
                <View style={styles.resolutionContainer}>
                    <View style={styles.resolutionHeader}>
                        <View style={styles.resolutionHeaderLeft}>
                            <View style={styles.resolutionIconBg}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                            </View>
                            <View>
                                <Text style={styles.resolutionTitle}>Resolution</Text>
                                <Text style={styles.resolutionSubtitle}>Official Response</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.resolutionBody}>
                        <Text style={styles.resolutionText}>
                            "{ticket.adminResponse}"
                        </Text>
                    </View>
                    {ticket.respondedAt && (
                        <View style={styles.resolutionFooter}>
                            <Ionicons name="calendar-outline" size={12} color="#059669" style={{ marginRight: 6 }} />
                            <Text style={styles.resolutionDate}>
                                Resolved on {new Date(ticket.respondedAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.cardFooterLeft}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text style={styles.postedDate}>
                        Posted {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.cardFooterRight}>
                    <View style={styles.idBadge}>
                        <Ionicons name="finger-print-outline" size={12} color="#94a3b8" />
                        <Text style={styles.idText}>ID: {ticket._id?.slice(-6)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- Main Page Component ---
export default function BuyerTicketsPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_SUPPORT, { headers });
            const data = await response.json();

            if (data.success) {
                setTickets(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const filteredTickets = tickets.filter(t => {
        if (!t) return false;
        const status = t.status?.toUpperCase();
        if (filter === 'ALL') return true;
        if (filter === 'OPEN') return status === 'OPEN' || status === 'IN_PROGRESS';
        if (filter === 'RESOLVED') return status === 'RESOLVED' || status === 'CLOSED';
        return true;
    });

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.headerContainerBorder}>
                    <Skeleton width={150} height={32} style={{ borderRadius: 8 }} />
                </View>
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.skeletonCard}>
                            <Skeleton width="40%" height={16} style={{ marginBottom: 16 }} />
                            <Skeleton width="100%" height={80} style={{ borderRadius: 28, marginBottom: 16 }} />
                            <Skeleton width="100%" height={48} style={{ borderRadius: 16 }} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <View>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <View style={styles.backButtonIcon}>
                                <Ionicons name="chevron-back" size={12} color="#64748b" />
                            </View>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Support</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.headerAction}
                    >
                        <Ionicons name="chatbubbles-outline" size={26} color="#f97316" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.flex1}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            >
                {/* Filter Tabs - Rendered using SubComponent to avoid context crash */}
                <View style={styles.filterContainer}>
                    {[
                        { id: 'ALL', label: 'Overview', icon: 'grid-outline' as const },
                        { id: 'OPEN', label: 'Active', icon: 'flash-outline' as const },
                        { id: 'RESOLVED', label: 'Solved', icon: 'checkmark-circle-outline' as const }
                    ].map((f) => (
                        <FilterTab
                            key={f.id}
                            item={f}
                            isActive={filter === f.id}
                            onPress={() => setFilter(f.id as any)}
                        />
                    ))}
                </View>

                {/* Tickets List - Rendered using SubComponent to avoid context crash */}
                <View style={styles.listContainer}>
                    {filteredTickets.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <View style={styles.emptyStateIconBg}>
                                <View style={styles.emptyStateIconInner}>
                                    <Ionicons name="mail-open-outline" size={80} color="#cbd5e1" />
                                </View>
                            </View>
                            <Text style={styles.emptyStateTitle}>Nothing Here</Text>
                            <Text style={styles.emptyStateText}>
                                You don't have any {filter === 'ALL' ? '' : filter.toLowerCase()} tickets at the moment.
                            </Text>
                            <TouchableOpacity
                                onPress={onRefresh}
                                style={styles.refreshButton}
                            >
                                <Ionicons name="refresh-outline" size={18} color="#475569" style={{ marginRight: 8 }} />
                                <Text style={styles.refreshButtonText}>Refresh Feed</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <TicketCard key={ticket._id} ticket={ticket} router={router} />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex1: {
        flex: 1,
    },
    skeletonCard: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 40,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    headerContainerBorder: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    scrollContainer: {
        flex: 1,
        padding: 24,
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(249, 250, 251, 0.5)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButtonIcon: {
        backgroundColor: '#f8fafc',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    backButtonText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0f172a',
    },
    headerAction: {
        backgroundColor: '#fff7ed',
        width: 56,
        height: 56,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ffedd5',
        shadowColor: '#ffedd5',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 32,
        gap: 12,
    },
    filterTabBase: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterTabActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
        shadowColor: '#cbd5e1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    filterTabInactive: {
        backgroundColor: '#fff',
        borderColor: '#f1f5f9',
    },
    filterTabText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    listContainer: {
        paddingHorizontal: 24,
        marginTop: 40,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateIconBg: {
        width: 224,
        height: 224,
        backgroundColor: '#f8fafc',
        borderRadius: 112,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(241, 245, 249, 0.5)',
    },
    emptyStateIconInner: {
        backgroundColor: '#fff',
        width: 144,
        height: 144,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#e2e8f0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    emptyStateTitle: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 30,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateText: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '700',
        paddingHorizontal: 24,
    },
    refreshButton: {
        marginTop: 32,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshButtonText: {
        color: '#475569',
        fontWeight: '900',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#f8fafc',
        borderRadius: 44,
        padding: 28,
        marginBottom: 32,
        shadowColor: '#f1f5f9',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 1,
        overflow: 'hidden',
    },
    cardAbstractIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 16,
        opacity: 0.05,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    cardHeaderLeft: {
        flex: 1,
        marginRight: 16,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIconBg: {
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 12,
        marginRight: 8,
    },
    categoryText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subjectText: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 24,
        lineHeight: 30,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statusResolvedBg: { backgroundColor: '#ecfdf5' },
    statusResolvedText: { color: '#047857' },
    statusOpenBg: { backgroundColor: '#eff6ff' },
    statusOpenText: { color: '#1d4ed8' },
    statusProcessingBg: { backgroundColor: '#fffbeb' },
    statusProcessingText: { color: '#b45309' },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    descriptionContainer: {
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f8fafc',
    },
    descriptionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    descriptionText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 24,
        flex: 1,
    },
    orderCard: {
        backgroundColor: 'rgba(238, 242, 255, 0.5)',
        borderRadius: 28,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#eef2ff',
    },
    orderCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderIconBg: {
        width: 48,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#eef2ff',
    },
    orderLabel: {
        color: '#818cf8',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    orderNumber: {
        color: '#0f172a',
        fontWeight: '900',
        fontSize: 16,
    },
    chevronBg: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#eef2ff',
    },
    resolutionContainer: {
        backgroundColor: '#ecfdf5',
        borderRadius: 36,
        padding: 28,
        borderWidth: 1,
        borderColor: '#d1fae5',
        marginTop: 8,
    },
    resolutionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    resolutionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resolutionIconBg: {
        width: 40,
        height: 40,
        backgroundColor: '#10b981',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#34d399',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    resolutionTitle: {
        color: '#064e3b',
        fontWeight: '900',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resolutionSubtitle: {
        color: 'rgba(5, 150, 105, 0.7)',
        fontSize: 9,
        fontWeight: '700',
    },
    resolutionBody: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    resolutionText: {
        color: '#064e3b',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    resolutionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    resolutionDate: {
        color: '#059669',
        fontSize: 10,
        fontWeight: '700',
    },
    cardFooter: {
        marginTop: 32,
        paddingTop: 28,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardFooterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postedDate: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 6,
    },
    cardFooterRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    idBadge: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
    },
    idText: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginLeft: 6,
    },
});