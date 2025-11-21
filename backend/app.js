const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'splitright_db'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database as id ' + db.threadId);
});

// Make db accessible to routes
app.set('db', db);

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Debug route to check if auth routes are loaded
app.get('/api/debug-auth', (req, res) => {
    res.json({ 
        message: 'Auth routes are loaded correctly',
        timestamp: new Date().toISOString()
    });
});

// Basic route to test if backend is working
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        timestamp: new Date().toISOString()
    });
});

// Test database connection
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (error, results) => {
        if (error) {
            return res.status(500).json({ 
                error: 'Database connection failed',
                details: error.message 
            });
        }
        res.json({ 
            message: 'Database connection successful',
            solution: results[0].solution 
        });
    });
});

// Route to serve the login page as homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Serve other HTML pages - FIXED: Use specific routes instead of catch-all
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/create-group.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/create-group.html'));
});

app.get('/group-details.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/group-details.html'));
});

app.get('/add-expense.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/add-expense.html'));
});

app.get('/settle-up.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/settle-up.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving frontend from: ${path.join(__dirname, '../frontend')}`);
});

module.exports = { app, db };