import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Image,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { BASE_URL, getAuthHeaders } from '../../api';

// Types
interface Product {
    _id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    images: string[];
    category: { _id: string; name: string };
    status: string;
}

type FilterType = 'ALL' | 'LOW' | 'OUT';

const { width } = Dimensions.get('window');

export default function InventoryManagement() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [newStock, setNewStock] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Sorting State
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'NAME' | 'STOCK' | 'PRICE'>('STOCK');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [products, searchQuery, activeFilter, sortBy, sortOrder]);

    const fetchProducts = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/products`, { headers });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Fetch Failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFiltersAndSort = () => {
        let result = [...products];

        // 1. Filter by Category/Status (Tabs)
        if (activeFilter === 'LOW') result = result.filter(p => p.stock > 0 && p.stock <= 10);
        else if (activeFilter === 'OUT') result = result.filter(p => p.stock === 0);

        // 2. Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
        }

        // 3. Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'NAME':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'PRICE':
                    comparison = a.price - b.price;
                    break;
                case 'STOCK':
                    comparison = a.stock - b.stock;
                    break;
            }
            return sortOrder === 'ASC' ? comparison : -comparison;
        });

        setFilteredProducts(result);
    };

    const handleUpdateStock = async () => {
        if (!newStock || parseInt(newStock) < 0) return Alert.alert('Error', 'Invalid quantity');
        setSubmitting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/api/v1/products/${currentProduct?._id}/stock`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ quantity: parseInt(newStock) }),
            });

            const data = await response.json();
            if (data.success) {
                setModalVisible(false);
                fetchProducts();
                setNewStock('');
                setCurrentProduct(null);
            } else {
                Alert.alert('Error', data.message || 'Update failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Connection failed');
        } finally {
            setSubmitting(false);
        }
    };

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    if (loading && !refreshing) {
        return <InventorySkeleton />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView style={{ backgroundColor: '#fff', zIndex: 10 }}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>Operations</Text>
                        <Text style={styles.headerTitle}>Inventory</Text>
                    </View>
                    <View style={styles.totalBadge}>
                        <View style={[styles.iconCircle, { backgroundColor: '#fff7ed' }]}>
                            <Ionicons name="cube" size={14} color="#ea580c" />
                        </View>
                        <View style={{ marginLeft: 8 }}>
                            <Text style={styles.totalLabel}>Total Items</Text>
                            <Text style={styles.totalText}>{totalStock}</Text>
                        </View>
                    </View>
                </View>

                {/* KPI Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                    style={{ marginBottom: 20 }}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveFilter('OUT')}
                        style={[styles.kpiCard, activeFilter === 'OUT' && styles.kpiCardActiveOut]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={[styles.kpiIcon, { backgroundColor: activeFilter === 'OUT' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2' }]}>
                                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                            </View>
                            {activeFilter === 'OUT' && <View style={styles.activeDotRed} />}
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.kpiValue}>{outOfStockCount}</Text>
                            <Text style={styles.kpiLabel}>Out of Stock</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveFilter('LOW')}
                        style={[styles.kpiCard, activeFilter === 'LOW' && styles.kpiCardActiveLow]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={[styles.kpiIcon, { backgroundColor: activeFilter === 'LOW' ? 'rgba(234, 88, 12, 0.2)' : '#fff7ed' }]}>
                                <Ionicons name="warning" size={18} color="#ea580c" />
                            </View>
                            {activeFilter === 'LOW' && <View style={styles.activeDotOrange} />}
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.kpiValue}>{lowStockCount}</Text>
                            <Text style={styles.kpiLabel}>Low Stock</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products, SKU..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#d1d5db" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => setFilterModalVisible(true)}
                        style={[styles.filterBtn, (sortBy !== 'STOCK' || sortOrder !== 'ASC') && styles.filterBtnActive]}
                    >
                        <Ionicons name="options" size={20} color={(sortBy !== 'STOCK' || sortOrder !== 'ASC') ? '#fff' : '#4b5563'} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor="#ea580c" />}
            >
                {filteredProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }}
                            style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 20 }}
                        />
                        <Text style={styles.emptyText}>No Products Found</Text>
                        <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearchQuery(''); setActiveFilter('ALL'); setSortBy('STOCK'); setSortOrder('ASC'); }}>
                            <Text style={styles.resetBtnText}>Clear All Filters</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredProducts.map((product, index) => {
                        const isLow = product.stock > 0 && product.stock <= 10;
                        const isOut = product.stock === 0;
                        const statusColor = isOut ? '#ef4444' : isLow ? '#f97316' : '#22c55e';

                        return (
                            <TouchableOpacity
                                key={product._id}
                                activeOpacity={0.9}
                                onPress={() => {
                                    setCurrentProduct(product);
                                    setNewStock(product.stock.toString());
                                    setModalVisible(true);
                                }}
                                style={styles.card}
                            >
                                <View style={styles.cardInner}>
                                    <View style={styles.imageWrapper}>
                                        <Image
                                            source={{ uri: product.images[0]?.startsWith('http') ? product.images[0] : `${BASE_URL}${product.images[0]}` }}
                                            style={styles.productImage}
                                        />
                                        {isOut && (
                                            <View style={styles.outOfStockOverlay}>
                                                <Text style={styles.outOfStockText}>OUT</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.cardContent}>
                                        <View style={styles.cardTopRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.skuText} numberOfLines={1}>{product.sku}</Text>
                                                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                            </View>
                                            <View style={styles.priceTag}>
                                                <Text style={styles.priceText}>₹{product.price.toLocaleString()}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBottomRow}>
                                            <View style={styles.stockInfo}>
                                                <View style={[styles.stockDot, { backgroundColor: statusColor }]} />
                                                <Text style={[styles.stockCount, { color: statusColor }]}>{product.stock} Units</Text>
                                            </View>

                                            <View style={styles.editIcon}>
                                                <Ionicons name="create-outline" size={16} color="#6b7280" />
                                            </View>
                                        </View>

                                        {/* Progress Bar */}
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${Math.min((product.stock / 50) * 100, 100)}%`, backgroundColor: statusColor }]} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Filter & Sort Modal */}
            <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setFilterModalVisible(false)} />
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={styles.filterModalContent}>
                            <View style={styles.dragHandle} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Sort & Filter</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#111" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.sectionTitle}>Sort Criteria</Text>
                            <View style={styles.scrollingChips}>
                                {[
                                    { id: 'STOCK', label: 'Stock Level', icon: 'cube-outline' },
                                    { id: 'NAME', label: 'Product Name', icon: 'text-outline' },
                                    { id: 'PRICE', label: 'Price', icon: 'cash-outline' },
                                ].map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.choiceChip, sortBy === s.id && styles.choiceChipActive]}
                                        onPress={() => setSortBy(s.id as any)}
                                    >
                                        <Ionicons name={s.icon as any} size={16} color={sortBy === s.id ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                                        <Text style={[styles.choiceChipText, sortBy === s.id && styles.choiceChipTextActive]}>{s.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionTitle}>Sort Order</Text>
                            <View style={styles.scrollingChips}>
                                <TouchableOpacity
                                    style={[styles.choiceChip, sortOrder === 'ASC' && styles.choiceChipActive]}
                                    onPress={() => setSortOrder('ASC')}
                                >
                                    <Ionicons name="arrow-up" size={16} color={sortOrder === 'ASC' ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                                    <Text style={[styles.choiceChipText, sortOrder === 'ASC' && styles.choiceChipTextActive]}>Ascending</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.choiceChip, sortOrder === 'DESC' && styles.choiceChipActive]}
                                    onPress={() => setSortOrder('DESC')}
                                >
                                    <Ionicons name="arrow-down" size={16} color={sortOrder === 'DESC' ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                                    <Text style={[styles.choiceChipText, sortOrder === 'DESC' && styles.choiceChipTextActive]}>Descending</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.updateBtn, { marginTop: 30, marginBottom: Platform.OS === 'ios' ? 20 : 0 }]}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={styles.updateBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>

            {/* Modern Bottom Sheet Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />

                        <View style={styles.modalContent}>
                            <View style={styles.dragHandle} />

                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalSubtitle}>Updating Stock For</Text>
                                    <Text style={styles.modalTitle} numberOfLines={1}>{currentProduct?.name}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#111" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.stockControlSection}>
                                <View style={styles.currentStockDisplay}>
                                    <Text style={styles.currentStockLabel}>CURRENT STOCK</Text>
                                    <Text style={styles.currentStockValue}>{currentProduct?.stock}</Text>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <TouchableOpacity
                                        style={styles.adjustBtn}
                                        onPress={() => setNewStock(Math.max(0, parseInt(newStock || '0') - 1).toString())}
                                    >
                                        <Ionicons name="remove" size={24} color="#111" />
                                    </TouchableOpacity>

                                    <TextInput
                                        value={newStock}
                                        onChangeText={setNewStock}
                                        keyboardType="numeric"
                                        style={styles.mainInput}
                                        selectionColor="#ea580c"
                                    />

                                    <TouchableOpacity
                                        style={styles.adjustBtn}
                                        onPress={() => setNewStock((parseInt(newStock || '0') + 1).toString())}
                                    >
                                        <Ionicons name="add" size={24} color="#111" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.presetsRow}>
                                {[5, 10, 20, 50].map((val) => (
                                    <TouchableOpacity
                                        key={val}
                                        style={styles.presetBtn}
                                        onPress={() => setNewStock((parseInt(newStock || '0') + val).toString())}
                                    >
                                        <Text style={styles.presetText}>+{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.updateBtn}
                                onPress={handleUpdateStock}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.updateBtnText}>Confirm Update</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                        </View>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 45 : 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerSub: { fontSize: 13, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -1 },

    totalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
    totalLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
    totalText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    kpiCard: { minWidth: 140, padding: 16, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    kpiCardActiveOut: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
    kpiCardActiveLow: { borderColor: '#fed7aa', backgroundColor: '#fff7ed' },
    kpiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
    kpiLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    activeDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
    activeDotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' },

    searchContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#0f172a', fontWeight: '500' },
    filterBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    filterBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },

    content: { flex: 1, backgroundColor: '#f8fafc' },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    resetBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    resetBtnText: { color: '#0f172a', fontWeight: '600', fontSize: 14 },

    card: { marginHorizontal: 24, marginBottom: 16, backgroundColor: '#fff', borderRadius: 24, shadowColor: '#64748b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
    cardInner: { padding: 16, flexDirection: 'row', gap: 16 },
    imageWrapper: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#f1f5f9', overflow: 'hidden' },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    outOfStockText: { color: '#fff', fontWeight: '800', fontSize: 12, borderWidth: 1, borderColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

    cardContent: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    skuText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    productName: { fontSize: 15, fontWeight: '700', color: '#0f172a', width: '90%' },
    priceTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    priceText: { fontSize: 12, fontWeight: '700', color: '#475569' },

    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
    stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stockDot: { width: 6, height: 6, borderRadius: 3 },
    stockCount: { fontSize: 13, fontWeight: '700' },
    editIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },

    progressBarBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 10, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 2 },

    modalOverlay: { flex: 1, justifyContent: 'center' },
    // modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 10 }, // OLD centered
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    dragHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', maxWidth: 250 },
    closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

    stockControlSection: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 24 },
    currentStockDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    currentStockLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    currentStockValue: { fontSize: 24, fontWeight: '800', color: '#0f172a' },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    adjustBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    mainInput: { flex: 1, height: 48, backgroundColor: '#fff', borderRadius: 14, fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },

    presetsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 32 },
    presetBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#f1f5f9', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    presetText: { fontSize: 13, fontWeight: '700', color: '#475569' },

    updateBtn: { backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
    updateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Filter Modal
    filterModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 12 },
    scrollingChips: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    choiceChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
    choiceChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    choiceChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    choiceChipTextActive: { color: '#fff' },

    // Skeleton Styles
    skelContainer: { flex: 1, backgroundColor: '#fff' },
    skelHeader: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: Platform.OS === 'android' ? 45 : 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    skelBlock: { backgroundColor: '#f1f5f9', borderRadius: 12 },
    skelCards: { paddingHorizontal: 24, flexDirection: 'row', gap: 12, marginBottom: 24 },
    skelCard: { width: 140, height: 100, borderRadius: 20, backgroundColor: '#f8fafc', padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    skelSearch: { marginHorizontal: 24, height: 50, borderRadius: 16, backgroundColor: '#f1f5f9', marginBottom: 24 },
    skelList: { paddingHorizontal: 24 },
    skelListItem: { flexDirection: 'row', padding: 12, marginBottom: 16, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff' },
});

// Skeleton Loader Component
const InventorySkeleton = () => {
    const opacity = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    const AnimatedBlock = ({ width, height, style }: { width?: number | string, height?: number, style?: any }) => (
        <Animated.View style={[styles.skelBlock, { width, height, opacity }, style]} />
    );

    return (
        <SafeAreaView style={styles.skelContainer}>
            {/* Header */}
            <View style={styles.skelHeader}>
                <View>
                    <AnimatedBlock width={60} height={10} style={{ marginBottom: 8 }} />
                    <AnimatedBlock width={120} height={30} />
                </View>
                <AnimatedBlock width={80} height={40} style={{ borderRadius: 20 }} />
            </View>

            {/* KPI Cards */}
            <View style={styles.skelCards}>
                <View style={styles.skelCard}>
                    <AnimatedBlock width={30} height={30} style={{ borderRadius: 10, marginBottom: 16 }} />
                    <AnimatedBlock width={40} height={24} style={{ marginBottom: 8 }} />
                    <AnimatedBlock width={80} height={10} />
                </View>
                <View style={styles.skelCard}>
                    <AnimatedBlock width={30} height={30} style={{ borderRadius: 10, marginBottom: 16 }} />
                    <AnimatedBlock width={40} height={24} style={{ marginBottom: 8 }} />
                    <AnimatedBlock width={80} height={10} />
                </View>
            </View>

            {/* Search */}
            <View style={styles.skelSearch}>
                <Animated.View style={{ flex: 1, opacity }} />
            </View>

            {/* List */}
            <View style={styles.skelList}>
                {[1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={styles.skelListItem}>
                        <AnimatedBlock width={80} height={80} style={{ borderRadius: 16, marginRight: 16 }} />
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View>
                                    <AnimatedBlock width={60} height={8} style={{ marginBottom: 6 }} />
                                    <AnimatedBlock width={100} height={16} />
                                </View>
                                <AnimatedBlock width={50} height={20} />
                            </View>
                            <AnimatedBlock width="100%" height={4} style={{ borderRadius: 2 }} />
                        </View>
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
};
