import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Image, TextInput, Dimensions, StyleSheet } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS, getAuthHeaders } from '../api';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import { showToast } from '../utils/toast';
import RazorpayModal from '../components/RazorpayModal';
import KycRestriction from '../components/KycRestriction';

const { width } = Dimensions.get('window');

export default function Schemes() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my');

    // Data States
    const [mySchemes, setMySchemes] = useState<any[]>([]);
    const [availableSchemes, setAvailableSchemes] = useState<any[]>([]);
    const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
    const [isProcessing, setIsProcessing] = useState(false);

    // Enrollment States
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<any>(null);
    const [monthlyInstallment, setMonthlyInstallment] = useState('');

    // Razorpay States
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [rzpData, setRzpData] = useState<any>(null);
    const [activeSchemeId, setActiveSchemeId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const headers = await getAuthHeaders();
            const [myRes, allRes] = await Promise.all([
                fetch(API_ENDPOINTS.BUYER_MY_SCHEMES, { headers }),
                fetch(API_ENDPOINTS.BUYER_SCHEMES, { headers })
            ]);

            const myData = await myRes.json();
            const allData = await allRes.json();

            if (myData.success) setMySchemes(myData.data);
            if (allData.success) setAvailableSchemes(allData.data);

            // Fetch KYC Status
            const kycRes = await fetch(API_ENDPOINTS.BUYER_KYC_STATUS, { headers });
            const kycData = await kycRes.json();
            console.log('[Schemes KYC Debug] Full Response:', JSON.stringify(kycData));
            if (kycData.success) {
                console.log('[Schemes KYC Debug] Status:', kycData.data.status);
                setKycStatus(kycData.data.status);
            } else {
                console.error('[Schemes KYC Debug] API Error:', kycData.message);
                // Don't set status if API fails - keep previous state
            }

            // If my schemes is empty, default to explore tab
            if (myData.success && myData.data.length === 0) {
                setActiveTab('explore');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast.error('Failed to load schemes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Only use useFocusEffect to prevent duplicate calls and rate limiting
    useFocusEffect(
        useCallback(() => {
            console.log('[Schemes KYC Debug] Page focused, refreshing data');
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleEnroll = async () => {
        if (!monthlyInstallment || Number(monthlyInstallment) < (selectedScheme?.minMonthlyAmount || 0)) {
            showToast.error(`Minimum installment is ₹${selectedScheme?.minMonthlyAmount}`);
            return;
        }

        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_SCHEME_ENROLL(selectedScheme._id), {
                method: 'POST',
                headers,
                body: JSON.stringify({ monthlyInstallment: Number(monthlyInstallment) })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Successfully enrolled!');
                setShowEnrollModal(false);
                setSelectedScheme(null);
                setMonthlyInstallment('');
                fetchData();
                setActiveTab('my');
            } else {
                showToast.error(data.message || 'Enrollment failed');
            }
        } catch (error) {
            showToast.error('Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayInstallment = async (schemeId: string, amount: number) => {
        try {
            setIsProcessing(true);
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_ORDER, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'SCHEME_INSTALLMENT',
                    targetId: schemeId,
                    amount: amount
                })
            });

            const data = await response.json();
            if (data.success) {
                setRzpData(data);
                setActiveSchemeId(schemeId);
                setShowRazorpayModal(true);
            } else {
                showToast.error(data.message || 'Payment initialization failed');
            }
        } catch (error) {
            showToast.error('Failed to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyPayment = async (rzpOrderId: string, rzpPaymentId: string) => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(API_ENDPOINTS.BUYER_RAZORPAY_VERIFY, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'SCHEME_INSTALLMENT',
                    targetId: activeSchemeId,
                    amount: rzpData.amount / 100,
                    razorpay_order_id: rzpOrderId,
                    razorpay_payment_id: rzpPaymentId,
                    razorpay_signature: 'SIMULATED_SIGNATURE'
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast.success('Installment paid successfully! ✨');
                fetchData();
                setShowRazorpayModal(false);
            } else {
                showToast.error(data.message || 'Payment verification failed');
            }
        } catch (error) {
            showToast.error('Verification failed');
        }
    };

    const renderMySchemes = () => {
        if (mySchemes.length === 0) {
            return (
                <View className="items-center justify-center py-24 px-10 bg-gray-50 rounded-[40px] mt-10">
                    <View className="w-[120px] h-[120px] bg-white rounded-full items-center justify-center mb-8 elevation-5" style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }}>
                        <Ionicons name="ribbon-outline" size={64} color="#f97316" />
                    </View>
                    <Text className="text-2xl font-black text-gray-900 mb-3 text-center">No Active Enrollments</Text>
                    <Text className="text-gray-500 text-center mb-10 text-sm leading-6">Start your golden savings journey today by exploring our premium gold schemes.</Text>
                    <TouchableOpacity
                        onPress={() => setActiveTab('explore')}
                        className="bg-orange-600 px-8 py-4.5 rounded-2xl flex-row items-center elevation-8"
                        style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 }}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-black uppercase tracking-widest text-sm">Discover Schemes</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View>
                <View className="mb-6 mt-2">
                    <View>
                        <Text className="text-2xl font-black text-gray-900">My Active Plans</Text>
                        <View className="h-1.5 w-12 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full mt-2" style={{ backgroundColor: '#ea580c' }} />
                    </View>
                </View>

                {mySchemes.map((item) => (
                    <View key={item._id} className="bg-white rounded-[32px] mb-6 overflow-hidden" style={styles.schemeCard}>
                        {/* Premium Header with Gradient Accent */}
                        <View className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" style={{ backgroundColor: '#ea580c' }} />

                        {/* Card Header */}
                        <View className="px-6 pt-6 pb-4 flex-row justify-between items-start">
                            <View className="flex-row items-center flex-1">
                                <View className="w-14 h-14 bg-orange-50 rounded-2xl items-center justify-center mr-4 border-2 border-orange-100">
                                    <Ionicons name="ribbon" size={26} color="#ea580c" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xl font-black text-gray-900 mb-1">{item.scheme?.name}</Text>
                                    <Text className="text-xs text-gray-400 font-bold">ID: {item._id.substring(0, 8).toUpperCase()}</Text>
                                </View>
                            </View>
                            <View className={`px-3 py-2 rounded-full flex-row items-center ${item.status === 'ACTIVE' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                <View className={`w-2 h-2 rounded-full mr-2 ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                <Text className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'ACTIVE' ? 'text-emerald-700' : 'text-gray-600'}`}>{item.status}</Text>
                            </View>
                        </View>

                        {/* Main Content */}
                        <View className="px-6 pb-6">
                            {/* Key Metrics Row */}
                            <View className="flex-row justify-between mb-6">
                                <View>
                                    <Text className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Target Savings</Text>
                                    <Text className="text-3xl font-black text-gray-900">₹{(item.monthlyInstallment * item.totalInstallments).toLocaleString()}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Milestone</Text>
                                    <View className="flex-row items-baseline">
                                        <Text className="text-3xl font-black text-orange-600">{item.paidInstallments}</Text>
                                        <Text className="text-xl font-bold text-gray-300 ml-1">/{item.totalInstallments}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View className="mb-6">
                                <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <View
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${(item.paidInstallments / item.totalInstallments) * 100}%`,
                                            backgroundColor: '#ea580c'
                                        }}
                                    />
                                </View>
                                <Text className="text-xs text-gray-400 font-bold text-right">{Math.round((item.paidInstallments / item.totalInstallments) * 100)}% Complete</Text>
                            </View>

                            {/* Stats Grid */}
                            <View className="flex-row bg-gray-50 rounded-2xl p-1 mb-6">
                                <View className="flex-1 p-4 items-center">
                                    <Text className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Contributed</Text>
                                    <Text className="text-lg font-black text-gray-900">₹{item.totalAmountPaid.toLocaleString()}</Text>
                                </View>
                                <View className="w-px bg-gray-200" />
                                <View className="flex-1 p-4 items-center">
                                    <Text className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Est. Bonus</Text>
                                    <Text className="text-lg font-black text-emerald-600">₹{item.benefitsEarned.toLocaleString()}</Text>
                                </View>
                            </View>

                            {/* Action Button */}
                            {item.status === 'ACTIVE' && item.paidInstallments < item.totalInstallments && (
                                <TouchableOpacity
                                    onPress={() => handlePayInstallment(item._id, item.monthlyInstallment)}
                                    className="bg-gray-900 py-5 rounded-2xl flex-row justify-center items-center"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 8,
                                        elevation: 6
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <View className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center mr-3">
                                        <Ionicons name="flash" size={18} color="white" />
                                    </View>
                                    <Text className="text-white font-black uppercase tracking-widest text-sm">Pay Installment ₹{item.monthlyInstallment.toLocaleString()}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderExploreSchemes = () => {
        return (
            <View>
                <View className="mb-6 mt-2">
                    <View>
                        <Text className="text-xl font-black text-gray-900">Available Collection</Text>
                        <View className="h-1 w-8 bg-orange-600 rounded-full mt-1.5" />
                    </View>
                </View>

                {kycStatus !== 'APPROVED' && (
                    <KycRestriction
                        title="Gold Scheme Access Limited"
                        message="Verified KYC is required to enroll in our high-yield gold saving programs."
                        buttonTitle="Complete KYC to Enroll"
                    />
                )}

                {availableSchemes.map((scheme) => (
                    <TouchableOpacity
                        key={scheme._id}
                        onPress={() => {
                            setSelectedScheme(scheme);
                            setMonthlyInstallment(scheme.minMonthlyAmount.toString());
                            setShowEnrollModal(true);
                        }}
                        activeOpacity={0.9}
                        style={styles.exploreCard}
                    >
                        {/* Background Decorative Circles */}
                        <View style={styles.exploreCardCircle1} />
                        <View style={styles.exploreCardCircle2} />

                        <View style={styles.exploreCardContent}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exploreTitleHeader}>Limited Enrollment</Text>
                                <Text style={styles.exploreTitle}>{scheme.name}</Text>
                            </View>
                            <View style={styles.exploreIconBox}>
                                <Ionicons name="sparkles" size={32} color="white" />
                            </View>
                        </View>

                        <View style={styles.exploreCardInner}>
                            <Text style={styles.exploreDescription}>{scheme.description}</Text>

                            <View style={styles.statRow}>
                                <View style={styles.statBox}>
                                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" style={{ marginBottom: 8 }} />
                                    <Text style={styles.statLabel}>Horizon</Text>
                                    <Text style={styles.statValue}>{scheme.durationMonths} Mo</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Ionicons name="trending-up-outline" size={16} color="#ea580c" style={{ marginBottom: 8 }} />
                                    <Text style={styles.statLabel}>Profit</Text>
                                    <Text style={[styles.statValue, { color: '#ea580c' }]}>{scheme.benefitPercentage}%+</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color="#0d9488" style={{ marginBottom: 8 }} />
                                    <Text style={styles.statLabel}>Trust</Text>
                                    <Text style={[styles.statValue, { color: '#0d9488' }]}>Verified</Text>
                                </View>
                            </View>

                            <View style={styles.actionSection}>
                                <View style={styles.investmentRow}>
                                    <Text style={styles.investmentLabel}>Investment Grade</Text>
                                    <Text style={styles.investmentValue}>₹{scheme.minMonthlyAmount}/mo</Text>
                                </View>
                                <View style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Start Saving Now</Text>
                                    <Ionicons name="arrow-forward-circle" size={24} color="#ea580c" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Premium Header */}
            <View className="bg-white border-b border-gray-100">
                <View className="px-6 py-5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-12 h-12 items-center justify-center rounded-2xl bg-gray-50 mr-4"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-1">JC GOLD & JEWELS</Text>
                            <Text className="text-2xl font-black text-gray-900">Wealth Planner 💎</Text>
                        </View>
                    </View>
                    <View className="w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center border-2 border-orange-100">
                        <Ionicons name="diamond" size={22} color="#ea580c" />
                    </View>
                </View>
            </View>

            {/* Premium Tab Switcher */}
            <View className="px-6 py-5 bg-white">
                <View className="bg-gray-50 p-1.5 rounded-3xl flex-row">
                    <TouchableOpacity
                        onPress={() => setActiveTab('my')}
                        className={`flex-1 py-4 rounded-[20px] flex-row items-center justify-center ${activeTab === 'my' ? 'bg-white' : ''}`}
                        style={activeTab === 'my' ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 3
                        } : {}}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={activeTab === 'my' ? "cube" : "cube-outline"}
                            size={20}
                            color={activeTab === 'my' ? '#111827' : '#9ca3af'}
                        />
                        <Text className={`font-black text-xs uppercase tracking-widest ml-2 ${activeTab === 'my' ? 'text-gray-900' : 'text-gray-400'}`}>Vault</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('explore')}
                        className={`flex-1 py-4 rounded-[20px] flex-row items-center justify-center ${activeTab === 'explore' ? 'bg-white' : ''}`}
                        style={activeTab === 'explore' ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 3
                        } : {}}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={activeTab === 'explore' ? "compass" : "compass-outline"}
                            size={20}
                            color={activeTab === 'explore' ? '#111827' : '#9ca3af'}
                        />
                        <Text className={`font-black text-xs uppercase tracking-widest ml-2 ${activeTab === 'explore' ? 'text-gray-900' : 'text-gray-400'}`}>Explore</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 220 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ea580c']} />}
            >
                {loading && !refreshing ? (
                    <View className="space-y-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={280} style={{ borderRadius: 32 }} />)}
                    </View>
                ) : activeTab === 'my' ? renderMySchemes() : renderExploreSchemes()}
            </ScrollView>

            <BottomNav />

            {/* Redesigned Enrollment Modal */}
            <Modal
                transparent
                visible={showEnrollModal}
                animationType="slide"
                onRequestClose={() => setShowEnrollModal(false)}
            >
                <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowEnrollModal(false)} className="absolute inset-0" />
                    <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl elevation-20">
                        <View className="items-center mb-8">
                            <View className="w-16 h-1 bg-slate-100 rounded-full mb-6" />
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mb-2">Premium Enrollment</Text>
                            <Text className="text-3xl font-black italic text-gray-900 text-center">{selectedScheme?.name}</Text>
                        </View>

                        <Text className="text-gray-900 font-black text-sm mb-4">Set Your Contribution</Text>
                        <View className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-slate-500 font-black text-[11px] uppercase tracking-widest">Monthly Deposit</Text>
                                <View className="bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                    <Text className="text-orange-600 font-black text-[10px]">Min: ₹{selectedScheme?.minMonthlyAmount}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mb-6">
                                <Text className="text-3xl font-black text-slate-300 mr-3">₹</Text>
                                <TextInput
                                    className="flex-1 text-5xl font-black text-gray-900 p-0"
                                    placeholder="0"
                                    value={monthlyInstallment}
                                    onChangeText={setMonthlyInstallment}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                            </View>
                            <View className="flex-row gap-4 pt-4 border-t border-slate-100">
                                <View className="flex-1 flex-row items-center gap-1.5">
                                    <Ionicons name="time-outline" size={14} color="#ea580c" />
                                    <Text className="text-slate-500 text-[11px] font-bold">{selectedScheme?.durationMonths} Months</Text>
                                </View>
                                <View className="flex-1 flex-row items-center gap-1.5">
                                    <Ionicons name="gift-outline" size={14} color="#16a34a" />
                                    <Text className="text-slate-500 text-[11px] font-bold">{selectedScheme?.benefitPercentage}% Bonus</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-8 px-2">
                            <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
                            <Text className="text-slate-400 text-[11px] font-medium leading-5 flex-1">Secure government backed savings plan with guaranteed returns on jewelry purchase.</Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleEnroll}
                            disabled={isProcessing}
                            className={`h-16 rounded-2xl flex-row items-center justify-center bg-gray-900 gap-3 ${isProcessing ? 'opacity-50' : 'elevation-10'}`}
                            style={!isProcessing ? { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 10 } : {}}
                            activeOpacity={0.8}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-black uppercase tracking-[1.5px] text-sm">Secure My Plan</Text>
                                    <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                        <Ionicons name="lock-closed" size={16} color="white" />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <RazorpayModal
                isVisible={showRazorpayModal}
                onClose={() => setShowRazorpayModal(false)}
                onSuccess={(oId, pId) => verifyPayment(oId, pId)}
                amount={rzpData?.amount || 0}
                orderId={rzpData?.order_id || ''}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    schemeCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    schemeCardDecorator: {
        height: 6,
        backgroundColor: '#ea580c',
        width: '100%',
    },
    schemeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 24,
        paddingBottom: 0,
    },
    schemeCardTitleRow: {
        flexDirection: 'row',
        flex: 1,
    },
    schemeIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#ffedd5',
    },
    schemeNameHeader: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    schemeIdText: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exploreCard: {
        backgroundColor: '#111827',
        borderRadius: 32,
        marginBottom: 24,
        overflow: 'hidden',
        minHeight: 380,
        elevation: 8,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    exploreCardCircle1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
    },
    exploreCardCircle2: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(234, 88, 12, 0.05)',
    },
    exploreCardContent: {
        padding: 32,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    exploreTitleHeader: {
        color: '#ea580c',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 10,
    },
    exploreTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    exploreIconBox: {
        width: 72,
        height: 72,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    exploreCardInner: {
        padding: 32,
        paddingTop: 0,
        zIndex: 10,
    },
    exploreDescription: {
        color: '#9ca3af',
        lineHeight: 24,
        marginBottom: 32,
        fontSize: 14,
        fontWeight: '500',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statLabel: {
        color: '#9ca3af',
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    statValue: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
    actionSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 24,
        borderRadius: 24,
        gap: 16,
    },
    investmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    investmentLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    investmentValue: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
    },
    actionButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    actionButtonText: {
        color: '#111827',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.25,
        fontSize: 12,
    },
});
