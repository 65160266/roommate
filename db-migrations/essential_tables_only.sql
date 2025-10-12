-- Essential Tables for Roommate Application
-- This file contains only the core tables needed for basic functionality

USE roommate;

-- =============================================
-- ESSENTIAL TABLES ONLY
-- =============================================

-- User Registration Table
CREATE TABLE IF NOT EXISTS Register (
    Register_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    regis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_id INT DEFAULT NULL
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_name VARCHAR(255) NOT NULL UNIQUE
);

-- Majors Table
CREATE TABLE IF NOT EXISTS Majors (
    majors_id INT AUTO_INCREMENT PRIMARY KEY,
    majors_name VARCHAR(255) NOT NULL UNIQUE
);

-- Accounts Table (User Profiles)
CREATE TABLE IF NOT EXISTS Accounts (
    Accounts_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    phone INT NOT NULL,
    gender ENUM('ชาย', 'หญิง') NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    year ENUM('ปี1', 'ปี2', 'ปี3', 'ปี4') DEFAULT NULL,
    nickname VARCHAR(100) NOT NULL,
    status ENUM('กำลังศึกษา', 'จบการศึกษา') DEFAULT 'กำลังศึกษา',
    Register_id INT NOT NULL,
    Post_detail_id INT DEFAULT NULL,
    Majors_id INT NOT NULL,
    Faculty_id INT NOT NULL,
    
    FOREIGN KEY (Register_id) REFERENCES Register(Register_id) ON DELETE CASCADE,
    FOREIGN KEY (Majors_id) REFERENCES Majors(majors_id) ON DELETE RESTRICT,
    FOREIGN KEY (Faculty_id) REFERENCES Faculty(faculty_id) ON DELETE RESTRICT
);

-- Matches Table (Roommate Matching)
CREATE TABLE IF NOT EXISTS Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    target_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (requester_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    -- Prevent self-matching
    CONSTRAINT check_no_self_match CHECK (requester_id != target_id),
    
    -- Ensure unique match requests
    UNIQUE KEY unique_match (requester_id, target_id)
);

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS ChatRooms (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user1_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    -- Ensure user1_id < user2_id to prevent duplicate rooms
    CONSTRAINT check_user_order CHECK (user1_id < user2_id),
    
    -- Ensure unique chat rooms between two users
    UNIQUE KEY unique_chat_room (user1_id, user2_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chat_id) REFERENCES ChatRooms(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- =============================================
-- ESSENTIAL INDEXES
-- =============================================

-- Register table indexes
CREATE INDEX idx_register_email ON Register(email);

-- Accounts table indexes
CREATE INDEX idx_accounts_student_id ON Accounts(student_id);
CREATE INDEX idx_accounts_register_id ON Accounts(Register_id);
CREATE INDEX idx_accounts_faculty_id ON Accounts(Faculty_id);
CREATE INDEX idx_accounts_majors_id ON Accounts(Majors_id);

-- Matches table indexes
CREATE INDEX idx_matches_requester ON Matches(requester_id);
CREATE INDEX idx_matches_target ON Matches(target_id);
CREATE INDEX idx_matches_status ON Matches(status);

-- Chat system indexes
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample faculties
INSERT IGNORE INTO Faculty (faculty_id, faculty_name) VALUES 
(1, 'คณะวิศวกรรมศาสตร์'),
(2, 'คณะวิทยาศาสตร์'),
(3, 'คณะบริหารธุรกิจ'),
(4, 'คณะศิลปศาสตร์'),
(5, 'คณะศึกษาศาสตร์');

-- Insert sample majors
INSERT IGNORE INTO Majors (majors_id, majors_name) VALUES 
(1, 'วิศวกรรมคอมพิวเตอร์'),
(2, 'วิศวกรรมซอฟต์แวร์'),
(3, 'วิทยาการคอมพิวเตอร์'),
(4, 'เทคโนโลยีสารสนเทศ'),
(5, 'การจัดการ'),
(6, 'การตลาด'),
(7, 'ภาษาอังกฤษ'),
(8, 'จิตวิทยา');

