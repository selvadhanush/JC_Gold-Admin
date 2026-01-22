const connectDB = require('./src/config/db');
const seedSuperAdmin = require('./src/utils/seeder');

const runSeeder = async () => {
    try {
        await connectDB();
        await seedSuperAdmin();
        console.log('Database seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

runSeeder();
