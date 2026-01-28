import { Tabs } from 'expo-router';
import ProductAdminNav from '../../components/ProductAdminNav';

export default function ProductAdminLayout() {
    return (
        <Tabs
            tabBar={(props) => {
                const routeName = props.state.routes[props.state.index].name;
                const tabMap: Record<string, any> = {
                    'index': 'dashboard',
                    'categories': 'categories',
                    'products': 'products',
                    'inventory': 'inventory'
                };
                return <ProductAdminNav activeTab={tabMap[routeName] || 'dashboard'} navigation={props.navigation} />;
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
                name="categories"
                options={{
                    title: 'Categories'
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products'
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Inventory'
                }}
            />
        </Tabs>
    );
}
