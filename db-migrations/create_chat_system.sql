-- Create comprehensive chat system for matched users
USE roommate;

-- Drop existing basic tables if they exist
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Chat_room;

-- Create ChatRooms table for matched users
CREATE TABLE ChatRooms (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user1_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    -- Ensure user1_id < user2_id to prevent duplicate rooms
    CONSTRAINT check_user_order CHECK (user1_id < user2_id),
    
    -- Ensure unique chat rooms between two users
    UNIQUE KEY unique_chat_room (user1_id, user2_id)
);

-- Create Messages table
CREATE TABLE Messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (chat_id) REFERENCES ChatRooms(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- Create function to get or create chat room between two matched users
DELIMITER //
CREATE FUNCTION GetOrCreateChatRoom(user1_id INT, user2_id INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE chat_room_id INT;
    DECLARE smaller_id INT;
    DECLARE larger_id INT;
    
    -- Ensure user1_id < user2_id
    IF user1_id < user2_id THEN
        SET smaller_id = user1_id;
        SET larger_id = user2_id;
    ELSE
        SET smaller_id = user2_id;
        SET larger_id = user1_id;
    END IF;
    
    -- Check if chat room already exists
    SELECT chat_id INTO chat_room_id 
    FROM ChatRooms 
    WHERE user1_id = smaller_id AND user2_id = larger_id;
    
    -- If chat room doesn't exist, create it
    IF chat_room_id IS NULL THEN
        INSERT INTO ChatRooms (user1_id, user2_id) 
        VALUES (smaller_id, larger_id);
        SET chat_room_id = LAST_INSERT_ID();
    END IF;
    
    RETURN chat_room_id;
END//
DELIMITER ;

-- Insert sample data for testing (optional)
-- This will only work if you have matched users
-- INSERT INTO ChatRooms (user1_id, user2_id) VALUES (1, 2);
-- INSERT INTO Messages (chat_id, sender_id, message_text) VALUES (1, 1, 'Hello! How are you?');

