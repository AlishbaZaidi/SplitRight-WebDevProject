// Add Expense functionality
class AddExpense {
    constructor() {
        this.user = null;
        this.token = null;
        this.groupId = null;
        this.groupMembers = [];
        this.groupName = null;
        
        this.init();
    }

    async init() {
        console.log('AddExpense init started');
        
        // Check if user is logged in
        await this.checkAuth();
        
        // Get group ID from URL
        this.getGroupIdFromURL();
        console.log('Group ID from URL:', this.groupId);
        
        // Load group members and name
        await this.loadGroupData();
        
        // Update UI
        this.updateUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('AddExpense init completed');
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
        
        console.log('URL Search Params:', window.location.search);
        console.log('Extracted groupId:', this.groupId);
        
        if (!this.groupId) {
            alert('No group specified. Redirecting to dashboard.');
            window.location.href = 'dashboard.html';
            return;
        }
    }

    async loadGroupData() {
        try {
            console.log('Loading group data for ID:', this.groupId);
            
            // Load group members and name in parallel
            await Promise.all([
                this.loadGroupMembers(),
                this.loadGroupName()
            ]);

        } catch (error) {
            console.error('Error loading group data:', error);
        }
    }

    async loadGroupMembers() {
        try {
            console.log('Fetching group members...');
            const response = await fetch(`/api/expenses/group/${this.groupId}/members`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Group members response status:', response.status);

            if (!response.ok) {
                throw new Error('Failed to load group members');
            }

            this.groupMembers = await response.json();
            console.log('Group members loaded:', this.groupMembers);
            
        } catch (error) {
            console.error('Error loading group members:', error);
            alert('Failed to load group members');
        }
    }

    async loadGroupName() {
        try {
            console.log('Fetching group name from API...');
            const response = await fetch(`/api/groups/${this.groupId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Group name response status:', response.status);

            if (response.ok) {
                const groupData = await response.json();
                console.log('Group data from API:', groupData);
                this.groupName = groupData.name;
            } else {
                console.warn('API failed, using fallback mapping');
                // Fallback to mapping if API fails
                this.groupName = this.getGroupNameFromId(this.groupId);
            }
            
            console.log('Final group name:', this.groupName);
            this.updateGroupSubtitle();
            
        } catch (error) {
            console.error('Error loading group name:', error);
            this.groupName = this.getGroupNameFromId(this.groupId);
            this.updateGroupSubtitle();
        }
    }

    getGroupNameFromId(groupId) {
        const groupNames = {
            '1': 'Roommates',
            '2': 'Vacation Trip', 
            '3': 'Family Expenses'
        };
        const name = groupNames[groupId] || `Group ${groupId}`;
        console.log('Fallback group name:', name);
        return name;
    }

    updateGroupSubtitle() {
        const subtitleElement = document.getElementById('group-subtitle');
        console.log('Updating subtitle element:', subtitleElement);
        
        if (subtitleElement && this.groupName) {
            subtitleElement.textContent = `${this.groupName} group`;
            this.updatePageTitle();
            console.log('Subtitle updated to:', subtitleElement.textContent);
        } else {
            console.error('Could not find subtitle element or group name');
        }
    }

    updatePageTitle() {
        if (this.groupName) {
            document.title = `SplitRight - Add Expense - ${this.groupName} Group`;
        }
    }

    updateUI() {
        console.log('Updating UI...');
        this.updatePaidByDropdown();
        this.updateCustomSplitSection();
        this.updateGroupSubtitle();
        this.updatePageTitle();
        
        // Set today's date as default
        document.getElementById('expense-date').valueAsDate = new Date();
        
        console.log('UI update completed');
    }

    updatePaidByDropdown() {
        const paidBySelect = document.getElementById('paid-by');
        if (!paidBySelect) {
            console.error('paid-by select element not found');
            return;
        }

        // Clear existing options
        paidBySelect.innerHTML = '';

        // Add group members to dropdown
        this.groupMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.id === this.user.id ? `${member.name} (You)` : member.name;
            if (member.id === this.user.id) {
                option.selected = true;
            }
            paidBySelect.appendChild(option);
        });
        
        console.log('Paid by dropdown updated with', this.groupMembers.length, 'members');
    }

    updateCustomSplitSection() {
        const customSplitSection = document.getElementById('custom-split-section');
        const membersList = customSplitSection?.querySelector('.members-split-list');
        
        if (!membersList) {
            console.error('Custom split section or members list not found');
            return;
        }

        // Clear existing members
        membersList.innerHTML = '';

        // Add group members to custom split section
        this.groupMembers.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-split-item';
            
            memberItem.innerHTML = `
                <span class="member-name">${member.id === this.user.id ? `${member.name} (You)` : member.name}</span>
                <div class="amount-input small">
                    <span class="currency">Rs</span>
                    <input type="number" class="custom-amount" data-user-id="${member.id}" placeholder="0" step="1" min="0">
                </div>
            `;
            
            membersList.appendChild(memberItem);
        });
        
        console.log('Custom split section updated with', this.groupMembers.length, 'members');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Toggle custom split section
        const splitRadios = document.querySelectorAll('input[name="split-type"]');
        const customSplitSection = document.getElementById('custom-split-section');

        splitRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                customSplitSection.style.display = radio.value === 'custom' ? 'block' : 'none';
            });
        });

        // Form submission
        document.getElementById('addExpenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Cancel button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                window.location.href = `group-details.html?groupId=${this.groupId}`;
            }
        });

        // Logout
        document.querySelector('.btn-logout').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });

        // Back button
        document.querySelector('.btn-back').addEventListener('click', () => {
            window.location.href = `group-details.html?groupId=${this.groupId}`;
        });
        
        console.log('Event listeners setup completed');
    }

    async handleSubmit() {
        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const paidBy = document.getElementById('paid-by').value;
        const splitType = document.querySelector('input[name="split-type"]:checked').value;
        const expenseDate = document.getElementById('expense-date').value;
        const notes = document.getElementById('expense-notes').value;

        // Validation
        if (!description || !amount || amount <= 0) {
            alert('Please fill in all required fields with valid values');
            return;
        }

        let splits = null;
        if (splitType === 'custom') {
            splits = this.getCustomSplits(amount, paidBy);
            if (!splits) return; // Validation failed in getCustomSplits
        }

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description,
                    amount,
                    paid_by: paidBy,
                    group_id: this.groupId,
                    split_type: splitType,
                    expense_date: expenseDate,
                    notes,
                    splits
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Expense added successfully!');
                window.location.href = `group-details.html?groupId=${this.groupId}`;
            } else {
                alert(data.error || 'Failed to add expense');
            }

        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Failed to add expense. Please try again.');
        }
    }

    getCustomSplits(totalAmount, paidBy) {
        const customAmountInputs = document.querySelectorAll('.custom-amount');
        let splits = [];
        let totalCustomAmount = 0;

        console.log('Calculating custom splits for total:', totalAmount, 'paid by:', paidBy);

        customAmountInputs.forEach(input => {
            const amount = parseFloat(input.value) || 0;
            const userId = parseInt(input.dataset.userId);
            
            console.log(`User ${userId} entered: ${amount}`);

            // FIXED: Correct custom split logic
            let splitAmount;
            if (userId === parseInt(paidBy)) {
                // Payer gets: total - what they paid for themselves (POSITIVE)
                splitAmount = parseFloat((totalAmount - amount).toFixed(2));
            } else {
                // Others get: -amount (NEGATIVE)
                splitAmount = parseFloat((-amount).toFixed(2));
            }
            
            splits.push({
                user_id: userId,
                amount: splitAmount
            });
            
            totalCustomAmount += amount;
            console.log(`User ${userId} split amount: ${splitAmount}`);
        });

        console.log('Total custom amount:', totalCustomAmount, 'Expected:', totalAmount);

        // Validate that custom amounts equal the total
        if (Math.abs(totalCustomAmount - totalAmount) > 0.01) {
            alert(`Custom amounts (Rs ${totalCustomAmount.toFixed(2)}) must equal the total expense amount (Rs ${totalAmount.toFixed(2)})`);
            return null;
        }

        console.log('Final splits:', splits);
        return splits;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing AddExpense');
    window.addExpense = new AddExpense();
});