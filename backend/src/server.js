const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const seedSuperAdmin = require('./utils/seeder');
const { startMaintenanceScheduler } = require('./utils/maintenanceScheduler');

// Connect to database
connectDB().then(() => {
    seedSuperAdmin();
    // Start maintenance scheduler
    startMaintenanceScheduler();
});

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
