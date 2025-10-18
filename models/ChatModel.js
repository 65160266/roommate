const pool = require("../config/database");

const Chat = {
  // Get or create chat room between two users
  getOrCreateChatRoom: async (user1_id, user2_id) => {
    try {
      console.log('Getting or creating chat room for users:', user1_id, user2_id);
      
      // Check if chat room already exists
      const [existingRooms] = await pool.execute(
        `SELECT chat_id FROM Chat_Rooms 
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
        [user1_id, user2_id, user2_id, user1_id]
      );

      console.log('Existing chat rooms:', existingRooms);

      if (existingRooms.length > 0) {
        console.log('Found existing chat room:', existingRooms[0].chat_id);
        return existingRooms[0].chat_id;
      }

      // Create new chat room
      console.log('Creating new chat room...');
      const [result] = await pool.execute(
        `INSERT INTO Chat_Rooms (user1_id, user2_id, created_at) 
         VALUES (?, ?, NOW())`,
        [user1_id, user2_id]
      );

      console.log('Created new chat room with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Error in getOrCreateChatRoom:', error);
      throw error;
    }
  },

  // Get user's chat rooms with matched users
  getUserChatRooms: async (user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          cr.chat_id,
          cr.created_at,
          CASE 
            WHEN cr.user1_id = ? THEN cr.user2_id
            ELSE cr.user1_id
          END as other_user_id,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as other_user_name,
          a.nickname as other_user_nickname,
          a.image as other_user_image,
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
        FROM Chat_Rooms cr
        LEFT JOIN Accounts a ON (
          CASE 
            WHEN cr.user1_id = ? THEN cr.user2_id
            ELSE cr.user1_id
          END = a.Accounts_id
        )
        WHERE (cr.user1_id = ? OR cr.user2_id = ?)
        ORDER BY last_message_time DESC`,
        [user_id, user_id, user_id, user_id, user_id]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get chat room info
  getChatRoomInfo: async (chat_id, user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          cr.chat_id,
          cr.created_at,
          CASE 
            WHEN cr.user1_id = ? THEN cr.user2_id
            ELSE cr.user1_id
          END as other_user_id,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as other_user_name,
          a.nickname as other_user_nickname,
          a.image as other_user_image
        FROM Chat_Rooms cr
        LEFT JOIN Accounts a ON (
          CASE 
            WHEN cr.user1_id = ? THEN cr.user2_id
            ELSE cr.user1_id
          END = a.Accounts_id
        )
        WHERE cr.chat_id = ? AND (cr.user1_id = ? OR cr.user2_id = ?)`,
        [user_id, user_id, chat_id, user_id, user_id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  },

  // Get chat messages
  getChatMessages: async (chat_id, user_id, limit = 50, offset = 0) => {
    try {
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      const [rows] = await pool.query(
        `SELECT 
          m.message_id,
          m.sender_id,
          m.message_text,
          m.created_at,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as sender_name
        FROM Messages m
        LEFT JOIN Accounts a ON m.sender_id = a.Accounts_id
        WHERE m.chat_id = ?
        ORDER BY m.created_at ASC
        LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [chat_id]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Send message
  sendMessage: async (chat_id, sender_id, message_text) => {
    try {
      const [result] = await pool.execute(
        `INSERT INTO Messages (chat_id, sender_id, message_text, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [chat_id, sender_id, message_text]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chat_id, user_id) => {
    try {
      await pool.execute(
        `UPDATE Messages 
         SET is_read = TRUE 
         WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE`,
        [chat_id, user_id]
      );
    } catch (error) {
      throw error;
    }
  },

  // Get unread count for user
  getUnreadCount: async (user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as unread_count
        FROM Messages m
        JOIN Chat_Rooms cr ON m.chat_id = cr.chat_id
        WHERE (cr.user1_id = ? OR cr.user2_id = ?)
        AND m.sender_id != ?
        AND m.is_read = FALSE`,
        [user_id, user_id, user_id]
      );

      return rows[0].unread_count;
    } catch (error) {
      throw error;
    }
  },

  // Check if users are matched
  areUsersMatched: async (user1_id, user2_id) => {
    try {
      console.log('Checking if users are matched:', user1_id, user2_id);
      const [rows] = await pool.execute(
        `SELECT match_id FROM Matches 
         WHERE ((requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?))
         AND status = 'confirmed'`,
        [user1_id, user2_id, user2_id, user1_id]
      );

      console.log('Match query result:', rows);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if users are matched:', error);
      throw error;
    }
  }
};

module.exports = Chat;
