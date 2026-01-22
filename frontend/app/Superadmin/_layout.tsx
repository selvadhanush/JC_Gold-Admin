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
                    'audit_logs': 'audit',
                    'system_settings': 'settings'
                };
                return <SuperAdminNav activeTab={tabMap[routeName] || 'dashboard'} />;
            }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="manage_admins" options={{ title: 'Admins' }} />
            <Tabs.Screen name="manage_users" options={{ title: 'Buyers' }} />
            <Tabs.Screen name="audit_logs" options={{ title: 'Audit' }} />
            <Tabs.Screen name="system_settings" options={{ title: 'System' }} />
        </Tabs>
    );
}
