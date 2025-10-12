# phpMyAdmin Setup Guide for Chat System

## Step-by-Step Instructions

### 1. Access phpMyAdmin
- Open your browser and go to `http://localhost:8080`
- Login with username: `root` and password: `1234`
- Select the `roommate` database

### 2. Create Chat Tables
- Click on the **SQL** tab at the top
- Copy and paste the following code:

```sql
-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS ChatRooms (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user1_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    CONSTRAINT check_user_order CHECK (user1_id < user2_id),
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

-- Create Indexes
CREATE INDEX idx_chat_rooms_users ON ChatRooms(user1_id, user2_id);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
CREATE INDEX idx_messages_sender ON Messages(sender_id);
CREATE INDEX idx_messages_is_read ON Messages(is_read);
```

### 3. Execute the SQL
- Click the **Go** button to execute the SQL
- You should see "2 rows affected" or similar success message

### 4. Verify Tables Created
- Click on the **roommate** database in the left sidebar
- You should see `ChatRooms` and `Messages` tables listed
- Click on each table to verify the structure

### 5. Test the Chat System
- Go to your application at `http://localhost:3000`
- Login and try to start a chat with a matched user
- The chat system should now work properly

## Troubleshooting

### If you get errors:
1. **Table already exists**: The tables might already be created
2. **Foreign key error**: Make sure the `Accounts` table exists
3. **Permission error**: Make sure you're logged in as root user

### To check existing tables:
```sql
SHOW TABLES;
```

### To drop tables if needed:
```sql
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS ChatRooms;
```

## What These Tables Do

### ChatRooms Table
- Stores chat rooms between two users
- Ensures only one chat room per pair of users
- Tracks creation and update timestamps

### Messages Table
- Stores all chat messages
- Links to chat rooms and senders
- Tracks read status and message type

## Next Steps
After creating these tables, your chat system will be fully functional with:
- Real-time messaging
- Message persistence
- Unread message tracking
- Match-only chat functionality

