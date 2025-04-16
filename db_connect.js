import mongoose from 'mongoose';
import config from './config.js';
const { db_uri } = config;

class DatabaseConnection {
    static instance = null;

    constructor() {}

    static getInstance() {
        if (!this.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async connect() {
        try {
            await mongoose.connect(db_uri);
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }
}

const dbInstance = DatabaseConnection.getInstance();
export default dbInstance;