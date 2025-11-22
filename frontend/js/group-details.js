// Group Details functionality
class GroupDetails {
    constructor() {
        this.user = null;
        this.token = null;
        this.groupId = null;
        this.groupData = null;
        this.members = [];
        this.memberBalances = [];
        this.expenses = [];
        
        this.init();
    }

    async init() {
        // Check if user is logged in
        await this.checkAuth();
        
        // Get group ID from URL
        this.getGroupIdFromURL();
        
        // Load all group data
        await this.loadAllGroupData();
        
        // Update UI
        this.updateUI();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        this.token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!this.token || !userData) {
            window.location.href = 'login.html';
            return;
        }

        this.user = JSON.parse(userData);
        
        // Update user name in header
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = this.user.name;
        }
    }

    getGroupIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.groupId = urlParams.get('groupId');
        
        if (!this.groupId) {
            alert('No group specified. Redirecting to dashboard.');
            window.location.href = 'dashboard.html';
            return;
        }
    }

    async loadAllGroupData() {
        try {
            // Load group basic info, members, and expenses
            await Promise.all([
                this.loadGroupInfo(),
                this.loadGroupMembers(), 
                this.loadExpenses()
            ]);

        } catch (error) {
            console.error('Error loading group data:', error);
        }
    }

    async loadGroupInfo() {
        try {
            const response = await fetch(`/api/debug-group-expenses?groupId=${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Calculate user's NET balance (what others owe you minus what you owe others)
                let userBalance = 0;
                data.expenses.forEach(expense => {
                    userBalance += parseFloat(expense.user_share) || 0;
                });

                // Get group name from mapping
                const groupName = this.getGroupNameFromId(this.groupId);
                
                this.groupData = {
                    id: this.groupId,
                    name: groupName,
                    memberCount: this.members.length,
                    userBalance: userBalance
                };

                console.log(`Group ${this.groupId} NET balance for user:`, userBalance);
            }

        } catch (error) {
            console.error('Error loading group info:', error);
        }
    }

    async loadGroupMembers() {
        try {
            // Load members
            const membersResponse = await fetch(`/api/expenses/group/${this.groupId}/members`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (membersResponse.ok) {
                this.members = await membersResponse.json();
                
                // Load member balances
                const balancesResponse = await fetch(`/api/debug-group-balances?groupId=${this.groupId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (balancesResponse.ok) {
                    const balancesData = await balancesResponse.json();
                    this.memberBalances = balancesData.memberBalances;
                }
            } else {
                this.members = [];
                this.memberBalances = [];
            }

        } catch (error) {
            console.error('Error loading group members:', error);
            this.members = [];
            this.memberBalances = [];
        }
        console.log('All member balances:', this.memberBalances);
        // Check if balances sum to approximately zero (they should)
        const totalBalance = this.memberBalances.reduce((sum, member) => sum + parseFloat(member.balance), 0);
        console.log('Total balance (should be near 0):', totalBalance);
    }

    async loadExpenses() {
        try {
            const response = await fetch(`/api/debug-group-expenses?groupId=${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.expenses = data.expenses;
                console.log('Loaded expenses:', this.expenses);
            } else {
                this.expenses = [];
            }

        } catch (error) {
            console.error('Error loading expenses:', error);
            this.expenses = [];
        }
    }

    getGroupNameFromId(groupId) {
        // Temporary mapping until we have proper groups API
        const groupNames = {
            '1': 'Roommates',
            '2': 'Vacation Trip', 
            '3': 'Family Expenses'
        };
        return groupNames[groupId] || `Group ${groupId}`;
    }

    updateUI() {
        this.updateGroupHeader();
        this.updatePageTitle();
        this.updateBalanceSummary();
        this.updateMembersList();
        this.updateExpensesList();
    }

    updateGroupHeader() {
        const groupNameElement = document.querySelector('.group-info h2');
        const groupMembersElement = document.querySelector('.group-members');
        
        if (groupNameElement && this.groupData) {
            groupNameElement.textContent = this.groupData.name;
        }
        
        if (groupMembersElement && this.groupData) {
            groupMembersElement.textContent = `${this.members.length} members • Created recently`;
        }

        // Update subtitle in add expense section if it exists
        const subtitleElement = document.querySelector('.subtitle');
        if (subtitleElement && this.groupData) {
            subtitleElement.textContent = this.groupData.name + ' group';
        }
    }

    updatePageTitle() {
        if (this.groupData && this.groupData.name) {
            document.title = `SplitRight - ${this.groupData.name} Group`;
        }
    }

    updateBalanceSummary() {
        const balanceElement = document.querySelector('.balance-amount');
        if (balanceElement && this.groupData) {
            const userBalance = parseFloat(this.groupData.userBalance) || 0;
            
            // CORRECT INTERPRETATION:
            // Positive userBalance = you are OWED money (others owe you)
            // Negative userBalance = you OWE money (you owe others)
            
            const youAreOwed = userBalance > 0;
            const youOwe = userBalance < 0;
            const amount = Math.abs(userBalance);
            
            let balanceText = 'Settled';
            if (youAreOwed) {
                balanceText = `You are owed: <strong>+Rs ${amount.toLocaleString()}</strong>`;
            } else if (youOwe) {
                balanceText = `You owe: <strong>-Rs ${amount.toLocaleString()}</strong>`;
            }
            
            balanceElement.innerHTML = balanceText;
            balanceElement.className = `balance-amount ${youAreOwed ? 'positive' : (youOwe ? 'negative' : '')}`;
        }
    }

    updateMembersList() {
        const membersList = document.querySelector('.members-list');
        if (!membersList) return;

        membersList.innerHTML = '';

        // Filter out the current user from the members list display
        const otherMembers = this.members.filter(member => member.id !== this.user.id);

        otherMembers.forEach(member => {
            const memberItem = this.createMemberItem(member);
            membersList.appendChild(memberItem);
        });

        // Show message if no other members
        if (otherMembers.length === 0) {
            membersList.innerHTML = `
                <div class="no-members-message">
                    <p>No other members in this group.</p>
                </div>
            `;
        }
    }

    createMemberItem(member) {
        const item = document.createElement('div');
        item.className = 'member-item';

        // Get the actual balance for this member
        const memberBalanceData = this.memberBalances.find(mb => mb.id === member.id);
        const memberBalance = memberBalanceData ? parseFloat(memberBalanceData.balance) : 0;
        
        console.log(`Member ${member.name} balance: ${memberBalance}`);

        // CORRECT BALANCE INTERPRETATION:
        // Positive balance = this member is OWED money (they paid more than their share)
        // Negative balance = this member OWES money (they paid less than their share)
        
        // For the CURRENT USER's perspective:
        // If memberBalance is POSITIVE: You OWE this member money
        // If memberBalance is NEGATIVE: This member OWES YOU money
        
        const youOweThem = memberBalance > 0;  // Positive = you owe them
        const theyOweYou = memberBalance < 0;  // Negative = they owe you
        
        const balanceClass = theyOweYou ? 'positive' : (youOweThem ? 'negative' : '');

        let balanceText = 'Settled';
        if (theyOweYou) {
            balanceText = `Owes you: Rs ${Math.abs(memberBalance).toLocaleString()}`;
        } else if (youOweThem) {
            balanceText = `You owe: Rs ${Math.abs(memberBalance).toLocaleString()}`;
        }

        item.innerHTML = `
            <div class="member-info">
                <span class="member-name">${member.name}</span>
            </div>
            <span class="member-balance ${balanceClass}">
                ${balanceText}
            </span>
            ${youOweThem ? `
                <div class="member-actions">
                    <button class="btn-settle-small" onclick="window.location.href='settle-up.html?groupId=${this.groupId}&userId=${member.id}'">Settle Up</button>
                </div>
            ` : ''}
        `;

        return item;
    }

    calculateMemberBalance(memberId) {
        let balance = 0;
        this.expenses.forEach(expense => {
            // For the current user, use the pre-calculated user_share
            if (memberId === this.user.id) {
                balance += parseFloat(expense.user_share) || 0;
            } else {
                // For other members, we need to calculate their share from expense_splits
                // This is a simplified calculation - in a real app, you'd fetch this from an API
                const expenseAmount = parseFloat(expense.amount) || 0;
                
                if (expense.split_type === 'equal') {
                    const memberCount = expense.member_count || 1;
                    const equalShare = expenseAmount / memberCount;
                    
                    if (memberId === parseInt(expense.paid_by)) {
                        // This member paid - they get (total - their share)
                        balance += (expenseAmount - equalShare);
                    } else {
                        // This member owes their share
                        balance -= equalShare;
                    }
                }
                // Note: Custom split calculation would be more complex
            }
        });
        return parseFloat(balance.toFixed(2));
    }

    updateExpensesList() {
        const expensesList = document.querySelector('.expenses-list');
        if (!expensesList) return;

        expensesList.innerHTML = '';

        if (this.expenses.length === 0) {
            expensesList.innerHTML = `
                <div class="no-expenses-message">
                    <p>No expenses yet. <button class="btn-link" onclick="window.location.href='add-expense.html?groupId=${this.groupId}'">Add the first expense!</button></p>
                </div>
            `;
            return;
        }

        this.expenses.forEach(expense => {
            const expenseItem = this.createExpenseItem(expense);
            expensesList.appendChild(expenseItem);
        });
    }

    createExpenseItem(expense) {
        const item = document.createElement('div');
        item.className = 'expense-item';

        // Parse amounts safely
        const expenseAmount = parseFloat(expense.amount) || 0;
        const userShare = parseFloat(expense.user_share) || 0;
        
        // Determine if user paid or owes
        const userPaid = expense.paid_by === this.user.id;
        const userOwes = userShare < 0;
        
        const amountText = userPaid ? 'You paid' : `You owe Rs ${Math.abs(userShare).toLocaleString()}`;
        const amountClass = userPaid ? 'you-paid' : 'you-owe';

        item.innerHTML = `
            <div class="expense-icon">${this.getExpenseIcon(expense.description)}</div>
            <div class="expense-details">
                <h4>${expense.description}</h4>
                <p>Added by <strong>${expense.payer_name}</strong> • ${this.formatTimeAgo(expense.created_at)}</p>
                <div class="expense-members">
                    <span class="split-info">Split ${expense.split_type} between ${expense.member_count} people</span>
                </div>
            </div>
            <div class="expense-amount">
                <span class="amount">Rs ${expenseAmount.toLocaleString()}</span>
                <span class="${amountClass}">${amountText}</span>
            </div>
        `;

        return item;
    }

    getExpenseIcon(description) {
        const icons = {
            'groceries': '🛒',
            'electricity': '⚡',
            'pizza': '🍕',
            'flight': '✈️',
            'hotel': '🏨',
            'dinner': '🍽️',
            'netflix': '📺',
            'default': '💸'
        };

        const desc = description.toLowerCase();
        if (desc.includes('grocery')) return icons.groceries;
        if (desc.includes('electric')) return icons.electricity;
        if (desc.includes('pizza')) return icons.pizza;
        if (desc.includes('flight')) return icons.flight;
        if (desc.includes('hotel')) return icons.hotel;
        if (desc.includes('dinner')) return icons.dinner;
        if (desc.includes('netflix')) return icons.netflix;
        return icons.default;
    }

    formatTimeAgo(date) {
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
    }

    setupEventListeners() {
        // Add expense button
        const addExpenseBtn = document.querySelector('.btn-primary');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                window.location.href = `add-expense.html?groupId=${this.groupId}`;
            });
        }

        // Back button
        const backBtn = document.querySelector('.btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }

        // Logout
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            });
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.groupDetails = new GroupDetails();
});