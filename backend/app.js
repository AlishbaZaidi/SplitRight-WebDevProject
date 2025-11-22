const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./middleware/auth');

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
const expenseRoutes = require('./routes/expenses');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);

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

// Debug route to see group expenses
app.get('/api/debug-group-expenses', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.query.groupId;
        const userId = req.userId;

        const [expenses] = await db.promise().execute(`
            SELECT 
                e.*,
                u.name as payer_name,
                (SELECT COUNT(*) FROM group_members WHERE group_id = e.group_id) as member_count,
                COALESCE(
                    (SELECT amount FROM expense_splits WHERE expense_id = e.id AND user_id = ?),
                    0
                ) as user_share
            FROM expenses e
            JOIN users u ON e.paid_by = u.id
            WHERE e.group_id = ?
            ORDER BY e.created_at DESC
        `, [userId, groupId]);

        res.json({ expenses });

    } catch (error) {
        console.error('Debug group expenses error:', error);
        res.status(500).json({ error: 'Failed to load expenses' });
    }
});

// Debug route to see member balances for a specific group - FINAL WORKING VERSION
app.get('/api/debug-group-balances', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.query.groupId;
        const userId = req.userId;

        // FINAL CORRECT QUERY - specifies which table's amount column to use
        const [memberBalances] = await db.promise().execute(`
            SELECT 
                u.id,
                u.name,
                COALESCE(
                    (SELECT SUM(es.amount) 
                    FROM expense_splits es 
                    JOIN expenses e ON es.expense_id = e.id 
                    WHERE es.user_id = u.id AND e.group_id = ?),
                    0
                ) as net_balance
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id 
            WHERE gm.group_id = ?
            ORDER BY u.name
        `, [groupId, groupId]);

        // Transform the balances for frontend display
        const transformedBalances = memberBalances.map(member => ({
            id: member.id,
            name: member.name,
            balance: parseFloat(member.net_balance)
        }));

        res.json({ memberBalances: transformedBalances });

    } catch (error) {
        console.error('Debug group balances error:', error);
        res.status(500).json({ error: 'Failed to load member balances: ' + error.message });
    }
});

// Debug route to see raw expense splits for a group
app.get('/api/debug-raw-splits', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.query.groupId;

        const [splits] = await db.promise().execute(`
            SELECT 
                e.description,
                e.amount as total_amount,
                e.paid_by,
                u_payer.name as payer_name,
                es.user_id,
                u.name as user_name,
                es.amount as split_amount
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            JOIN users u ON es.user_id = u.id
            JOIN users u_payer ON e.paid_by = u_payer.id
            WHERE e.group_id = ?
            ORDER BY e.id, es.user_id
        `, [groupId]);

        res.json({ splits });

    } catch (error) {
        console.error('Debug raw splits error:', error);
        res.status(500).json({ error: 'Failed to load raw splits' });
    }
});

// Debug route to verify group-specific expense data
app.get('/api/debug-group-verification', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.query.groupId;

        const [expenses] = await db.promise().execute(`
            SELECT 
                e.id,
                e.description,
                e.amount,
                e.paid_by,
                COUNT(es.id) as split_count
            FROM expenses e
            LEFT JOIN expense_splits es ON e.id = es.expense_id
            WHERE e.group_id = ?
            GROUP BY e.id, e.description, e.amount, e.paid_by
            ORDER BY e.id
        `, [groupId]);

        const [splits] = await db.promise().execute(`
            SELECT 
                e.group_id,
                COUNT(*) as total_splits,
                SUM(es.amount) as total_amount
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE e.group_id = ?
        `, [groupId]);

        res.json({ 
            groupId: groupId,
            expenses: expenses,
            splitsSummary: splits[0]
        });

    } catch (error) {
        console.error('Debug group verification error:', error);
        res.status(500).json({ error: 'Failed to verify group data' });
    }
});

// Get group info by ID
app.get('/api/groups/:groupId', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.params.groupId;

        const [groups] = await db.promise().execute(`
            SELECT g.*, 
                COUNT(gm.user_id) as member_count
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            WHERE g.id = ?
            GROUP BY g.id
        `, [groupId]);

        if (groups.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(groups[0]);

    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ error: 'Failed to load group' });
    }
});

// Test group info endpoint
app.get('/api/test-group/:groupId', authMiddleware, async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.params.groupId;

        console.log('Testing group endpoint for groupId:', groupId);

        const [groups] = await db.promise().execute(`
            SELECT g.*, 
                COUNT(gm.user_id) as member_count
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            WHERE g.id = ?
            GROUP BY g.id
        `, [groupId]);

        console.log('Query results:', groups);

        if (groups.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(groups[0]);

    } catch (error) {
        console.error('Test group error:', error);
        res.status(500).json({ error: 'Failed to load group: ' + error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving frontend from: ${path.join(__dirname, '../frontend')}`);
});

module.exports = { app, db };