const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const Admin = require('../models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Seed Roles
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Full access to all modules' },
      { name: 'PRODUCT_ADMIN', description: 'Manage products and categories' },
      { name: 'ORDER_ADMIN', description: 'Manage orders and shipping' },
      { name: 'FINANCE_ADMIN', description: 'Manage schemes and payments' }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.name}`);
      }
    }

    // 2. Seed Super Admin
    const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
    const existingAdmin = await Admin.findOne({ email: 'admin@jewellery.com' });

    if (!existingAdmin) {
      await Admin.create({
        name: 'Super Admin',
        email: 'admin@jewellery.com',
        password: 'admin123', // Will be hashed by pre-save middleware
        role: superAdminRole._id
      });
      console.log('Created Super Admin: admin@jewellery.com / admin123');
    }

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
