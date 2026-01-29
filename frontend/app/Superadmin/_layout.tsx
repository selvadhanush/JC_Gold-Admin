import { Tabs } from 'expo-router';
import SuperAdminNav from '../../components/SuperAdminNav';

export default function SuperAdminLayout() {
    return (
        <Tabs
            tabBar={(props) => {
                const routeName = props.state.routes[props.state.index].name;
                const tabMap: Record<string, any> = {
                    'index': 'dashboard',
                    'manage_admins': 'admins',
                    'manage_users': 'users',
                    'manage_kyc': 'users',
                    'manage_tickets': 'users',
                    'audit_logs': 'audit',
                    'system_settings': 'settings',
                    'manage_gold_rates': 'rates'
                };
                return <SuperAdminNav activeTab={tabMap[routeName] || 'dashboard'} />;
            }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="manage_gold_rates" options={{ title: 'Gold Rates' }} />
            <Tabs.Screen name="manage_admins" options={{ title: 'Admins' }} />
            <Tabs.Screen name="manage_users" options={{ title: 'Buyers' }} />
            <Tabs.Screen name="manage_kyc" options={{ title: 'KYC Verification', href: null }} />
            <Tabs.Screen name="manage_tickets" options={{ title: 'Support Tickets', href: null }} />
            <Tabs.Screen name="audit_logs" options={{ title: 'Audit' }} />
            <Tabs.Screen name="system_settings" options={{ title: 'System' }} />
            <Tabs.Screen name="admin_user_details" options={{ href: null, tabBarStyle: { display: 'none' } }} />
            <Tabs.Screen name="digital_gold_view" options={{ href: null, title: 'Digital Gold View' }} />
            <Tabs.Screen name="gold_rates" options={{ href: null, title: 'Gold Rates' }} />
            <Tabs.Screen name="cms_control" options={{ href: null, title: 'CMS Control' }} />
            <Tabs.Screen name="reports" options={{ href: null, title: 'Reports' }} />

        </Tabs>
    );
}
