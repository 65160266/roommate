-- Fixed Chat System Indexes
-- This file contains the corrected index creation statements

USE roommate;

-- =============================================
-- DROP EXISTING INDEXES (to avoid conflicts)
-- =============================================

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_chat_rooms_users ON ChatRooms;
DROP INDEX IF EXISTS idx_chat_rooms_updated_at ON ChatRooms;
DROP INDEX IF EXISTS idx_messages_chat_id ON Messages;
DROP INDEX IF EXISTS idx_messages_sender ON Messages;
DROP INDEX IF EXISTS idx_messages_created_at ON Messages;
DROP INDEX IF EXISTS idx_messages_is_read ON Messages;

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Create indexes for ChatRooms table
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_chat_rooms_updated_at ON ChatRooms(updated_at);

-- Create indexes for Messages table
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_created_at ON Messages(created_at);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if indexes were created successfully
SHOW INDEX FROM ChatRooms;
SHOW INDEX FROM Messages;

-- Show table structure
DESCRIBE ChatRooms;
DESCRIBE Messages;

