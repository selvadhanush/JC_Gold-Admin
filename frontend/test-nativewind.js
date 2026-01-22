console.log('Step 1: Loading react-native-css-interop...');
try {
    const cssInterop = require('react-native-css-interop');
    console.log('✓ react-native-css-interop loaded');
} catch (error) {
    console.error('✗ react-native-css-interop failed:', error.message);
    process.exit(1);
}

console.log('\nStep 2: Loading react-native-css-interop/dist/metro...');
try {
    const metro = require('react-native-css-interop/dist/metro');
    console.log('✓ react-native-css-interop/dist/metro loaded');
} catch (error) {
    console.error('✗ react-native-css-interop/dist/metro failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('\nStep 3: Loading nativewind/metro...');
try {
    const nativewind = require('nativewind/metro');
    console.log('✓ nativewind/metro loaded');
} catch (error) {
    console.error('✗ nativewind/metro failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('\n✓ All modules loaded successfully!');
