import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

interface MpinInputProps {
    value: string;
    onValueChange: (value: string) => void;
    length?: number;
    disabled?: boolean;
    secure?: boolean;
}

export default function MpinInput({
    value,
    onValueChange,
    length = 6,
    disabled = false,
    secure = true
}: MpinInputProps) {
    const inputs = useRef<TextInput[]>([]);
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Split the value into array of chars
    const pinArray = value.split('').slice(0, length);
    // Pad with empty strings if needed
    while (pinArray.length < length) pinArray.push('');

    const handleChange = (text: string, index: number) => {
        if (disabled) return;

        const newPin = [...pinArray];
        newPin[index] = text.slice(-1); // Take only the last character if multiple are entered
        const combined = newPin.join('');
        onValueChange(combined);

        // Move focus forward if text was entered
        if (text && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (disabled) return;

        if (e.nativeEvent.key === 'Backspace') {
            if (!pinArray[index] && index > 0) {
                // If current is empty, move back and clear previous
                const newPin = [...pinArray];
                newPin[index - 1] = '';
                onValueChange(newPin.join(''));
                inputs.current[index - 1]?.focus();
            } else {
                // Just clear current
                const newPin = [...pinArray];
                newPin[index] = '';
                onValueChange(newPin.join(''));
            }
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length }).map((_, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => {
                        if (ref) inputs.current[index] = ref;
                    }}
                    style={[
                        styles.input,
                        focusedIndex === index && styles.inputFocused,
                        pinArray[index] !== '' && styles.inputFilled,
                        disabled && styles.disabled
                    ]}
                    value={pinArray[index]}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry={secure && pinArray[index] !== ''}
                    editable={!disabled}
                    autoFocus={index === 0}
                    selectionColor="#ea580c"
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    input: {
        width: 48,
        height: 64,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#f3f4f6',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    inputFocused: {
        borderColor: '#ea580c',
        backgroundColor: '#fff',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    inputFilled: {
        borderColor: '#ea580c',
        backgroundColor: '#fff',
    },
    disabled: {
        opacity: 0.5,
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
    }
});
