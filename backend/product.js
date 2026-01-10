const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    console.error('Dotenv error:', dotenvResult.error);
} else {
    console.log('Dotenv loaded successfully');
}

const categories = [
    { _id: '64bfa1c2e4a1234567890001', name: 'Necklaces', description: 'Traditional and modern necklaces', isActive: true },
    { _id: '64bfa1c2e4a1234567890002', name: 'Rings', description: 'Gold and diamond rings', isActive: true },
    { _id: '64bfa1c2e4a1234567890003', name: 'Anklets', description: 'Silver and gold anklets', isActive: true },
    { _id: '64bfa1c2e4a1234567890004', name: 'Wedding Bands', description: 'Platinum and gold wedding bands', isActive: true },
    { _id: '64bfa1c2e4a1234567890005', name: 'Coins', description: 'Purity guaranteed gold and silver coins', isActive: true }
];

const products = [
    {
        name: "22K Gold Bridal Necklace",
        sku: "JC-GOLD-NECK-001",
        description: "Traditional 22K gold bridal necklace with intricate craftsmanship. Perfect for weddings and special occasions.",
        price: 200000,
        category: "64bfa1c2e4a1234567890001",
        images: [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "GOLD",
            purity: "22K",
            weight: 45.5,
            size: "Standard"
        },

        status: "ACTIVE",
        isFeatured: true
    },
    {
        name: "18K Gold Diamond Ring",
        sku: "JC-GOLD-RING-002",
        description: "Elegant 18K gold ring with certified diamond. A timeless piece for engagements.",
        price: 70000,
        category: "64bfa1c2e4a1234567890002",
        images: [
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "GOLD",
            purity: "18K",
            weight: 6.8,
            size: "7"
        },

        status: "ACTIVE",
        isFeatured: true
    },
    {
        name: "Silver Anklet Pair",
        sku: "JC-SIL-ANK-003",
        description: "Pure silver anklet pair with traditional design and ghungroo bells.",
        price: 5000,
        category: "64bfa1c2e4a1234567890003",
        images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "SILVER",
            purity: "925",
            weight: 32,
            size: "Free Size"
        },

        status: "ACTIVE",
        isFeatured: false
    },
    {
        name: "Platinum Wedding Band",
        sku: "JC-PLAT-RING-004",
        description: "Minimalist platinum wedding band for daily wear. Durable and elegant.",
        price: 106000,
        category: "64bfa1c2e4a1234567890004",
        images: [
            "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "PLATINUM",
            purity: "950",
            weight: 9.5,
            size: "8"
        },

        status: "ACTIVE",
        isFeatured: true
    },
    {
        name: "Gold Coin 10g",
        sku: "JC-GOLD-COIN-005",
        description: "24K pure gold coin ideal for investment. Comes with purity certificate.",
        price: 72000,
        category: "64bfa1c2e4a1234567890005",
        images: [
            "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "GOLD",
            purity: "24K",
            weight: 10,
            size: "Round"
        },

        status: "ACTIVE",
        isFeatured: true
    },
    {
        name: "Traditional Gold Bangles Set",
        sku: "JC-GOLD-BANG-006",
        description: "Set of 4 traditional gold bangles with intricate patterns.",
        price: 137000,
        category: "64bfa1c2e4a1234567890001",
        images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop"
        ],
        specifications: {
            metalType: "GOLD",
            purity: "22K",
            weight: 35,
            size: "2.6"
        },

        status: "ACTIVE",
        isFeatured: true
    }
];

const seedDB = async () => {
    try {
        console.log('=== Starting Database Seeding ===');
        console.log('Using MONGO_URI:', process.env.MONGO_URI ? 'Defined' : 'UNDEFINED');

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Seed Categories
        console.log('\n--- Seeding Categories ---');
        for (const cat of categories) {
            const result = await Category.findByIdAndUpdate(
                cat._id,
                cat,
                { upsert: true, new: true }
            );
            console.log(`✓ Category: ${result.name}`);
        }
        console.log(`✓ ${categories.length} categories seeded`);

        // Seed Products
        console.log('\n--- Seeding Products ---');
        for (const prod of products) {
            const result = await Product.findOneAndUpdate(
                { sku: prod.sku },
                prod,
                { upsert: true, new: true }
            );
            console.log(`✓ Product: ${result.name} (${result.sku})`);
        }
        console.log(`✓ ${products.length} products seeded`);

        console.log('\n=== Seeding Completed Successfully ===');
        console.log(`Total Categories: ${categories.length}`);
        console.log(`Total Products: ${products.length}`);
        console.log(`Featured Products: ${products.filter(p => p.isFeatured).length}`);

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR DURING SEEDING:');
        console.error(error);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('\n✓ MongoDB connection closed');
        }
    }
};

seedDB();
