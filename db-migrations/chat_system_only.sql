-- Chat System Tables Only
-- This file contains only the tables needed for the chat functionality

USE roommate;

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
-- CHAT SYSTEM INDEXES
-- =============================================

-- Chat system indexes for performance
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_chat_rooms_updated_at ON ChatRooms(updated_at);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- CHAT SYSTEM TRIGGERS
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
-- CHAT SYSTEM STORED PROCEDURES
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
-- SAMPLE CHAT DATA (Optional)
-- =============================================

-- Note: This requires existing Accounts with IDs 4 and 5
-- Uncomment the following lines if you want to create sample chat data

/*
-- Create sample chat room
INSERT IGNORE INTO ChatRooms (chat_id, user1_id, user2_id) VALUES (1, 4, 5);

-- Create sample messages
INSERT IGNORE INTO Messages (message_id, chat_id, sender_id, message_text) VALUES 
(1, 1, 4, 'Hello! This is a test message.'),
(2, 1, 5, 'Hi there! How are you?'),
(3, 1, 4, 'I am doing great! Thanks for asking.');
*/

