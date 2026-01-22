const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

async function fixCategoryImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all categories with images that start with /uploads/
        const categories = await Category.find({
            image: { $regex: '^/uploads/' }
        });

        console.log(`Found ${categories.length} categories with incorrect image paths`);

        for (const category of categories) {
            const oldPath = category.image;
            // Convert /uploads/jc_gold/products/abc123 to https://res.cloudinary.com/dpclbk9dg/image/upload/jc_gold/products/abc123
            const cloudinaryPath = oldPath.replace('/uploads/', '');
            const newUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cloudinaryPath}`;

            category.image = newUrl;
            await category.save();

            console.log(`✅ Updated ${category.name}:`);
            console.log(`   Old: ${oldPath}`);
            console.log(`   New: ${newUrl}`);
        }

        console.log('\n✅ All category images fixed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixCategoryImages();
