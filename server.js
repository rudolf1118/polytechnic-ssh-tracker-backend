import http from 'http';
import dbConnection from './db_connect.js';
import { handleAPIRoutes } from './api/routes.js';
import studentService  from './controller/student.controller.js';
import { port } from './config.js';
import ora from 'ora';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import { dirname } from 'path';
const dir = dirname(__filename);
const caller = process.argv[1];
const PORT = port || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // * cors-origin check
  if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
  }

    handleAPIRoutes(req, res)?.then(() => { console.log(`Request method: ${req.method}, URL: ${req.url}`); })
        .catch((err) => {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }).catch((err => {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }));
});

export const initializeServerDB = async () => {
  try {
    const spinner = ora('Connecting to the database...').start();
    try {
      await dbConnection.connect();
      spinner.succeed('Database connected successfully.');
    } catch (error) {
      spinner.fail('Failed to connect to the database.');
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const closeServerDB = async () => {
  try {
    await dbConnection.disconnect();
  } catch (error) {
    throw error;
  }
}

if (import.meta.url === 'file://' + caller) {
  try {

    await initializeServerDB();

    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
      console.error('Error starting the server:', error);
      dbConnection.disconnect();
      process.exit(1);
  }
}