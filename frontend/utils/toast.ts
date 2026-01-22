import Toast from 'react-native-toast-message';

export const showToast = {
    success: (message: string, title: string = 'SUCCESSFUL') => {
        Toast.show({
            type: 'success',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    error: (message: string, title: string = 'ERROR ACTION') => {
        Toast.show({
            type: 'error',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
        });
    },

    info: (message: string, title: string = 'INFORMATION') => {
        Toast.show({
            type: 'info',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
        });
    },

    warning: (message: string, title: string = 'WARNING NOTICE') => {
        Toast.show({
            type: 'info', // Using info type for warning but with warning title
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 60,
        });
    },
};
