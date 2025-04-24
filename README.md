
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

