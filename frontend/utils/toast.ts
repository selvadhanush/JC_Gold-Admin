import Toast from 'react-native-toast-message';

export const showToast = {
    success: (message: string, title: string = 'Success') => {
        Toast.show({
            type: 'success',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 50,
        });
    },

    error: (message: string, title: string = 'Error') => {
        Toast.show({
            type: 'error',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 50,
        });
    },

    info: (message: string, title: string = 'Info') => {
        Toast.show({
            type: 'info',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 50,
        });
    },

    warning: (message: string, title: string = 'Warning') => {
        Toast.show({
            type: 'error', // Using error type for warning (styled as yellow/orange)
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 50,
        });
    },
};
