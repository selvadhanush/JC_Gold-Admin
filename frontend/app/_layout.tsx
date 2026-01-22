import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { Stack } from 'expo-router';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#10b981',
                backgroundColor: '#ffffff',
                height: 70,
                borderRadius: 20,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 5,
                borderLeftWidth: 10,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#064e3b'
            }}
            text2Style={{
                fontSize: 13,
                color: '#065f46',
                fontWeight: '600'
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 16 }}>
                    <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                </View>
            )}
        />
    ),
    error: (props: any) => (
        <ErrorToast
            {...props}
            style={{
                borderLeftColor: '#ef4444',
                backgroundColor: '#ffffff',
                height: 70,
                borderRadius: 20,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 5,
                borderLeftWidth: 10,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#7f1d1d'
            }}
            text2Style={{
                fontSize: 13,
                color: '#991b1b',
                fontWeight: '600'
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 16 }}>
                    <Ionicons name="alert-circle" size={28} color="#ef4444" />
                </View>
            )}
        />
    ),
    info: (props: any) => (
        <InfoToast
            {...props}
            style={{
                borderLeftColor: '#3b82f6',
                backgroundColor: '#ffffff',
                height: 70,
                borderRadius: 20,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 5,
                borderLeftWidth: 10,
            }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            text1Style={{
                fontSize: 16,
                fontWeight: '900',
                color: '#1e3a8a'
            }}
            text2Style={{
                fontSize: 13,
                color: '#1e40af',
                fontWeight: '600'
            }}
            renderLeadingIcon={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 16 }}>
                    <Ionicons name="information-circle" size={28} color="#3b82f6" />
                </View>
            )}
        />
    )
};

export default function RootLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: '#f97316',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="login"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="signup"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'JC Gold Admin',
                        headerShown: true
                    }}
                />
                <Stack.Screen
                    name="dashboard"
                    options={{
                        title: 'Dashboard',
                        headerShown: true
                    }}
                />
                <Stack.Screen
                    name="products"
                    options={{
                        title: 'Products',
                        headerShown: true
                    }}
                />
                <Stack.Screen
                    name="buyer_dashboard"
                    options={{
                        title: 'Shop',
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        headerShown: true
                    }}
                />
                <Stack.Screen
                    name="addresses"
                    options={{
                        title: 'My Addresses',
                        headerShown: true
                    }}
                />
                <Stack.Screen
                    name="products_browse"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="product_detail"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="wishlist"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="cart"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="orders"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="notifications"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="Superadmin"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="Productadmin"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="checkout"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="buyer_tickets"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="order_detail"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="order_support"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
            <Toast config={toastConfig} />
        </>
    );
}
