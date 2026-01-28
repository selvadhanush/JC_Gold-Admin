import { Tabs } from 'expo-router';
import OrderAdminNav from '../../components/OrderAdminNav';

export default function OrderAdminLayout() {
    return (
        <Tabs
            tabBar={(props) => {
                const routeName = props.state.routes[props.state.index].name;
                const tabMap: Record<string, any> = {
                    'index': 'dashboard',
                    'orders': 'orders',
                    'pending': 'pending',
                    'manage': 'manage',
                    'shipped': 'shipped',
                    'physical_gold_delivery': 'gold',
                    'hub': 'hub'
                };
                return <OrderAdminNav activeTab={tabMap[routeName] || 'dashboard'} />;
            }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard'
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'All Orders'
                }}
            />
            <Tabs.Screen
                name="pending"
                options={{
                    title: 'Pending Orders'
                }}
            />
            <Tabs.Screen
                name="shipped"
                options={{
                    title: 'Shipped Orders'
                }}
            />
            <Tabs.Screen
                name="manage"
                options={{
                    title: 'Order Management'
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    href: null,
                    title: 'Analytics'
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    href: null,
                    title: 'Notifications'
                }}
            />
            <Tabs.Screen
                name="order_detail"
                options={{
                    href: null,
                    title: 'Order Details'
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    href: null,
                    title: 'All Tickets'
                }}
            />
            <Tabs.Screen
                name="physical_gold_delivery"
                options={{
                    title: 'Physical Gold Deliveries'
                }}
            />
        </Tabs>
    );
}
