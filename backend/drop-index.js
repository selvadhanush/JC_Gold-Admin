const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const dropIndex = async () => {
    await connectDB();

    try {
        const collection = mongoose.connection.collection('goldrates');

        // List indexes to verify
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const indexName = 'date_1_metalType_1';

        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Dropping index: ${indexName}...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully!');
        } else {
            console.log(`Index ${indexName} not found.`);
        }

        process.exit();
    } catch (error) {
        console.error('Error dropping index:', error);
        process.exit(1);
    }
};

dropIndex();
