const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all expense routes
router.use(authMiddleware);

// Add new expense
router.post('/', async (req, res) => {
    try {
        const { description, amount, paid_by, group_id, split_type, expense_date, notes, splits } = req.body;
        const db = req.app.get('db');

        console.log('=== ADD EXPENSE REQUEST ===');
        console.log('Request body:', req.body);

        // Insert expense
        const [expenseResult] = await db.promise().execute(
            'INSERT INTO expenses (description, amount, paid_by, group_id, split_type, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [description, amount, paid_by, group_id, split_type, expense_date, notes]
        );

        const expenseId = expenseResult.insertId;
        console.log('Expense inserted with ID:', expenseId);

        if (split_type === 'equal') {
            // Get group members
            const [members] = await db.promise().execute(
                'SELECT user_id FROM group_members WHERE group_id = ?',
                [group_id]
            );

            console.log('Group members:', members);
            const splitAmount = amount / members.length;
            console.log('Split amount per person:', splitAmount);

            // FIXED: Create equal splits with CORRECT logic
            for (const member of members) {
                let userAmount;
                
                if (member.user_id === parseInt(paid_by)) {
                    // Payer gets: total amount - their share (POSITIVE = they are owed money)
                    userAmount = parseFloat((amount - splitAmount).toFixed(2));
                } else {
                    // Others get: -split amount (NEGATIVE = they owe money)
                    userAmount = parseFloat((-splitAmount).toFixed(2));
                }

                console.log(`User ${member.user_id} amount: ${userAmount}`);

                await db.promise().execute(
                    'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)',
                    [expenseId, member.user_id, userAmount]
                );
            }

        } else if (split_type === 'custom' && splits) {
            console.log('Custom splits:', splits);
            
            // FIXED: Create custom splits with CORRECT logic
            for (const split of splits) {
                await db.promise().execute(
                    'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)',
                    [expenseId, split.user_id, split.amount]
                );
            }
        }

        console.log('=== EXPENSE ADDED SUCCESSFULLY ===');
        
        res.status(201).json({
            message: 'Expense added successfully',
            expenseId: expenseId
        });

    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ error: 'Failed to add expense: ' + error.message });
    }
});

// Get group members for a specific group
router.get('/group/:groupId/members', async (req, res) => {
    try {
        const db = req.app.get('db');
        const groupId = req.params.groupId;

        const [members] = await db.promise().execute(`
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
            ORDER BY u.name
        `, [groupId]);

        res.json(members);

    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({ error: 'Failed to load group members' });
    }
});

module.exports = router;