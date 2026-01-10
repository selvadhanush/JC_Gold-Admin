import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
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
                    name="checkout"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
            <Toast />
        </>
    );
}
