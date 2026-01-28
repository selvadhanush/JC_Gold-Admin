import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    style?: any;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    style,
}: ButtonProps) {
    const baseClasses = 'rounded-xl flex-row items-center justify-center active:opacity-80';

    const variantClasses = {
        primary: 'bg-primary-500',
        secondary: 'bg-gold-500',
        outline: 'bg-transparent border-2 border-primary-500',
    };

    const sizeClasses = {
        sm: 'px-4 py-2',
        md: 'px-6 py-3',
        lg: 'px-8 py-4',
    };

    const textVariantClasses = {
        primary: 'text-white',
        secondary: 'text-white',
        outline: 'text-primary-500',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const disabledClasses = disabled || loading ? 'opacity-50' : '';

    return (
        <TouchableOpacity
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
            onPress={onPress}
            disabled={disabled || loading}
            style={style}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#f97316' : '#ffffff'} />
            ) : (
                <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-bold`}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}
