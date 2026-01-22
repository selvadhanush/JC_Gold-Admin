const fs = require('fs');

console.log('Loading metro config...');
try {
    const config = require('./metro.config.js');
    fs.writeFileSync('metro-test-result.txt', '✓ Metro config loaded successfully\n' + JSON.stringify(config, null, 2), 'utf8');
    console.log('✓ Metro config loaded successfully');
} catch (error) {
    const errorInfo = `✗ Failed to load metro config
Error: ${error.message}
Code: ${error.code}

Full stack:
${error.stack}`;
    fs.writeFileSync('metro-test-result.txt', errorInfo, 'utf8');
    console.error(errorInfo);
}
