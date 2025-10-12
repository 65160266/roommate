-- Simple Chat Indexes
-- Minimal version with only essential indexes

USE roommate;

-- =============================================
-- CREATE ESSENTIAL INDEXES ONLY
-- =============================================

-- Create indexes for ChatRooms table
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);

-- Create indexes for Messages table
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_is_read ON Messages(is_read);

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if indexes were created successfully
SELECT 'Indexes created successfully' as status;

