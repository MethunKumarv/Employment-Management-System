# HexaEMS --- Employee Management Platform

A full-stack Employee Management System (EMS) built with **React,
FastAPI, Python, MongoDB Atlas, Postman, Git, GitHub, Netlify, and
Render**.

## Overview

HexaEMS demonstrates a complete CRUD-based employee management workflow.
The React frontend communicates with a FastAPI REST API, which validates
requests and manages employee records stored in MongoDB Atlas.

### Main features

#### Employee Management

-   Dashboard showing total employees and total departments
-   Add new employees
-   Automatically generated permanent employee IDs (`EMP-0001`,
    `EMP-0002`, ...)
-   View all employees
-   View an individual employee through the API
-   Edit employee information
-   Employment status management
-   Activate/deactivate employee records using a soft-delete approach
-   Duplicate-email protection
-   Search by employee name or email
-   Department filtering
-   Column sorting
-   Pagination with 5, 10, 25, 50, or 100 entries per page

#### Authentication and Security

-   Username/password authentication
-   JWT-based access tokens
-   Secure password hashing using Argon2
-   Protected API endpoints
-   Authenticated session validation through `/auth/me`
-   Login rejection for inactive user accounts
-   Password visibility toggle on the login page

#### Role-Based Access Control

-   Four system roles: Admin, HR Manager, Manager, and Employee
-   Backend authorization using FastAPI dependencies
-   Role-specific application sections and permissions
-   Admin-only user management
-   Manager-only team management
-   Employee-only self-service profile
-   Managers restricted to editing members of their own team

#### User Management

-   Create system users
-   Link Manager and Employee accounts to employee records
-   Activate/deactivate user accounts
-   Prevent administrators from deactivating their own account
-   Store only password hashes, never plaintext passwords

#### User Experience

-   Toast notifications
-   Employee ID confirmation after creation
-   Edit-mode highlighting
-   Responsive interface for desktop and mobile
-   FastAPI Swagger documentation
-   Postman API testing

## Technology Stack

  Technology      Purpose
  --------------- ----------------------------------------
  React           Frontend UI
  Vite            Frontend development and build tooling
  JavaScript      Frontend logic
  CSS             Styling and responsive layout
  Axios           HTTP communication
  Python          Backend language
  FastAPI         REST API
  Pydantic        Request validation
  PyMongo         MongoDB access
  MongoDB Atlas   Cloud database
  Postman         API testing
  Git             Version control
  GitHub          Source-code hosting
  Netlify         Frontend deployment
  Render          Backend deployment

## Architecture

``` text
                    USER
                      |
                      v
             +------------------+
             |  React Frontend  |
             |    Vite + CSS    |
             +--------+---------+
                      |
                 HTTP / JSON
                      |
                      v
             +------------------+
             | FastAPI Backend  |
             |     Python       |
             +--------+---------+
                      |
                    PyMongo
                      |
                      v
             +------------------+
             |  MongoDB Atlas   |
             | employee_management
             +------------------+

Postman ---------> FastAPI API
                    for API testing
```

### Production deployment

``` text
Netlify
  |
  | React frontend
  v
https://hexaemsplatform.netlify.app/
  |
  | REST API requests
  v
Render
  |
  | FastAPI
  v
https://hexaems-api.onrender.com
  |
  | PyMongo
  v
MongoDB Atlas
```

The frontend and backend are deployed separately because React is the
client-side UI while FastAPI is the Python server-side API.

## Project Structure

``` text
EMS/
├── backend/
│   ├── .venv/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── schemas.py
│   │   └── auth.py
│   ├── .env
│   ├── .gitignore
│   ├── requirements.txt
│   ├── create_admin.py
│   ├── link_employee_user.py
│   ├── link_manager_user.py
│   └── link_manager_team.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── .gitignore
```

### Backend

`main.py` contains the FastAPI application, CRUD endpoints, dashboard
endpoint, CORS configuration, error handling, and employee ID
generation.

`database.py` creates the MongoDB connection and exposes the `employees`
and `counters` collections.

`schemas.py` contains Pydantic models for employee creation and update
validation.

### Frontend

`App.jsx` contains the main React application logic, state, API calls,
form handling, directory functionality, search, filtering, sorting,
pagination, and notifications.

`App.css` contains the application layout, form styling, table styling,
buttons, status badges, pagination, and responsive rules.

## Database Design

### Database

``` text
employee_management
```

### Collections

``` text
employee_management
├── employees
├── users
└── counters
```

### Employee document

``` json
{
  "_id": "MongoDB ObjectId",
  "employee_id": "EMP-0001",
  "name": "Employee Name",
  "email": "employee@example.com",
  "department": "Engineering",
  "designation": "Software Developer",
  "status": "Active"
}
```

### User document

``` json
{
  "_id": "MongoDB ObjectId",
  "username": "employee",
  "hashed_password": "Argon2 hash",
  "role": "Employee",
  "status": "Active",
  "employee_id": "EMP-0002"
}
```

The original password is not stored in MongoDB. The `hashed_password`
field contains the Argon2 hash used to verify login credentials.

### User roles

-   Admin
-   HR Manager
-   Manager
-   Employee

### User account statuses

-   Active
-   Inactive

### Supported statuses

-   Active
-   On Leave
-   Medical Leave
-   Resigned
-   Terminated
-   Inactive

### Employee IDs

Employee IDs are generated by a MongoDB counter and formatted as:

``` text
EMP-0001
EMP-0002
EMP-0003
```

The ID is permanent and is not reused when an employee becomes inactive.

Unique indexes are maintained for `employee_id` and `email`.

## Authentication and Authorization

HexaEMS uses username/password authentication with JWT access tokens.

### Authentication API

  Method   Endpoint        Purpose
  -------- --------------- ---------------------------------------------------
  POST     `/auth/login`   Authenticate a user and issue a JWT
  GET      `/auth/me`      Return the currently authenticated user's account

After successful login, the frontend stores the access token and sends
it with protected API requests:

``` text
Authorization: Bearer <access_token>
```

Passwords are never stored as plaintext. They are hashed with Argon2
before being stored in MongoDB.

### Role-Based Access Control

HexaEMS supports four roles:

  Feature                Admin   HR Manager   Manager    Employee
  --------------------- ------- ------------ ---------- ----------
  Overview                 ✓         ✓           ✓          ✓
  Add Employee             ✓         ✓           ✗          ✗
  Employee Directory       ✓         ✓           ✗          ✗
  Edit Employees           ✓         ✓        Own Team      ✗
  Deactivate Employee      ✓         ✗           ✗          ✗
  My Team                  ✗         ✗           ✓          ✗
  My Profile               ✗         ✗           ✗          ✓
  User Management          ✓         ✗           ✗          ✗

Authorization is enforced by the FastAPI backend. Frontend role checks
control the visible interface, while backend authorization is the actual
security boundary.

### User Management API

  Method   Endpoint        Purpose
  -------- --------------- -----------------------------------
  POST     `/users`        Create a system user
  GET      `/users`        List system users
  DELETE   `/users/{id}`   Activate/deactivate a system user

User-management endpoints are restricted to administrators.

### Authentication Flow

``` text
Username + Password
        |
        v
FastAPI /auth/login
        |
        v
Find user in MongoDB
        |
        v
Verify Argon2 password hash
        |
        v
Check account status
        |
        v
Generate JWT
        |
        v
React stores access token
        |
        v
Protected API requests
```

## CRUD API

  Method   Endpoint            Purpose
  -------- ------------------- ------------------------------
  GET      `/`                 Root/health response
  GET      `/dashboard`        Dashboard statistics
  GET      `/employees`        Get all employees
  GET      `/employees/{id}`   Get one employee
  POST     `/employees`        Create employee
  PUT      `/employees/{id}`   Update employee
  DELETE   `/employees/{id}`   Activate/deactivate employee

FastAPI provides interactive documentation at:

``` text
/docs
```

Production:

``` text
https://hexaems-api.onrender.com/docs
```

## CRUD Workflow

### Create

`POST /employees`

The backend validates the employee, normalizes the email to lowercase,
checks for duplicate email, generates a permanent employee ID, and
inserts the document into MongoDB.

### Read

`GET /employees` returns the employee directory data.

`GET /employees/{id}` returns a single employee.

`GET /dashboard` returns total employee and department counts.

### Update

`PUT /employees/{id}` validates the employee, checks that the employee
exists, prevents duplicate email addresses, and updates the document.

### Delete / Deactivate

The application uses a soft-delete design.

`DELETE /employees/{id}` changes an active employee to `Inactive`. If
the employee is already inactive, the same action changes the status
back to `Active`.

The employee document is therefore preserved instead of being physically
removed from MongoDB.

## Employee Form

Required employee fields:

-   Full Name
-   Email Address
-   Department
-   Designation

When adding an employee, employment status is fixed to `Active` and the
dropdown is disabled.

When editing an employee, the status dropdown is enabled so the
employment status can be changed.

After successful creation, the application displays the employee's
permanent ID and key employee details.

## Directory Features

The directory supports:

### Search

Searches employee name and email.

### Department filter

Departments are derived from employee data and duplicate department
names are removed.

### Sorting

Sortable columns include:

-   Employee ID
-   Employee
-   Email
-   Department
-   Designation
-   Status

### Pagination

The user can select:

``` text
5
10
25
50
100
```

employees per page and navigate using Previous, Next, and page-number
controls.

## Validation and Error Handling

The API uses Pydantic validation.

Important responses include:

``` text
404 Not Found
```

when an employee does not exist.

``` text
409 Conflict
```

when a duplicate email is submitted.

``` text
422 Unprocessable Entity
```

when request data fails validation.

The React application converts API errors into user-friendly toast
messages.

Authentication and authorization responses include:

``` text
401 Unauthorized
```

when login credentials are invalid or a JWT cannot be validated.

``` text
403 Forbidden
```

when a valid user does not have permission to perform the requested
action or when the user account is inactive.

## Running the Backend Locally

### 1. Enter the backend directory

``` bash
cd backend
```

### 2. Create the virtual environment

``` bash
python -m venv .venv
```

### 3. Activate it

Windows Command Prompt:

``` bash
.venv\Scripts\activate
```

PowerShell:

``` powershell
.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

``` bash
pip install -r requirements.txt
```

### 5. Configure MongoDB

Create:

``` text
backend/.env
```

Add:

``` env
MONGODB_URL=your_mongodb_atlas_connection_string
```

Never commit the `.env` file.

### 6. Start FastAPI

``` bash
uvicorn app.main:app --reload
```

Local API:

``` text
http://127.0.0.1:8000
```

Swagger:

``` text
http://127.0.0.1:8000/docs
```

## Running the Frontend Locally

### 1. Enter the frontend directory

``` bash
cd frontend
```

### 2. Install packages

``` bash
npm install
```

### 3. Configure the API URL

Create:

``` text
frontend/.env
```

For local development:

``` env
VITE_API_URL=http://127.0.0.1:8000
```

### 4. Start the frontend

``` bash
npm run dev
```

The Vite development server normally runs at:

``` text
http://localhost:5173
```

## Environment Variables

### Backend

``` env
MONGODB_URL=your_mongodb_atlas_connection_string
```

### Frontend

Local:

``` env
VITE_API_URL=http://127.0.0.1:8000
```

Production:

``` env
VITE_API_URL=https://hexaems-api.onrender.com
```

The MongoDB connection string must remain on the backend. It must never
be exposed through the React frontend or committed to GitHub.

## CORS

Because the frontend and backend are hosted on different origins,
FastAPI is configured with CORS.

Allowed application origins include:

``` text
http://localhost:5173
https://hexaemsplatform.netlify.app
```

This allows the browser-based React application to call the FastAPI API.

## Postman Testing

The API was tested independently from the React application using
Postman.

Recommended test sequence:

``` text
GET    /
GET    /dashboard
GET    /employees
POST   /employees
GET    /employees/{id}
PUT    /employees/{id}
DELETE /employees/{id}
```

Important test cases:

-   Successful employee creation
-   Invalid email
-   Duplicate email
-   Get all employees
-   Get individual employee
-   Successful update
-   Duplicate email during update
-   Non-existent employee
-   Deactivation
-   Activation
-   Dashboard statistics
-   Empty/search-filtered results

## Development Process

### Phase 1 --- Environment and repository setup

-   Installed Python, Node.js, npm, Git, and VS Code
-   Created the project repository
-   Created separate backend and frontend directories

### Phase 2 --- Backend setup

-   Created FastAPI application
-   Connected FastAPI to MongoDB Atlas using PyMongo
-   Added environment-variable support
-   Created Pydantic schemas

### Phase 3 --- CRUD API

Implemented Create, Read, Update, and Delete/Deactivate operations.

API behavior was tested using Swagger and Postman.

### Phase 4 --- Permanent employee ID

Added a MongoDB counter to generate IDs such as:

``` text
EMP-0001
EMP-0002
```

Added a unique index to protect the ID.

### Phase 5 --- Employee lifecycle

Changed permanent deletion to a soft-delete/status model so employee
records remain available.

### Phase 6 --- Dashboard

Added:

``` text
GET /dashboard
```

to provide total employee and total department counts.

### Phase 7 --- React frontend

Built the dashboard, employee form, directory, responsive styling, and
API integration using Axios.

### Phase 8 --- Directory functionality

Added:

-   Search
-   Department filter
-   Sorting
-   Pagination
-   Entries-per-page control

### Phase 9 --- UX improvements

Added:

-   Toast notifications
-   Employee ID confirmation
-   Edit-mode highlighting
-   Activate/deactivate controls
-   Employment-status workflow
-   Responsive mobile styling

### Phase 10 --- Authentication and authorization

Implemented secure application authentication and role-based
authorization.

-   Added username/password login
-   Added JWT access tokens
-   Added Argon2 password hashing
-   Added authenticated `/auth/me` endpoint
-   Added four application roles
-   Added backend RBAC dependencies
-   Added role-specific frontend views
-   Added Admin User Management
-   Added Manager My Team access
-   Added Employee My Profile access
-   Added user account activation/deactivation

### Phase 11 --- Deployment

-   Deployed React frontend to Netlify
-   Deployed FastAPI backend to Render
-   Configured production API URL
-   Configured CORS
-   Secured MongoDB Atlas network access
-   Tested the production application

## Deployment

### Netlify

Frontend:

``` text
https://hexaemsplatform.netlify.app/
```

Configuration:

``` text
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

Production environment variable:

``` text
VITE_API_URL=https://hexaems-api.onrender.com
```

### Render

Backend:

``` text
https://hexaems-api.onrender.com
```

Configuration:

``` text
Runtime: Python 3
Root directory: backend
Build command: pip install -r requirements.txt
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The MongoDB connection string is stored as a Render environment
variable.

## Git Workflow

Typical workflow:

``` bash
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Repository:

``` text
https://github.com/MethunKumarv/Employment-Management-System
```

## Security Practices

-   MongoDB credentials are stored in environment variables.

-   `.env` files are excluded from Git.

-   The MongoDB connection string is not included in frontend code.

-   MongoDB Atlas network access is restricted rather than allowing
    unrestricted access.

-   Unique database indexes protect employee IDs and email addresses.

-   Backend validation prevents invalid employee data from being stored.

-   Passwords are hashed using Argon2 before database storage.

-   Plaintext passwords are never stored in MongoDB.

-   JWT authentication protects authenticated API requests.

-   Backend role checks enforce authorization independently of the
    frontend.

-   Inactive user accounts are prevented from logging in.

## Design Decisions

### Why FastAPI?

FastAPI provides a Python REST API with request validation and automatic
interactive documentation.

### Why React?

React provides a component-based frontend and state-driven UI updates.

### Why MongoDB Atlas?

MongoDB Atlas provides a cloud-hosted MongoDB database that can be
accessed by the deployed backend.

### Why Render?

Render runs the Python/FastAPI backend as a web service.

### Why Netlify?

The React/Vite frontend builds into static assets that can be hosted by
Netlify.

### Why separate frontend and backend?

The separation provides a clear full-stack architecture:

``` text
React → FastAPI → MongoDB
```

### Why JWT authentication?

JWT provides a stateless mechanism for the frontend to prove that a user
has authenticated when calling protected FastAPI endpoints.

### Why role-based access control?

Different users require different levels of access. RBAC associates
permissions with roles and allows the backend to enforce those
permissions consistently.

### Why Argon2 password hashing?

Passwords should not be stored in plaintext. Argon2 transforms passwords
into secure hashes that can be verified during login without storing the
original password.

### Why soft delete?

Employee records may need to remain available for administrative or
historical purposes. Therefore, deactivation changes the employee status
to `Inactive` instead of permanently deleting the document.

## Current Production Links

  ----------------------------------------------------------------------------------------
  Resource                  URL
  ------------------------- --------------------------------------------------------------
  Frontend                  https://hexaemsplatform.netlify.app/

  Backend API               https://hexaems-api.onrender.com

  Swagger API Docs          https://hexaems-api.onrender.com/docs

  GitHub Repository         https://github.com/MethunKumarv/Employment-Management-System
  ----------------------------------------------------------------------------------------

## Future Improvements

Possible future enhancements:

-   Password reset functionality
-   Employee profile editing
-   Joining-date management
-   Leave management
-   Attendance management
-   Salary management
-   CSV/Excel export
-   Department management
-   Audit history
-   Automated frontend tests
-   Automated backend/API tests
-   More advanced dashboard analytics
-   Improved accessibility

## Learning Outcomes

This project demonstrates practical experience with:

-   Full-stack architecture
-   REST APIs
-   CRUD operations
-   Python
-   FastAPI
-   Pydantic
-   MongoDB
-   PyMongo
-   MongoDB Atlas
-   React
-   Axios
-   JavaScript state management
-   HTTP and JSON
-   CORS
-   Postman
-   Responsive CSS
-   Git and GitHub
-   Environment variables
-   Cloud deployment
-   Netlify
-   Render
-   Basic application security
-   Soft-delete business logic

## Current System Capabilities

The current version of HexaEMS includes:

-   Full employee CRUD and lifecycle management
-   Automatic permanent Employee ID generation
-   Search, filtering, sorting, and pagination
-   Dashboard statistics
-   Username/password authentication
-   JWT-based authentication
-   Argon2 password hashing
-   Role-Based Access Control
-   Admin, HR Manager, Manager, and Employee roles
-   Admin User Management
-   Manager My Team
-   Employee My Profile
-   User account activation/deactivation
-   Role-specific frontend access
-   Backend authorization
-   Password visibility toggle
-   Responsive UI
-   Toast notifications
-   MongoDB Atlas persistence
-   Netlify frontend deployment
-   Render backend deployment

## Conclusion

HexaEMS is a complete full-stack Employee Management System
demonstrating the flow:

``` text
React + Vite
      ↓
Axios / HTTP / JSON
      ↓
FastAPI + Python
      ↓
PyMongo
      ↓
MongoDB Atlas
```

The project combines a responsive React interface, validated FastAPI
REST endpoints, MongoDB persistence, Postman API testing, Git/GitHub
version control, and cloud deployment through Netlify and Render.
