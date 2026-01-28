import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_TOKEN_KEY = 'biometric_token';
const BIOMETRIC_PHONE_KEY = 'biometric_phone';

export const BiometricUtils = {
    /**
     * Check if device supports biometric authentication
     */
    async isAvailable(): Promise<boolean> {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (!compatible) return false;

            const enrolled = await LocalAuthentication.isEnrolledAsync();
            return enrolled;
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            return false;
        }
    },

    /**
     * Get supported biometric types
     */
    async getSupportedTypes(): Promise<string[]> {
        try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            return types.map(type => {
                switch (type) {
                    case LocalAuthentication.AuthenticationType.FINGERPRINT:
                        return 'Fingerprint';
                    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                        return 'Face Recognition';
                    case LocalAuthentication.AuthenticationType.IRIS:
                        return 'Iris';
                    default:
                        return 'Biometric';
                }
            });
        } catch (error) {
            console.error('Error getting supported types:', error);
            return [];
        }
    },

    /**
     * Authenticate with biometrics
     */
    async authenticate(promptMessage: string = 'Authenticate to continue'): Promise<boolean> {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
                fallbackLabel: 'Use Passcode',
            });

            return result.success;
        } catch (error) {
            console.error('Error during biometric authentication:', error);
            return false;
        }
    },

    /**
     * Enable biometric login and store credentials
     */
    async enableBiometric(token: string, phone: string): Promise<boolean> {
        try {
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
            await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
            await SecureStore.setItemAsync(BIOMETRIC_PHONE_KEY, phone);
            return true;
        } catch (error) {
            console.error('Error enabling biometric:', error);
            return false;
        }
    },

    /**
     * Disable biometric login and clear stored credentials
     */
    async disableBiometric(): Promise<boolean> {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_PHONE_KEY);
            return true;
        } catch (error) {
            console.error('Error disabling biometric:', error);
            return false;
        }
    },

    /**
     * Check if biometric login is enabled
     */
    async isEnabled(): Promise<boolean> {
        try {
            const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
            return enabled === 'true';
        } catch (error) {
            console.error('Error checking if biometric is enabled:', error);
            return false;
        }
    },

    /**
     * Get stored credentials for biometric login
     */
    async getStoredCredentials(): Promise<{ token: string; phone: string } | null> {
        try {
            const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
            const phone = await SecureStore.getItemAsync(BIOMETRIC_PHONE_KEY);

            if (token && phone) {
                return { token, phone };
            }
            return null;
        } catch (error) {
            console.error('Error getting stored credentials:', error);
            return null;
        }
    },
};
