SplitRight - Expense Sharing Application

Project Overview
SplitRight is a full-stack web application designed to help groups of people track and split shared expenses easily. The application allows users to create groups, add expenses, track balances, and settle payments.

Technology Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: JWT (JSON Web Tokens)
- Development Tools: Nodemon, XAMPP

Project Structure
SplitRight-WebDevProject/
├── frontend/ # Frontend HTML/CSS files
│ ├── login.html
│ ├── dashboard.html
│ ├── create-group.html
│ ├── group-details.html
│ ├── add-expense.html
│ ├── settle-up.html
│ └── *.css files
├── backend/ # Backend Express.js application
│ ├── config/ # Database configuration
│ ├── controllers/ # Business logic handlers
│ ├── models/ # Database models
│ ├── routes/ # API route definitions
│ ├── middleware/ # Authentication & validation
│ ├── public/ # Static files
│ ├── app.js # Main application file
│ └── package.json # Dependencies
└── database/ # Database schema and scripts

 Features
- User registration and authentication
- Group creation and management
- Expense tracking and splitting
- Balance calculations
- Payment settlement tracking
- Recent activity feed

Setup Instructions

Prerequisites
- Node.js (v14 or higher)
- XAMPP (for MySQL database)
- Git

Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend

2.Install dependencies:
- npm install

3. Set up environment variables:
- Copy .env file and configure database credentials
- Update JWT secret key

4. Start the development server:
- npm run dev

Database Setup
- Start XAMPP and run Apache & MySQL services
- Create database named splitright_db
- Import the schema from database/schema.sql

Frontend Setup
The frontend is automatically served by the Express server. 

Access the application at:
http://localhost:3000

API Endpoints
- Authentication
-- POST /api/auth/register - User registration
-- POST /api/auth/login - User login

- Groups
-- GET /api/groups - Get user's groups
-- POST /api/groups - Create new group
-- GET /api/groups/:id - Get group details

- Expenses
-- POST /api/expenses - Add new expense
-- GET /api/expenses/group/:groupId - Get group expenses

- Settlements
-- POST /api/settlements - Record payment settlement

Development Team
- Huzaifa Ahmed Khan - Full Stack Developer
- Syeda Alishba Zaidi - Full Stack Developer

Course Information
This project is developed for Introduction to Web and App Development course, Semester 7.

Progress Status
- Frontend UI completed (HTML/CSS)
- Backend structure setup
- Express server configuration
- Database integration
- Authentication implementation
- API endpoints development
- Frontend-Backend integration
- Testing and deployment

Contributing
- Fork the repository
- Create a feature branch
- Commit your changes
- Push to the branch
- Create a Pull Request

License
This project is for educational purposes as part of university coursework.