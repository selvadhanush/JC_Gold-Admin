try {
    const lightningcss = require('lightningcss');
    console.log('✓ lightningcss loaded successfully');
    console.log('Module:', Object.keys(lightningcss));
} catch (error) {
    console.error('✗ Failed to load lightningcss');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\nFull error:');
    console.error(error);
}
