# Polytech Tracker Backend

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
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SSH_HOST=your_ssh_host
SSH_USER=your_ssh_user
SSH_PASSWORD=your_ssh_password
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

#### POST /api/auth/updatePassword
- Update user password
- Headers: `Authorization: Bearer <token>`
- Body: `{ currentPassword: string, newPassword: string }`

**Request Example:**
```json
{
    "currentPassword": "oldpassword123",
    "newPassword": "newsecurepassword456"
}
```

**Response Example:**
```json
{
    "message": "Password updated successfully"
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

#### POST /api/student/create
- Create new student
- Headers: `Authorization: Bearer <token>`
- Body: Student object

**Request Example:**
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "password": "securepassword123",
    "group": "A1",
    "email": "john.doe@example.com"
}
```

**Response Example:**
```json
{
    "message": "Student created successfully",
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
    ]
}
```

#### GET /api/activity/getTopParticipants
- Get top participants
- Query parameters:
  - `limit`: number of results
  - `group`: filter by group

**Request Example:**
```
GET /api/activity/getTopParticipants?limit=10&group=A1
```

**Response Example:**
```json
{
    "message": "Top participants retrieved",
    "data": [
        {
            "studentId": "123456",
            "firstName": "John",
            "lastName": "Doe",
            "group": "A1",
            "totalPoints": 850,
            "activities": 15
        }
    ]
}
```

#### POST /api/activity/create
- Create new activity
- Headers: `Authorization: Bearer <token>`
- Body: Activity object

**Request Example:**
```json
{
    "studentId": "123456",
    "type": "assignment",
    "title": "Project Submission",
    "description": "Submitted final project",
    "points": 100
}
```

**Response Example:**
```json
{
    "message": "Activity created successfully",
    "data": {
        "id": "789012",
        "studentId": "123456",
        "type": "assignment",
        "title": "Project Submission",
        "description": "Submitted final project",
        "points": 100,
        "createdAt": "2024-01-01T00:00:00.000Z"
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
    updatedAt: Date
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
    updatedAt: Date
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
- 500: Internal Server Error

## Development

The project uses ESLint for code quality. Run the linter:

```bash
npm run lint
```

## Scripts

- `npm start`: Start the server
- `npm run dev`: Start the server with nodemon for development
- `npm run getStudentList`: Get list of students
- `npm run getActivityList`: Get list of activities
- `npm run connectSSH`: Connect to SSH server
- `npm run top`: Get top participants
- `npm run sync_activities`: Synchronize activities

## Security

- JWT-based authentication
- Password hashing
- CORS enabled
- SSH connection security
- Environment variable protection

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## **Endpoints**

### **Student Endpoints**

| Endpoint                  | Method | Description                                      |
|---------------------------|--------|--------------------------------------------------|
| `/student/search`         | GET    | Search for a student by `firstName` and `lastName`, `username`, `id`, or `group`. |
| `/student/me`             | GET    | Get the current logged-in student's details.    |
| `/student/create`         | POST   | Create a new student.                           |

---

### **Auth Endpoints**

| Endpoint                  | Method | Description                                      |
|---------------------------|--------|--------------------------------------------------|
| `/auth/connect`           | GET    | Establish an SSH connection for the user.       |
| `/auth/disconnect`        | GET    | Disconnect the SSH connection for the user.     |
| `/auth/verify`            | GET    | Verify the validity of the user's token.        |
| `/auth/login`             | POST   | Log in a user and generate a token.             |
| `/auth/updatePassword`    | POST   | Update the user's password.                     |

---

### **Activity Endpoints**

| Endpoint                          | Method | Description                                      |
|-----------------------------------|--------|--------------------------------------------------|
| `/activity/search`                | GET    | Search for an activity by `firstName`, `lastName`, `username`, or `id`. |
| `/activity/me`                    | GET    | Get the current logged-in student's activities. |
| `/activity/getTopParticipants`    | GET    | Get the top participants based on activity.     |
| `/activity/create`                | POST   | Create a new activity.                          |
| `/activity/update`                | POST   | Update an existing activity.                    |
| `/activity/sync`                  | POST   | Sync activities and update the database.        |
| `/activity/recount`               | POST   | Recount and update duplicate activities.        |

---

## **Request and Response Examples**

### **1. Student Endpoints**

#### **GET /student/search**
**Request:**
```
GET /api/student/search?firstName=John&lastName=Doe

**Response**
{
    "message": "Student found",
    "data": {
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe",
        "group": "A1"
    }
}
```

