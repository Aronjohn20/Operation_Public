-- ============================================
-- Technical Student Society - Seed Members Data (Sample Demo)
-- Run this SECOND (after schema)
-- ============================================

INSERT INTO members (name, role, domain, class_batch, member_type, is_active, events_coordinated_count) VALUES
('Alex Johnson', 'President', 'Executive', 'S7 CS A', 'old_coordinator', TRUE, 2),
('Priya Sharma', 'Vice President', 'Executive', 'S7 CS B', 'old_coordinator', TRUE, 1),
('David Miller', 'Secretary', 'Executive', 'S7 IT', 'old_coordinator', TRUE, 2),
('Amina Khan', 'Joint Secretary', 'Executive', 'S7 CSBS', 'old_coordinator', TRUE, 1),
('Siddharth Verma', 'Operations Lead', 'Operations', 'S5 CS C', 'old_coordinator', TRUE, 2),
('Sneha Roy', 'Operations Co-Lead', 'Operations', 'S3 CS A', 'new_coordinator', TRUE, 1),
('Kevin Varghese', 'Technical Lead', 'Technical', 'S5 IT', 'old_coordinator', TRUE, 3),
('Neha Patel', 'Technical Co-Lead', 'Technical', 'S3 AD', 'new_coordinator', TRUE, 1),
('Rohan Kurian', 'Creative Lead', 'Creative', 'S5 CSBS', 'old_coordinator', TRUE, 1),
('Diya Nair', 'Creative Co-Lead', 'Creative', 'S3 CS B', 'new_coordinator', TRUE, 2),
('Adithya P', 'Documentation Lead', 'Documentation', 'S7 CS A', 'old_coordinator', TRUE, 2),
('Ananya Menon', 'Documentation Co-Lead', 'Documentation', 'S3 IT', 'new_coordinator', TRUE, 1),
('Kripa Ann', 'Marketing Lead', 'Marketing', 'S5 AD', 'old_coordinator', TRUE, 1),
('Ben George', 'Marketing Co-Lead', 'Marketing', 'S3 CS C', 'new_coordinator', TRUE, 1),
('Sarah Elsa', 'Sub-Core (Technical)', 'Technical', 'S3 CS D', 'new_coordinator', TRUE, 0),
('Naveen Joy', 'Sub-Core (Operations)', 'Operations', 'S3 AD', 'new_coordinator', TRUE, 0);
