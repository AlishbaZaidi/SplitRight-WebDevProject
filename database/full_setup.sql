-- Complete database setup for SplitRight
DROP DATABASE IF EXISTS splitright_db;
CREATE DATABASE splitright_db;
USE splitright_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'PKR',
    color_theme VARCHAR(20) DEFAULT 'blue',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    user_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (group_id, user_id)
);

-- Expenses table
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_by INT,
    group_id INT,
    split_type ENUM('equal', 'custom') DEFAULT 'equal',
    expense_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paid_by) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Expense splits table
CREATE TABLE expense_splits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT,
    user_id INT,
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settlements table
CREATE TABLE settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user INT,
    to_user INT,
    group_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    settlement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES users(id),
    FOREIGN KEY (to_user) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO users (name, email, password) VALUES 
('Alishba', 'alishba@example.com', '$2b$10$examplehashedpassword'),
('Huzaifa', 'huzaifa@example.com', '$2b$10$examplehashedpassword'),
('Sarah', 'sarah@example.com', '$2b$10$examplehashedpassword'),
('Ali', 'ali@example.com', '$2b$10$examplehashedpassword'),
('Ahmed', 'ahmed@example.com', '$2b$10$examplehashedpassword'),
('Fatima', 'fatima@example.com', '$2b$10$examplehashedpassword');

-- Insert sample groups
INSERT INTO groups (name, description, currency, color_theme, created_by) VALUES 
('Roommates', 'Monthly shared expenses', 'PKR', 'blue', 1),
('Vacation Trip', 'Beach vacation expenses', 'PKR', 'purple', 1),
('Family Expenses', 'Monthly family budget', 'PKR', 'green', 1);

-- Add users to groups
INSERT INTO group_members (group_id, user_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),  -- Roommates: 4 users
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),  -- Vacation: 6 users
(3, 1), (3, 2), (3, 3);  -- Family: 3 users

-- Insert sample expenses
INSERT INTO expenses (description, amount, paid_by, group_id, split_type, expense_date) VALUES
('Groceries', 6000.00, 1, 1, 'equal', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('Electricity Bill', 4000.00, 2, 1, 'equal', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('Pizza Night', 3200.00, 3, 1, 'equal', DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
('Flight Tickets', 45000.00, 1, 2, 'equal', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('Hotel Booking', 30000.00, 2, 2, 'equal', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('Dinner', 7500.00, 1, 3, 'equal', DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Insert expense splits
INSERT INTO expense_splits (expense_id, user_id, amount) VALUES
-- Groceries (6000/4 = 1500 each)
(1, 1, -1500.00), (1, 2, 1500.00), (1, 3, 1500.00), (1, 4, 1500.00),
-- Electricity Bill (4000/4 = 1000 each)  
(2, 1, 1000.00), (2, 2, -1000.00), (2, 3, 1000.00), (2, 4, 1000.00),
-- Pizza Night (3200/4 = 800 each)
(3, 1, 800.00), (3, 2, 800.00), (3, 3, -800.00), (3, 4, 800.00),
-- Flight Tickets (45000/6 = 7500 each)
(4, 1, -7500.00), (4, 2, 7500.00), (4, 3, 7500.00), (4, 4, 7500.00), (4, 5, 7500.00), (4, 6, 7500.00),
-- Hotel Booking (30000/6 = 5000 each)
(5, 1, 5000.00), (5, 2, -5000.00), (5, 3, 5000.00), (5, 4, 5000.00), (5, 5, 5000.00), (5, 6, 5000.00),
-- Dinner (7500/3 = 2500 each)
(6, 1, -2500.00), (6, 2, 2500.00), (6, 3, 2500.00);

-- Insert sample settlements
INSERT INTO settlements (from_user, to_user, group_id, amount, payment_method, settlement_date) VALUES
(2, 1, 1, 3000.00, 'cash', DATE_SUB(CURDATE(), INTERVAL 1 DAY));