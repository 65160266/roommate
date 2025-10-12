-- Chat System Tables for phpMyAdmin
-- Copy and paste this code into phpMyAdmin SQL tab

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

-- Create indexes for better performance
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_chat_rooms_updated_at ON ChatRooms(updated_at);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if tables were created successfully
SELECT 'ChatRooms table created successfully' as status;
SELECT 'Messages table created successfully' as status;

-- Show table structure
DESCRIBE ChatRooms;
DESCRIBE Messages;

