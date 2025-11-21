const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Get dashboard summary data
router.get('/summary', async (req, res) => {
    try {
        const db = req.app.get('db');
        const userId = req.userId;

        // Get balance overview
        const [balanceResults] = await db.promise().execute(`
            SELECT 
                SUM(CASE WHEN es.amount > 0 THEN es.amount ELSE 0 END) as owed_to_you,
                SUM(CASE WHEN es.amount < 0 THEN ABS(es.amount) ELSE 0 END) as you_owe,
                SUM(es.amount) as net_balance
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE es.user_id = ? AND es.amount != 0
        `, [userId]);

        const balanceData = balanceResults[0] || {
            owed_to_you: 0,
            you_owe: 0, 
            net_balance: 0
        };

        // Get user's groups
        const [groups] = await db.promise().execute(`
            SELECT g.*, 
                   COUNT(gm.user_id) as member_count,
                   (SELECT SUM(es.amount) 
                    FROM expense_splits es 
                    JOIN expenses e ON es.expense_id = e.id 
                    WHERE e.group_id = g.id AND es.user_id = ?) as user_balance
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
            GROUP BY g.id
            ORDER BY g.created_at DESC
        `, [userId, userId]);

        // Format groups data
        const formattedGroups = groups.map(group => ({
            id: group.id,
            name: group.name,
            memberCount: group.member_count,
            balance: group.user_balance || 0,
            balanceType: (group.user_balance || 0) > 0 ? 'owed' : 'owe'
        }));

        // Get recent activity
        const [activities] = await db.promise().execute(`
            (SELECT 
                'expense' as type,
                e.description,
                e.amount,
                e.created_at,
                u.name as user_name,
                g.name as group_name,
                CONCAT(u.name, ' added expense "', e.description, '" in ', g.name) as display_text
            FROM expenses e
            JOIN users u ON e.paid_by = u.id
            JOIN groups g ON e.group_id = g.id
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
            ORDER BY e.created_at DESC
            LIMIT 10)
            
            UNION ALL
            
            (SELECT 
                'payment' as type,
                s.notes as description,
                s.amount,
                s.created_at,
                u1.name as user_name,
                g.name as group_name,
                CONCAT(u1.name, ' settled with ', u2.name, ' in ', g.name) as display_text
            FROM settlements s
            JOIN users u1 ON s.from_user = u1.id
            JOIN users u2 ON s.to_user = u2.id
            JOIN groups g ON s.group_id = g.id
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
            ORDER BY s.created_at DESC
            LIMIT 10)
            
            ORDER BY created_at DESC
            LIMIT 10
        `, [userId, userId]);

        // Format recent activity
        const formattedActivities = activities.map(activity => ({
            type: activity.type,
            description: activity.display_text,
            amount: activity.amount,
            time: this.formatTimeAgo(activity.created_at)
        }));

        res.json({
            balanceData: {
                owedToYou: parseFloat(balanceData.owed_to_you) || 0,
                youOwe: parseFloat(balanceData.you_owe) || 0,
                netBalance: parseFloat(balanceData.net_balance) || 0
            },
            groups: formattedGroups,
            recentActivity: formattedActivities
        });

    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Helper function to format time ago
router.formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
};

module.exports = router;