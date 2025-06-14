# Polytech SSH Server's Activity Tracker Backend

A Node.js backend service for tracking student activities and managing student information at Polytech.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Scripts](#scripts)
- [Security](#security)
- [License](#license)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- Student management system
- Activity tracking and monitoring
- SSH connection management
- Authentication and authorization
- Activity synchronization
- Top participants tracking
- Group-based activity monitoring

## Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB
- SSH access to student servers
- Environment variables configured

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd polytech-tracker-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see Configuration section)

4. Start the server:
```bash
npm start
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_USER=your_mongodb_user
MONGODB_PASSWORD=your_mongodb_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# SSH Configuration
SSH_HOST=your_ssh_host
SSH_USER=your_ssh_user
SSH_PASSWORD=your_ssh_password
SSH_PORT=22

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
- Authenticate user and get JWT token
- Body: `{ username: string, password: string }`

**Request Example:**
```json
{
    "username": "johndoe",
    "password": "securepassword123"
}
```

**Response Example:**
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "123456",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "group": "A1"
    }
}
```

**Error Response Example:**
```json
{
    "error": {
        "code": "AUTH_FAILED",
        "message": "Invalid username or password",
        "details": {
            "attempts": 1,
            "maxAttempts": 5
        }
    }
}
```

#### GET /api/auth/verify
- Verify JWT token validity
- Headers: `Authorization: Bearer <token>`

**Response Example:**
```json
{
    "message": "Token is valid",
    "user": {
        "id": "123456",
        "username": "johndoe"
    }
}
```

**Error Response Example:**
```json
{
    "error": {
        "code": "INVALID_TOKEN",
        "message": "Token has expired",
        "details": {
            "expiredAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### Student Endpoints

#### GET /api/student/search
- Search students by various criteria
- Query parameters:
  - `firstName` & `lastName`
  - `username`
  - `id`
  - `group`

**Request Examples:**
```
GET /api/student/search?firstName=John&lastName=Doe
GET /api/student/search?username=johndoe
GET /api/student/search?group=A1
```

**Response Example:**
```json
{
    "message": "Student found",
    "data": {
        "id": "123456",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "group": "A1",
        "email": "john.doe@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Error Response Example:**
```json
{
    "error": {
        "code": "STUDENT_NOT_FOUND",
        "message": "No student found with the provided criteria",
        "details": {
            "searchCriteria": {
                "firstName": "John",
                "lastName": "Doe"
            }
        }
    }
}
```

### Activity Endpoints

#### GET /api/activity/search
- Search activities by various criteria
- Query parameters:
  - `firstName` & `lastName`
  - `username`
  - `id`
  - `studentId`

**Request Examples:**
```
GET /api/activity/search?firstName=John&lastName=Doe
GET /api/activity/search?username=johndoe
GET /api/activity/search?studentId=123456
```

**Response Example:**
```json
{
    "message": "Activities found",
    "data": [
        {
            "id": "789012",
            "studentId": "123456",
            "type": "assignment",
            "title": "Project Submission",
            "description": "Submitted final project",
            "points": 100,
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ],
    "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10
    }
}
```

## Database Schema

### Student Schema
```javascript
{
    id: String,
    firstName: String,
    lastName: String,
    username: String,
    password: String (hashed),
    group: String,
    email: String,
    createdAt: Date,
    updatedAt: Date,
    lastLogin: Date,
    status: String,
    role: String
}
```

### Activity Schema
```javascript
{
    id: String,
    studentId: String,
    type: String,
    title: String,
    description: String,
    points: Number,
    createdAt: Date,
    updatedAt: Date,
    status: String,
    metadata: Object
}
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {} // Optional additional error details
    }
}
```

Common error codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:
- 100 requests per 15 minutes per IP address
- 1000 requests per hour per user

When rate limit is exceeded, the API returns:
```json
{
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many requests, please try again later",
        "details": {
            "retryAfter": 900, // seconds
            "limit": 100,
            "window": "15m"
        }
    }
}
```

## Deployment

### Production Deployment

1. Set up environment variables:
```bash
export NODE_ENV=production
export PORT=3000
export MONGODB_URI=your_production_mongodb_uri
export JWT_SECRET=your_production_jwt_secret
```

2. Build the application:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t polytech-tracker-backend .
```

2. Run the container:
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  polytech-tracker-backend
```

## Troubleshooting

### Common Issues

1. Database Connection Issues
```bash
Error: MongoDB connection failed
Solution: Check MONGODB_URI and network connectivity
```

2. JWT Authentication Issues
```bash
Error: Invalid token
Solution: Ensure JWT_SECRET is properly set and token is not expired
```

3. SSH Connection Issues
```bash
Error: SSH connection failed
Solution: Verify SSH credentials and server accessibility
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation for API changes
- Use conventional commits
- Keep commits atomic and focused

## Security

- JWT-based authentication
- Password hashing
- CORS enabled
- SSH connection security
- Environment variable protection
- Rate limiting
- Input validation
- XSS protection
- SQL injection prevention

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.