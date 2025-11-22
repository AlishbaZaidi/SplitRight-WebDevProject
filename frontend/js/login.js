// Login functionality
class Login {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle between login and signup forms
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.remove('active');
            document.getElementById('signup-form').classList.add('active');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        });

        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Signup form submission
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
        document.title = `SplitRight - Login`;
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save token and user data to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Login successful! Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleSignup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message and redirect to login
                alert('Account created successfully! Please log in.');
                
                // Clear the form
                document.getElementById('signup-name').value = '';
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm').value = '';
                
                // Switch back to login form
                document.getElementById('signup-form').classList.remove('active');
                document.getElementById('login-form').classList.add('active');
                
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }
}

// Initialize login when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.login = new Login();
});