const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const simpleCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check total products
        const total = await Product.countDocuments();
        console.log(`Total products in database: ${total}`);

        // Check ACTIVE products
        const active = await Product.countDocuments({ status: 'ACTIVE' });
        console.log(`ACTIVE products: ${active}`);

        // Check featured products
        const featured = await Product.countDocuments({ isFeatured: true });
        console.log(`Featured products: ${featured}`);

        // Check ACTIVE + Featured
        const activeFeatured = await Product.countDocuments({ status: 'ACTIVE', isFeatured: true });
        console.log(`ACTIVE + Featured products: ${activeFeatured}`);

        // List all products with their status
        const allProducts = await Product.find({}, 'name status isFeatured');
        console.log('\nAll products:');
        allProducts.forEach(p => {
            console.log(`- ${p.name}: status=${p.status}, featured=${p.isFeatured}`);
        });

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

simpleCheck();
