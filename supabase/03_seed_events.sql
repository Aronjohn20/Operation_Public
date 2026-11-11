-- ============================================
-- Technical Student Society - Seed Events & Assignments (Sample Demo)
-- Run this THIRD (after members are seeded)
-- ============================================

-- Insert sample events
INSERT INTO events (event_name, event_date, status, required_coordinators) VALUES
('CodeStorm 2026 – 24hr State Hackathon', '2026-11-28', 'planned', 3),
('AI & Neural Agents Hands-On Bootcamp', '2026-10-15', 'confirmed', 2),
('Off the Script – Leadership & Tech Debate', '2026-09-25', 'completed', 4);

-- Assign sample coordinators to events using subqueries
-- Event 1: CodeStorm 2026
INSERT INTO event_coordinators (event_id, member_id)
SELECT e.id, m.id FROM events e, members m
WHERE e.event_name = 'CodeStorm 2026 – 24hr State Hackathon'
  AND m.name IN ('Alex Johnson', 'Priya Sharma', 'David Miller');

-- Event 2: AI & Neural Agents Hands-On Bootcamp
INSERT INTO event_coordinators (event_id, member_id)
SELECT e.id, m.id FROM events e, members m
WHERE e.event_name = 'AI & Neural Agents Hands-On Bootcamp'
  AND m.name IN ('Amina Khan', 'Siddharth Verma');

-- Event 3: Off the Script – Leadership & Tech Debate
INSERT INTO event_coordinators (event_id, member_id)
SELECT e.id, m.id FROM events e, members m
WHERE e.event_name = 'Off the Script – Leadership & Tech Debate'
  AND m.name IN ('Alex Johnson', 'Kevin Varghese', 'Neha Patel', 'Rohan Kurian');
