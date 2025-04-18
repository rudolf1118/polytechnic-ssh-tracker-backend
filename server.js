import http from 'http';
import dbConnection from './db_connect.js';
import { handleAPIRoutes } from './api/routes.js';
import { studentService } from './controller/controllers.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import { dirname } from 'path';
const dir = dirname(__filename);
const caller = process.argv[1];
const PORT = 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    await dbConnection.connect();
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