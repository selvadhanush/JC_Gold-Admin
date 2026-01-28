import Toast from 'react-native-toast-message';

export const showToast = {
    success: (message: string, title: string = 'SUCCESS') => {
        console.log('showToast.success called:', { title, message });
        Toast.show({
            type: 'success',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
            autoHide: true,
        });
    },

    error: (message: string, title: string = 'ERROR') => {
        console.log('showToast.error called:', { title, message });
        Toast.show({
            type: 'error',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
            autoHide: true,
        });
    },

    info: (message: string, title: string = 'INFO') => {
        console.log('showToast.info called:', { title, message });
        Toast.show({
            type: 'info',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3000,
            topOffset: 60,
            autoHide: true,
        });
    },

    warning: (message: string, title: string = 'WARNING') => {
        console.log('showToast.warning called:', { title, message });
        Toast.show({
            type: 'warning',
            text1: title,
            text2: message,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 60,
            autoHide: true,
        });
    },
};
