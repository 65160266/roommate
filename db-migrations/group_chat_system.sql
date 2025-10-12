-- Group Chat System Database Schema
-- This file creates tables for group chat functionality

USE roommate;

-- =============================================
-- GROUP CHAT TABLES
-- =============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS Group_Messages;
DROP TABLE IF EXISTS Group_Members;
DROP TABLE IF EXISTS Group_Chats;

-- Create Group_Chats table
CREATE TABLE Group_Chats (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- Create Group_Members table
CREATE TABLE Group_Members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (group_id) REFERENCES Group_Chats(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id)
);

-- Create Group_Messages table
CREATE TABLE Group_Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES Group_Chats(group_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Group_Chats indexes
CREATE INDEX idx_group_chats_created_by ON Group_Chats(created_by);
CREATE INDEX idx_group_chats_updated_at ON Group_Chats(updated_at);
CREATE INDEX idx_group_chats_is_active ON Group_Chats(is_active);

-- Group_Members indexes
CREATE INDEX idx_group_members_group_id ON Group_Members(group_id);
CREATE INDEX idx_group_members_user_id ON Group_Members(user_id);
CREATE INDEX idx_group_members_role ON Group_Members(role);
CREATE INDEX idx_group_members_is_active ON Group_Members(is_active);

-- Group_Messages indexes
CREATE INDEX idx_group_messages_group_id ON Group_Messages(group_id);
CREATE INDEX idx_group_messages_sender_id ON Group_Messages(sender_id);
CREATE INDEX idx_group_messages_created_at ON Group_Messages(created_at);
CREATE INDEX idx_group_messages_is_read ON Group_Messages(is_read);

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Insert a sample group chat
INSERT INTO Group_Chats (group_name, description, created_by) VALUES 
('Roommate Group Chat', 'Main group chat for all roommates', 4);

-- Add all users to the sample group
INSERT INTO Group_Members (group_id, user_id, role) VALUES 
(1, 4, 'admin'),
(1, 5, 'member'),
(1, 6, 'member');

-- Insert a sample message
INSERT INTO Group_Messages (group_id, sender_id, message_text) VALUES 
(1, 4, 'Welcome to the group chat! 🎉');

-- =============================================
-- VERIFICATION
-- =============================================

-- Show created tables
SHOW TABLES LIKE 'Group_%';

-- Show sample data
SELECT 'Group Chats:' as info;
SELECT * FROM Group_Chats;

SELECT 'Group Members:' as info;
SELECT * FROM Group_Members;

SELECT 'Group Messages:' as info;
SELECT * FROM Group_Messages;

