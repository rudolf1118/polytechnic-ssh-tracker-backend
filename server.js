import http from 'http';
import dbConnection from './db_connect.js';
import { handleAPIRoutes } from './api/routes.js';
import { studentService } from './controller/student.controller.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import { dirname } from 'path';
const dir = dirname(__filename);
const PORT = 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    handleAPIRoutes(req, res).then(() => { console.log(`Request method: ${req.method}, URL: ${req.url}`); })
        .catch((err) => {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        });
});

try {
  (async () => {
    await dbConnection.connect();
    console.log(studentService)
  }
  )().catch((error) => {
    throw error
  });
  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    // dbConnection.disconnect();
  });
} catch (error) {
  console.error('Error starting the server:', error);
  dbConnection.disconnect();
  process.exit(1);
}