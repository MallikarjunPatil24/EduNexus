# CampusCore / EduNexus - API Documentation

**Base API Path**: `/api`  
**Authentication Scheme**: HTTP Bearer Token (`Authorization: Bearer <jwt_token>`) & `token` HTTP-only cookie.

---

## System & Health Endpoints

### 1. Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Auth Required**: No (Public)
- **Roles Allowed**: All
- **Request Body**: None
- **Response**:
  ```json
  {
    "success": true,
    "status": "healthy",
    "database": "connected",
    "environment": "production"
  }
  ```
- **Error Response (503 Service Unavailable)**:
  ```json
  {
    "success": false,
    "status": "unhealthy",
    "database": "disconnected",
    "environment": "production"
  }
  ```

---

## 1. Authentication & User Profile Routes

### 1.1 User Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@edunexus.edu",
    "password": "Password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "_id": "60d5ecb8b3b3a32a6c8b4567",
    "name": "John Doe",
    "email": "user@edunexus.edu",
    "role": "admin",
    "phone": "+1234567890",
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

### 1.2 Register Public / School Admin User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register` (or `/api/auth/register-school`)
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "St. Marys Academy",
    "email": "admin@stmarys.edu",
    "password": "SecurePassword123",
    "role": "admin",
    "phone": "+1987654321"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "_id": "60d5ecb8b3b3a32a6c8b4568",
    "name": "St. Marys Academy",
    "email": "admin@stmarys.edu",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

### 1.3 Register Teacher User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register-teacher`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Dr. Alan Turing",
    "email": "alan.turing@edunexus.edu",
    "password": "TeacherPassword123",
    "phone": "+1555019283"
  }
  ```

### 1.4 Register Parent User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register-parent`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Martha Wayne",
    "email": "martha.wayne@edunexus.edu",
    "password": "ParentPassword123",
    "phone": "+1555091283"
  }
  ```

### 1.5 Register Student User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register-student`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Bruce Wayne",
    "email": "bruce.wayne@edunexus.edu",
    "password": "StudentPassword123",
    "className": "10th Standard",
    "section": "A"
  }
  ```

### 1.6 Get Profile Details
- **Method**: `GET`
- **Endpoint**: `/api/auth/profile`
- **Auth Required**: Yes
- **Roles Allowed**: `admin`, `school`, `teacher`, `parent`, `student`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { "_id": "...", "name": "...", "role": "..." },
    "profileDetails": {}
  }
  ```

### 1.7 User Logout
- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **Auth Required**: Yes

---

## 2. School Management & Admin Routes

### 2.1 Register User (Admin Provisioning)
- **Method**: `POST`
- **Endpoint**: `/api/admin/register`
- **Auth Required**: Yes (`admin`, `school`)

### 2.2 Get Users By Role
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/:role` (`teacher`, `student`, `parent`)
- **Auth Required**: Yes (`admin`, `school`)

### 2.3 Create Class
- **Method**: `POST`
- **Endpoint**: `/api/admin/classes`
- **Auth Required**: Yes (`admin`, `school`)
- **Request Body**:
  ```json
  {
    "className": "10th Standard",
    "section": "A",
    "maxStudents": 40
  }
  ```

### 2.4 Get All Classes
- **Method**: `GET`
- **Endpoint**: `/api/admin/classes`
- **Auth Required**: Yes

### 2.5 Create Subject
- **Method**: `POST`
- **Endpoint**: `/api/admin/subjects`
- **Auth Required**: Yes (`admin`, `school`)
- **Request Body**:
  ```json
  {
    "subName": "Mathematics",
    "subCode": "MATH101",
    "class": "60d5ecb8b3b3a32a6c8b4569",
    "teacher": "60d5ecb8b3b3a32a6c8b4570"
  }
  ```

### 2.6 Create or Update Timetable
- **Method**: `POST`
- **Endpoint**: `/api/admin/timetable`
- **Auth Required**: Yes (`admin`, `school`)

### 2.7 Create & Fetch Fee Records
- **Method**: `POST` `/api/admin/fee-bills`
- **Method**: `GET` `/api/admin/fee-records`
- **Auth Required**: Yes (`admin`, `school`)

---

## 3. Teacher Routes

### 3.1 Get Teacher Profile & Classes
- **Method**: `GET`
- **Endpoint**: `/api/teacher/profile`
- **Auth Required**: Yes (`teacher`)

### 3.2 Mark Attendance
- **Method**: `POST`
- **Endpoint**: `/api/teacher/attendance`
- **Auth Required**: Yes (`teacher`)
- **Request Body**:
  ```json
  {
    "classId": "60d5ecb8b3b3a32a6c8b4569",
    "date": "2026-08-17",
    "attendanceData": [
      { "studentId": "60d5ecb...", "status": "Present" }
    ]
  }
  ```

### 3.3 Create Exam & Submit Marks
- **Method**: `POST` `/api/teacher/exams`
- **Method**: `POST` `/api/teacher/results`
- **Auth Required**: Yes (`teacher`)

### 3.4 Upload Assignment
- **Method**: `POST`
- **Endpoint**: `/api/teacher/assignments`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: Yes (`teacher`)

---

## 4. Student Routes

### 4.1 Get Student Dashboard
- **Method**: `GET`
- **Endpoint**: `/api/student/dashboard`
- **Auth Required**: Yes (`student`)

### 4.2 Submit Assignment
- **Method**: `POST`
- **Endpoint**: `/api/student/submit-assignment/:assignmentId`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: Yes (`student`)

---

## 5. Parent Routes

### 5.1 Get Parent Dashboard & Children
- **Method**: `GET`
- **Endpoint**: `/api/parent/dashboard`
- **Auth Required**: Yes (`parent`)

### 5.2 Get Child Progress Report
- **Method**: `GET`
- **Endpoint**: `/api/parent/child-report/:childId`
- **Auth Required**: Yes (`parent`)

### 5.3 Pay Fee Bill
- **Method**: `POST`
- **Endpoint**: `/api/parent/pay-fee/:billId`
- **Auth Required**: Yes (`parent`)

---

## 6. Messaging & Announcements

### 6.1 Send Chat Message
- **Method**: `POST`
- **Endpoint**: `/api/chat/send`
- **Auth Required**: Yes (`parent`, `teacher`, `admin`, `school`)

### 6.2 Announcements
- **Method**: `POST` `/api/announcements` (`admin`, `school`)
- **Method**: `GET` `/api/announcements` (Public/Authenticated)
