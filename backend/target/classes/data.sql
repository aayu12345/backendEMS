-- Insert Admin User (if not exists)
-- This ensures you always have a way to log in
INSERT INTO users (email, password, name, role, employee_id, created_at) VALUES 
('admin@company.com', '$2b$10$1NDvcbVEOeNuIU9JAUsrru3p.kgQEWcOtkYS6H5QiPHDTjVWAceHS', 'System Admin', 'ADMIN', 'admin-1', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert predefined departments
INSERT INTO departments (id, name, budget, location, manager, headcount) VALUES 
('DEPT-001', 'Human Resources', 1500000, 'HQ - Floor 1', 'HR Admin', 0),
('DEPT-002', 'Engineering', 5000000, 'HQ - Floor 3', 'Engineering Manager', 0),
('DEPT-003', 'Sales & Marketing', 2500000, 'HQ - Floor 2', 'Sales Director', 0),
('DEPT-004', 'Operations', 3000000, 'Warehouse A', 'Ops Manager', 0),
('DEPT-005', 'Finance', 2000000, 'HQ - Floor 4', 'Finance Director', 0)
ON CONFLICT (id) DO NOTHING;
