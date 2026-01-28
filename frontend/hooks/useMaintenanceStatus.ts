import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../api';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

interface MaintenanceStatus {
    isActive: boolean;
    isScheduled: boolean;
    message: string;
    expectedDuration?: string;
    startsAt: string | null;
    remainingSeconds: number;
}

export const useMaintenanceStatus = (userType?: string) => {
    const router = useRouter();
    const [status, setStatus] = useState<MaintenanceStatus>({
        isActive: false,
        isScheduled: false,
        message: '',
        startsAt: null,
        remainingSeconds: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(API_ENDPOINTS.MAINTENANCE_STATUS);
            const data = await response.json();

            if (data.success) {
                const newStatus = data.data;
                setStatus(newStatus);

                // If maintenance just became active and user is a buyer, inform them via UI
                // No need to delete tokens as we want them to stay on the maintenance screen
                // instead of being kicked back to the login page.
            }
        } catch (error) {
            console.error('Error fetching maintenance status:', error);
        } finally {
            setLoading(false);
        }
    }, [userType, status.isActive, router]);

    useEffect(() => {
        // Initial fetch
        fetchStatus();

        // Poll every 15 seconds to reduce log noise
        const interval = setInterval(fetchStatus, 15000);

        return () => clearInterval(interval);
    }, [fetchStatus]);

    return { ...status, loading };
};
