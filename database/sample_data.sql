USE splitright_db;

-- Insert sample groups
INSERT INTO groups (name, description, currency, color_theme, created_by) VALUES 
('Roommates', 'Monthly shared expenses', 'PKR', 'blue', 1),
('Vacation Trip', 'Beach vacation expenses', 'PKR', 'purple', 1),
('Family Expenses', 'Monthly family budget', 'PKR', 'green', 1);

-- Add users to groups
INSERT INTO group_members (group_id, user_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),  -- Roommates: All 4 users
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),  -- Vacation: 6 users
(3, 1), (3, 2), (3, 3);  -- Family: 3 users

-- Insert sample expenses
INSERT INTO expenses (description, amount, paid_by, group_id, split_type, expense_date) VALUES
('Groceries', 6000.00, 1, 1, 'equal', '2024-01-15'),
('Electricity Bill', 4000.00, 2, 1, 'equal', '2024-01-10'),
('Pizza Night', 3200.00, 3, 1, 'equal', '2024-01-08'),
('Flight Tickets', 45000.00, 1, 2, 'equal', '2024-01-12'),
('Hotel Booking', 30000.00, 2, 2, 'equal', '2024-01-11'),
('Dinner', 7500.00, 1, 3, 'equal', '2024-01-14');

-- Insert expense splits (this is where balances come from)
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
(2, 1, 1, 3000.00, 'cash', '2024-01-13');