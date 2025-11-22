// Dashboard functionality
class Dashboard {
    constructor() {
        this.user = null;
        this.token = null;
        this.groups = [];
        this.balanceData = {};
        
        this.init();
    }

    async init() {
        // Check if user is logged in
        await this.checkAuth();
        
        // Load dashboard data from REAL API
        await this.loadDashboardData();
        
        // Update UI with real data from database
        this.updateUI();
    }

    async checkAuth() {
        this.token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!this.token || !userData) {
            window.location.href = 'login.html';
            return;
        }

        this.user = JSON.parse(userData);
        
        // Update welcome message with real user name
        const welcomeElement = document.querySelector('.user-name');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome, ${this.user.name}!`;
        }
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data from API...');
            
            // Make API call to get real data from backend
            const response = await fetch('/api/dashboard/summary', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response status:', response.status);

            // Check if the request was successful
            if (!response.ok) {
                if (response.status === 401) {
                    // Token is invalid, redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`Failed to load dashboard data: ${response.status}`);
            }

            // Parse the JSON response from the backend
            const data = await response.json();
            console.log('API Response data:', data);
            
            // Store the real data from the database
            this.balanceData = data.balanceData;
            this.groups = data.groups;
            this.recentActivity = data.recentActivity;

            console.log('Dashboard data loaded successfully');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            
            // Fallback to empty data if API call fails
            this.balanceData = { 
                owedToYou: 0, 
                youOwe: 0, 
                netBalance: 0 
            };
            this.groups = [];
            this.recentActivity = [];
            
            // Show error message to user
            alert('Failed to load dashboard data. Please try refreshing the page.');
        }
    }

    updateUI() {
        this.updateBalanceCards();
        this.updateGroups();
        this.updateRecentActivity();
        this.updatePageTitle();
    }

    updatePageTitle() {
        document.title = `SplitRight - Dashboard`;
    }

    updateBalanceCards() {
        // Update "You Are Owed" card with real data
        const owedElement = document.querySelector('.owed-to-you .amount');
        if (owedElement) {
            const amount = this.balanceData.owedToYou || 0;
            owedElement.textContent = `+Rs ${amount.toLocaleString()}`;
            owedElement.className = `amount ${amount > 0 ? 'positive' : ''}`;
        }

        // Update "You Owe" card with real data  
        const oweElement = document.querySelector('.you-owe .amount');
        if (oweElement) {
            const amount = this.balanceData.youOwe || 0;
            oweElement.textContent = `-Rs ${amount.toLocaleString()}`;
            oweElement.className = `amount ${amount > 0 ? 'negative' : ''}`;
        }

        // Update "Net Balance" card with real data
        const netElement = document.querySelector('.net-balance .amount');
        if (netElement) {
            const amount = this.balanceData.netBalance || 0;
            const isPositive = amount >= 0;
            netElement.textContent = `${isPositive ? '+' : '-'}Rs ${Math.abs(amount).toLocaleString()}`;
            netElement.className = `amount ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    updateGroups() {
        const groupsGrid = document.querySelector('.groups-grid');
        if (!groupsGrid) return;

        // Clear existing content
        groupsGrid.innerHTML = '';

        // Create group cards from real data
        this.groups.forEach(group => {
            const groupCard = this.createGroupCard(group);
            groupsGrid.appendChild(groupCard);
        });

        // Show message if no groups
        if (this.groups.length === 0) {
            groupsGrid.innerHTML = `
                <div class="no-groups-message">
                    <p>You haven't joined any groups yet.</p>
                    <button class="btn-primary" onclick="window.location.href='create-group.html'">
                        Create Your First Group
                    </button>
                </div>
            `;
        }
    }

    createGroupCard(group) {
        const card = document.createElement('div');
        card.className = 'group-card';
        
        const balance = group.balance || 0;
        const balanceClass = balance > 0 ? 'positive' : 'negative';
        const balanceText = balance > 0 ? 'You are owed' : 'You owe';

        card.innerHTML = `
            <div class="group-header">
                <h3>${group.name}</h3>
                <span class="member-count">${group.memberCount} members</span>
            </div>
            <div class="group-balance">
                <span class="balance-text">${balanceText}: <strong class="${balanceClass}">Rs ${Math.abs(balance).toLocaleString()}</strong></span>
            </div>
            <div class="group-actions">
                <button class="btn-secondary" onclick="window.location.href='group-details.html?groupId=${group.id}'">View Details</button>
                <button class="btn-primary" onclick="window.location.href='add-expense.html?groupId=${group.id}'">+ Add Expense</button>
            </div>
        `;

        return card;
    }

    updateRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        activityList.innerHTML = '';

        // Create activity items from real data
        this.recentActivity.forEach(activity => {
            const activityItem = this.createActivityItem(activity);
            activityList.appendChild(activityItem);
        });

        // Show message if no activity
        if (this.recentActivity.length === 0) {
            activityList.innerHTML = `
                <div class="no-activity-message">
                    <p>No recent activity. Add an expense to get started!</p>
                </div>
            `;
        }
    }

    createActivityItem(activity) {
        const item = document.createElement('div');
        item.className = 'activity-item';

        const icon = activity.type === 'expense' ? '💸' : '✅';
        const iconClass = activity.type === 'expense' ? 'expense-added' : 'payment';
        const amountClass = activity.type === 'payment' ? 'positive' : '';

        item.innerHTML = `
            <div class="activity-icon ${iconClass}">${icon}</div>
            <div class="activity-details">
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
            <div class="activity-amount ${amountClass}">Rs ${activity.amount.toLocaleString()}</div>
        `;

        return item;
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Add logout functionality
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.dashboard.logout());
    }
});