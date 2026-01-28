import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { BiometricUtils } from '../utils/biometric';

interface BiometricContextType {
    isAvailable: boolean;
    isEnabled: boolean;
    isLocked: boolean;
    supportedTypes: string[];
    enableBiometric: (token: string, phone: string) => Promise<boolean>;
    disableBiometric: () => Promise<boolean>;
    authenticate: (promptMessage?: string) => Promise<boolean>;
    unlock: () => void;
    checkAvailability: () => Promise<void>;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [supportedTypes, setSupportedTypes] = useState<string[]>([]);

    const appState = useRef(AppState.currentState);
    const backgroundTime = useRef<number | null>(null);
    const LOCK_THRESHOLD = 30000; // 30 seconds

    useEffect(() => {
        checkAvailability();
        checkEnabled();

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const checkAvailability = async () => {
        const available = await BiometricUtils.isAvailable();
        setIsAvailable(available);

        if (available) {
            const types = await BiometricUtils.getSupportedTypes();
            setSupportedTypes(types);
        }
    };

    const checkEnabled = async () => {
        const enabled = await BiometricUtils.isEnabled();
        setIsEnabled(enabled);
    };

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        // App going to background
        if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
            backgroundTime.current = Date.now();
        }

        // App coming to foreground
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            const enabled = await BiometricUtils.isEnabled();

            if (enabled && backgroundTime.current) {
                const timeInBackground = Date.now() - backgroundTime.current;

                // Lock app if it was in background for more than threshold
                if (timeInBackground > LOCK_THRESHOLD) {
                    setIsLocked(true);
                }
            }

            backgroundTime.current = null;
        }

        appState.current = nextAppState;
    };

    const enableBiometric = async (token: string, phone: string): Promise<boolean> => {
        const success = await BiometricUtils.enableBiometric(token, phone);
        if (success) {
            setIsEnabled(true);
        }
        return success;
    };

    const disableBiometric = async (): Promise<boolean> => {
        const success = await BiometricUtils.disableBiometric();
        if (success) {
            setIsEnabled(false);
        }
        return success;
    };

    const authenticate = async (promptMessage?: string): Promise<boolean> => {
        return await BiometricUtils.authenticate(promptMessage);
    };

    const unlock = () => {
        setIsLocked(false);
    };

    return (
        <BiometricContext.Provider
            value={{
                isAvailable,
                isEnabled,
                isLocked,
                supportedTypes,
                enableBiometric,
                disableBiometric,
                authenticate,
                unlock,
                checkAvailability,
            }}
        >
            {children}
        </BiometricContext.Provider>
    );
};

export const useBiometric = () => {
    const context = useContext(BiometricContext);
    if (!context) {
        throw new Error('useBiometric must be used within BiometricProvider');
    }
    return context;
};
