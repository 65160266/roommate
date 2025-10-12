const pool = require("../config/database");

const Chat = {
  // Get or create chat room between two matched users
  getOrCreateChatRoom: async (user1_id, user2_id) => {
    try {
      // Ensure parameters are integers
      const userId1 = parseInt(user1_id);
      const userId2 = parseInt(user2_id);
      
      // Ensure user1_id < user2_id for consistency
      const smaller_id = Math.min(userId1, userId2);
      const larger_id = Math.max(userId1, userId2);

      // Check if chat room already exists
      const [existingRoom] = await pool.execute(
        `SELECT chat_id FROM ChatRooms 
         WHERE user1_id = ? AND user2_id = ?`,
        [smaller_id, larger_id]
      );

      if (existingRoom.length > 0) {
        return existingRoom[0].chat_id;
      }

      // Create new chat room
      const [result] = await pool.execute(
        `INSERT INTO ChatRooms (user1_id, user2_id) VALUES (?, ?)`,
        [smaller_id, larger_id]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Get all chat rooms for a user (only with matched users)
  getUserChatRooms: async (user_id) => {
    const userId = parseInt(user_id);
    
    const [rows] = await pool.execute(
      `SELECT 
        cr.chat_id,
        cr.created_at,
        cr.updated_at,
        CASE 
          WHEN cr.user1_id = ? THEN a2.Accounts_id
          ELSE a1.Accounts_id
        END as other_user_id,
        CASE 
          WHEN cr.user1_id = ? THEN CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, ''))
          ELSE CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, ''))
        END as other_user_name,
        CASE 
          WHEN cr.user1_id = ? THEN a2.image
          ELSE a1.image
        END as other_user_image,
        CASE 
          WHEN cr.user1_id = ? THEN a2.nickname
          ELSE a1.nickname
        END as other_user_nickname,
        -- Get last message
        (SELECT message_text FROM Messages 
         WHERE chat_id = cr.chat_id 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM Messages 
         WHERE chat_id = cr.chat_id 
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        -- Get unread count
        (SELECT COUNT(*) FROM Messages 
         WHERE chat_id = cr.chat_id 
         AND sender_id != ? 
         AND is_read = FALSE) as unread_count
      FROM ChatRooms cr
      LEFT JOIN Accounts a1 ON cr.user1_id = a1.Accounts_id
      LEFT JOIN Accounts a2 ON cr.user2_id = a2.Accounts_id
      WHERE cr.user1_id = ? OR cr.user2_id = ?
      ORDER BY cr.updated_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
    return rows;
  },

  // Get messages for a specific chat room
  getChatMessages: async (chat_id, user_id, limit = 50, offset = 0) => {
    try {
      // Ensure parameters are integers
      const chatId = parseInt(chat_id);
      const userId = parseInt(user_id);
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      // First verify user has access to this chat room
      const [accessCheck] = await pool.execute(
        `SELECT chat_id FROM ChatRooms 
         WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, userId, userId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to chat room');
      }

      const [rows] = await pool.query(
        `SELECT 
          m.message_id,
          m.sender_id,
          m.message_text,
          m.message_type,
          m.is_read,
          m.created_at,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as sender_name,
          a.image as sender_image
        FROM Messages m
        LEFT JOIN Accounts a ON m.sender_id = a.Accounts_id
        WHERE m.chat_id = ?
        ORDER BY m.created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [chatId]
      );

      return rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (chat_id, sender_id, message_text, message_type = 'text') => {
    try {
      const chatId = parseInt(chat_id);
      const senderId = parseInt(sender_id);
      
      // Verify user has access to this chat room
      const [accessCheck] = await pool.execute(
        `SELECT chat_id FROM ChatRooms 
         WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, senderId, senderId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to chat room');
      }

      const [result] = await pool.execute(
        `INSERT INTO Messages (chat_id, sender_id, message_text, message_type) 
         VALUES (?, ?, ?, ?)`,
        [chatId, senderId, message_text, message_type]
      );


      // Update chat room's updated_at timestamp
      await pool.execute(
        `UPDATE ChatRooms SET updated_at = NOW() WHERE chat_id = ?`,
        [chatId]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chat_id, user_id) => {
    const chatId = parseInt(chat_id);
    const userId = parseInt(user_id);
    
    await pool.execute(
      `UPDATE Messages 
       SET is_read = TRUE 
       WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE`,
      [chatId, userId]
    );
  },

  // Get chat room info
  getChatRoomInfo: async (chat_id, user_id) => {
    try {
      // Ensure parameters are integers
      const chatId = parseInt(chat_id);
      const userId = parseInt(user_id);
      
      const [rows] = await pool.execute(
        `SELECT 
          cr.chat_id,
          cr.created_at,
          CASE 
            WHEN cr.user1_id = ? THEN a2.Accounts_id
            ELSE a1.Accounts_id
          END as other_user_id,
          CASE 
            WHEN cr.user1_id = ? THEN CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, ''))
            ELSE CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, ''))
          END as other_user_name,
          CASE 
            WHEN cr.user1_id = ? THEN a2.image
            ELSE a1.image
          END as other_user_image,
          CASE 
            WHEN cr.user1_id = ? THEN a2.nickname
            ELSE a1.nickname
          END as other_user_nickname
        FROM ChatRooms cr
        LEFT JOIN Accounts a1 ON cr.user1_id = a1.Accounts_id
        LEFT JOIN Accounts a2 ON cr.user2_id = a2.Accounts_id
        WHERE cr.chat_id = ? AND (cr.user1_id = ? OR cr.user2_id = ?)`,
        [userId, userId, userId, userId, chatId, userId, userId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getChatRoomInfo:', error);
      throw error;
    }
  },

  // Check if two users are matched (can chat)
  areUsersMatched: async (user1_id, user2_id) => {
    const userId1 = parseInt(user1_id);
    const userId2 = parseInt(user2_id);
    
    const [rows] = await pool.execute(
      `SELECT match_id FROM Matches 
       WHERE ((requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?))
       AND status = 'confirmed'`,
      [userId1, userId2, userId2, userId1]
    );

    return rows.length > 0;
  },

  // Get unread message count for a user
  getUnreadCount: async (user_id) => {
    const userId = parseInt(user_id);
    
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as unread_count
      FROM Messages m
      JOIN ChatRooms cr ON m.chat_id = cr.chat_id
      WHERE (cr.user1_id = ? OR cr.user2_id = ?)
      AND m.sender_id != ?
      AND m.is_read = FALSE`,
      [userId, userId, userId]
    );

    return rows[0].unread_count;
  }
};

module.exports = Chat;
