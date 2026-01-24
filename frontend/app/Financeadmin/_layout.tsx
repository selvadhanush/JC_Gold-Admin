import { Tabs } from 'expo-router';
import FinanceAdminNav from '../../components/FinanceAdminNav';

export default function FinanceAdminLayout() {
    return (
        <Tabs
            tabBar={(props) => {
                const routeName = props.state.routes[props.state.index].name;
                const tabMap: Record<string, any> = {
                    'index': 'dashboard',
                    'waiting_confirmation': 'orders',
                    'schemes': 'schemes',
                    'payments': 'payments',
                    'refunds': 'refunds',
                    'enrollments': 'enrollments',
                    'installments': 'installments',
                    'reports': 'reports'
                };
                return <FinanceAdminNav activeTab={tabMap[routeName] || 'dashboard'} />;
            }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
            <Tabs.Screen name="waiting_confirmation" options={{ title: 'Waiting Confirmation' }} />
            <Tabs.Screen name="schemes" options={{ title: 'Schemes' }} />
            <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
            <Tabs.Screen name="refunds" options={{ title: 'Refunds' }} />
            <Tabs.Screen name="enrollments" options={{ title: 'Enrollments' }} />
            <Tabs.Screen name="installments" options={{ title: 'Installments' }} />
            <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
            <Tabs.Screen name="digital_gold" options={{ title: 'Digital Gold', href: null }} />
        </Tabs>
    );
}
