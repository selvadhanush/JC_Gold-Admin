const Admin = require('../models/Admin');
const Role = require('../models/Role');

const seedSuperAdmin = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Ensure Roles exist
        const roles = ['SUPER_ADMIN', 'PRODUCT_ADMIN', 'ORDER_ADMIN', 'FINANCE_ADMIN'];
        for (const roleName of roles) {
            const roleExists = await Role.findOne({ name: roleName });
            if (!roleExists) {
                await Role.create({ name: roleName });
                console.log(`✅ Role ${roleName} created`);
            }
        }

        // 2. Find Super Admin role
        const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
        console.log('🔑 Super Admin Role ID:', superAdminRole?._id);

        // 3. Check if Super Admin already exists
        const adminEmail = 'adminEmail@gmail.com';
        const adminPassword = 'superadmin123';
        const adminExists = await Admin.findOne({ email: adminEmail });

        if (!adminExists) {
            const newAdmin = await Admin.create({
                name: 'System Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: superAdminRole._id,
                isActive: true
            });
            console.log('\n🎉 ========================================');
            console.log('✅ Super Admin Account Created Successfully!');
            console.log('📧 Email:', adminEmail);
            console.log('🔒 Password:', adminPassword);
            console.log('👤 Role:', 'SUPER_ADMIN');
            console.log('🆔 Admin ID:', newAdmin._id);
            console.log('========================================\n');
        } else {
            // Ensure the existing Super Admin is active
            if (!adminExists.isActive) {
                adminExists.isActive = true;
                await adminExists.save();
                console.log('⚠️  Super Admin was inactive - NOW ACTIVATED!');
            }

            console.log('\n📌 Super Admin account already exists');
            console.log('📧 Email:', adminEmail);
            console.log('🔒 Password:', adminPassword);
            console.log('🆔 Admin ID:', adminExists._id);
            console.log('✅ Active:', adminExists.isActive);
            console.log('');
        }
    } catch (error) {
        console.error('❌ Seeding Error:', error);
    }
};

module.exports = seedSuperAdmin;
