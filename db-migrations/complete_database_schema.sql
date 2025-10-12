-- Complete Database Schema for Roommate Application
-- This file contains all the necessary tables for the roommate matching and chat system

USE roommate;

-- =============================================
-- CORE TABLES
-- =============================================

-- User Registration Table
CREATE TABLE IF NOT EXISTS Register (
    Register_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    regis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_id INT DEFAULT NULL
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS User_role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS Permission (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Role-Permission Junction Table
CREATE TABLE IF NOT EXISTS User_role_has_Permission (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES User_role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permission(permission_id) ON DELETE CASCADE
);

-- =============================================
-- ACCOUNT & PROFILE TABLES
-- =============================================

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

-- Personality Table
CREATE TABLE IF NOT EXISTS Personality (
    personality_id INT AUTO_INCREMENT PRIMARY KEY,
    personality_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
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

-- Account-Personality Junction Table
CREATE TABLE IF NOT EXISTS Accounts_has_Personality (
    Accounts_id INT,
    personality_id INT,
    PRIMARY KEY (Accounts_id, personality_id),
    FOREIGN KEY (Accounts_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (personality_id) REFERENCES Personality(personality_id) ON DELETE CASCADE
);

-- =============================================
-- POST & ROOM TABLES
-- =============================================

-- Post Table
CREATE TABLE IF NOT EXISTS Post (
    Post_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    author_id INT NOT NULL,
    
    FOREIGN KEY (author_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- Post Details Table
CREATE TABLE IF NOT EXISTS Post_detail (
    Post_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    amenities TEXT,
    contact_info VARCHAR(255),
    Post_id INT NOT NULL,
    
    FOREIGN KEY (Post_id) REFERENCES Post(Post_id) ON DELETE CASCADE
);

-- Room Table
CREATE TABLE IF NOT EXISTS Room (
    Room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room-Accounts Junction Table
CREATE TABLE IF NOT EXISTS Room_has_Accounts (
    Room_id INT,
    Accounts_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Room_id, Accounts_id),
    FOREIGN KEY (Room_id) REFERENCES Room(Room_id) ON DELETE CASCADE,
    FOREIGN KEY (Accounts_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- =============================================
-- MATCHING SYSTEM TABLES
-- =============================================

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

-- =============================================
-- CHAT SYSTEM TABLES
-- =============================================

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
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Register table indexes
CREATE INDEX idx_register_email ON Register(email);
CREATE INDEX idx_register_regis_date ON Register(regis_date);

-- Accounts table indexes
CREATE INDEX idx_accounts_student_id ON Accounts(student_id);
CREATE INDEX idx_accounts_register_id ON Accounts(Register_id);
CREATE INDEX idx_accounts_faculty_id ON Accounts(Faculty_id);
CREATE INDEX idx_accounts_majors_id ON Accounts(Majors_id);
CREATE INDEX idx_accounts_status ON Accounts(status);

-- Post table indexes
CREATE INDEX idx_post_author_id ON Post(author_id);
CREATE INDEX idx_post_created_at ON Post(created_at);

-- Post_detail table indexes
CREATE INDEX idx_post_detail_post_id ON Post_detail(Post_id);
CREATE INDEX idx_post_detail_price ON Post_detail(price);

-- Matches table indexes
CREATE INDEX idx_matches_requester ON Matches(requester_id);
CREATE INDEX idx_matches_target ON Matches(target_id);
CREATE INDEX idx_matches_status ON Matches(status);
CREATE INDEX idx_matches_created_at ON Matches(created_at);

-- Chat system indexes
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_chat_rooms_updated_at ON ChatRooms(updated_at);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Insert sample user roles
INSERT IGNORE INTO User_role (role_id, role_name) VALUES 
(1, 'Student'),
(2, 'Admin');

-- Insert sample permissions
INSERT IGNORE INTO Permission (permission_id, permission_name, description) VALUES 
(1, 'view_posts', 'View roommate posts'),
(2, 'create_posts', 'Create new posts'),
(3, 'send_matches', 'Send match requests'),
(4, 'chat_with_matches', 'Chat with matched users'),
(5, 'admin_access', 'Administrative access');

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

-- Insert sample personalities
INSERT IGNORE INTO Personality (personality_id, personality_name, description) VALUES 
(1, 'เงียบ', 'ชอบความเงียบสงบ'),
(2, 'สังคม', 'ชอบเข้าสังคม'),
(3, 'เรียบร้อย', 'ชอบความเรียบร้อย'),
(4, 'ผ่อนคลาย', 'ชอบความผ่อนคลาย'),
(5, 'ขยัน', 'ขยันทำงาน'),
(6, 'สนุกสนาน', 'ชอบความสนุกสนาน');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user profiles with faculty and major names
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    a.Accounts_id,
    a.student_id,
    a.first_name,
    a.last_name,
    a.age,
    a.phone,
    a.gender,
    a.image,
    a.year,
    a.nickname,
    a.status,
    f.faculty_name,
    m.majors_name,
    r.email
FROM Accounts a
LEFT JOIN Faculty f ON a.Faculty_id = f.faculty_id
LEFT JOIN Majors m ON a.Majors_id = m.majors_id
LEFT JOIN Register r ON a.Register_id = r.Register_id;

-- View for match statistics
CREATE OR REPLACE VIEW match_stats AS
SELECT 
    a.Accounts_id,
    CONCAT(a.first_name, ' ', a.last_name) as user_name,
    COUNT(CASE WHEN m.status = 'pending' AND m.requester_id = a.Accounts_id THEN 1 END) as sent_pending,
    COUNT(CASE WHEN m.status = 'pending' AND m.target_id = a.Accounts_id THEN 1 END) as received_pending,
    COUNT(CASE WHEN m.status = 'confirmed' AND (m.requester_id = a.Accounts_id OR m.target_id = a.Accounts_id) THEN 1 END) as confirmed_matches
FROM Accounts a
LEFT JOIN Matches m ON (a.Accounts_id = m.requester_id OR a.Accounts_id = m.target_id)
GROUP BY a.Accounts_id, a.first_name, a.last_name;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to get or create chat room
CREATE PROCEDURE GetOrCreateChatRoom(
    IN p_user1_id INT,
    IN p_user2_id INT,
    OUT p_chat_id INT
)
BEGIN
    DECLARE v_smaller_id INT;
    DECLARE v_larger_id INT;
    
    -- Ensure user1_id < user2_id
    IF p_user1_id < p_user2_id THEN
        SET v_smaller_id = p_user1_id;
        SET v_larger_id = p_user2_id;
    ELSE
        SET v_smaller_id = p_user2_id;
        SET v_larger_id = p_user1_id;
    END IF;
    
    -- Check if chat room already exists
    SELECT chat_id INTO p_chat_id 
    FROM ChatRooms 
    WHERE user1_id = v_smaller_id AND user2_id = v_larger_id;
    
    -- If chat room doesn't exist, create it
    IF p_chat_id IS NULL THEN
        INSERT INTO ChatRooms (user1_id, user2_id) 
        VALUES (v_smaller_id, v_larger_id);
        SET p_chat_id = LAST_INSERT_ID();
    END IF;
END//

-- Procedure to get user's chat rooms with last message
CREATE PROCEDURE GetUserChatRooms(IN p_user_id INT)
BEGIN
    SELECT 
        cr.chat_id,
        cr.created_at,
        cr.updated_at,
        CASE 
            WHEN cr.user1_id = p_user_id THEN a2.Accounts_id
            ELSE a1.Accounts_id
        END as other_user_id,
        CASE 
            WHEN cr.user1_id = p_user_id THEN CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, ''))
            ELSE CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, ''))
        END as other_user_name,
        CASE 
            WHEN cr.user1_id = p_user_id THEN a2.image
            ELSE a1.image
        END as other_user_image,
        (SELECT message_text FROM Messages 
         WHERE chat_id = cr.chat_id 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM Messages 
         WHERE chat_id = cr.chat_id 
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM Messages 
         WHERE chat_id = cr.chat_id 
         AND sender_id != p_user_id 
         AND is_read = FALSE) as unread_count
    FROM ChatRooms cr
    LEFT JOIN Accounts a1 ON cr.user1_id = a1.Accounts_id
    LEFT JOIN Accounts a2 ON cr.user2_id = a2.Accounts_id
    WHERE cr.user1_id = p_user_id OR cr.user2_id = p_user_id
    ORDER BY cr.updated_at DESC;
END//

DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update chat room timestamp when new message is added
DELIMITER //
CREATE TRIGGER update_chatroom_timestamp
AFTER INSERT ON Messages
FOR EACH ROW
BEGIN
    UPDATE ChatRooms 
    SET updated_at = NOW() 
    WHERE chat_id = NEW.chat_id;
END//
DELIMITER ;

-- =============================================
-- FINAL NOTES
-- =============================================

-- This schema includes:
-- 1. User registration and authentication
-- 2. User profiles with faculty and major information
-- 3. Post system for roommate listings
-- 4. Matching system for roommate requests
-- 5. Chat system for matched users
-- 6. Proper indexes for performance
-- 7. Sample data for testing
-- 8. Views for common queries
-- 9. Stored procedures for complex operations
-- 10. Triggers for automatic updates

-- To use this schema:
-- 1. Create a database named 'roommate'
-- 2. Run this SQL file
-- 3. The application will work with all features enabled

