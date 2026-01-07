-- Database Schema for Skills & Resource Management System
-- Updated with Sri Lankan Context

CREATE DATABASE IF NOT EXISTS resource_management_db;
USE resource_management_db;

-- 1. Personnel Table
CREATE TABLE IF NOT EXISTS personnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(100),
    experience_level ENUM('Junior', 'Mid-Level', 'Senior') DEFAULT 'Junior',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT
);

-- 3. Personnel Skills Junction Table
CREATE TABLE IF NOT EXISTS personnel_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personnel_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 5), -- 1: Beginner, 2: Intermediate, 3: Advanced, 4: Expert, 5: Master
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_personnel_skill (personnel_id, skill_id)
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Planning', 'Active', 'Completed') DEFAULT 'Planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Project Requirements Table
CREATE TABLE IF NOT EXISTS project_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    skill_id INT NOT NULL,
    min_proficiency_level INT CHECK (min_proficiency_level BETWEEN 1 AND 5),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 6. Project Assignments (For Utilization Feature)
CREATE TABLE IF NOT EXISTS project_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    personnel_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_assignment (project_id, personnel_id)
);

-- Seed Data (Sri Lankan Context)
INSERT IGNORE INTO skills (name, category, description) VALUES
('React.js', 'Frontend', 'Library for building UIs'),
('Node.js', 'Backend', 'JS Runtime'),
('Java', 'Backend', 'Enterprise standard'),
('PHP', 'Backend', 'Web scripting language'),
('AWS', 'Cloud', 'Amazon Web Services'),
('Flutter', 'Mobile', 'Cross-platform dev'),
('Sinhala Typing', 'Soft Skill', 'Documentation requirement');

INSERT IGNORE INTO personnel (name, email, role, experience_level) VALUES
('Kasun Perera', 'kasun.p@example.lk', 'Senior Tech Lead', 'Senior'),
('Nimali Fernando', 'nimali.f@example.lk', 'UI/UX Designer', 'Mid-Level'),
('Shehan Silva', 'shehan.s@example.lk', 'Full Stack Developer', 'Junior'),
('Amara Jayasinghe', 'amara.j@example.lk', 'QA Engineer', 'Mid-Level'),
('Ruwan Dissanaike', 'ruwan.d@example.lk', 'DevOps Engineer', 'Senior');

-- Initial Skills
INSERT IGNORE INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES
(1, 1, 5), -- Kasun React Expert
(1, 2, 5), -- Kasun Node Expert
(1, 5, 4), -- Kasun AWS
(2, 6, 3), -- Nimali Flutter
(3, 4, 3), -- Shehan PHP
(3, 1, 2); -- Shehan React

-- Seed Projects
INSERT IGNORE INTO projects (name, description, start_date, end_date, status) VALUES
('Dialog Axiata Portal Redesign', 'Revamping the customer self-care portal implementation.', '2026-02-01', '2026-08-01', 'Planning'),
('Cargills Food City E-commerce', 'Online grocery delivery platform maintenance.', '2026-01-15', '2026-06-30', 'Active'),
('Export Development Board System', 'Internal resource management for EDB.', '2025-11-01', '2026-03-01', 'Active');
