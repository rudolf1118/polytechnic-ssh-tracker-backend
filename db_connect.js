import mongoose from 'mongoose';
import { db_uri } from './config.js';
import ora from 'ora';

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
            const spinner = ora('Connecting to MongoDB...').start();
            await mongoose.connect(db_uri);
            spinner.succeed('Connected to MongoDB');
        } catch (error) {
            console.error('\nError connecting to MongoDB:', error);
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