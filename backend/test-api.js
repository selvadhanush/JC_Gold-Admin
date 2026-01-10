const fetch = require('node-fetch');

const testAPI = async () => {
    try {
        console.log('Testing API endpoint...\n');

        const response = await fetch('http://localhost:5000/api/v1/buyer/products');
        const data = await response.json();

        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\nProduct count:', data.count);

        if (data.data && data.data.length > 0) {
            console.log('\nFirst product:');
            console.log(JSON.stringify(data.data[0], null, 2));
        }

        console.log('\n--- Testing with isFeatured filter ---');
        const featuredResponse = await fetch('http://localhost:5000/api/v1/buyer/products?isFeatured=true');
        const featuredData = await featuredResponse.json();
        console.log('Featured products count:', featuredData.count);

    } catch (error) {
        console.error('Error:', error.message);
    }
};

testAPI();
