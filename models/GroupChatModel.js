const pool = require("../config/database");

const GroupChat = {
  // Create a new group chat
  createGroup: async (group_name, description, created_by) => {
    try {
      const [result] = await pool.execute(
        `INSERT INTO Group_Chats (group_name, description, created_by) 
         VALUES (?, ?, ?)`,
        [group_name, description, created_by]
      );

      const groupId = result.insertId;

      // Add creator as admin
      await pool.execute(
        `INSERT INTO Group_Members (group_id, user_id, role) 
         VALUES (?, ?, 'admin')`,
        [groupId, created_by]
      );

      return groupId;
    } catch (error) {
      throw error;
    }
  },

  // Get all groups for a user
  getUserGroups: async (user_id) => {
    try {
      const userId = parseInt(user_id);
      
      const [rows] = await pool.execute(
        `SELECT 
          gc.group_id,
          gc.group_name,
          gc.description,
          gc.created_at,
          gc.updated_at,
          gc.created_by,
          CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, '')) as creator_name,
          gm.role as user_role,
          gm.joined_at,
          -- Get member count
          (SELECT COUNT(*) FROM Group_Members gm2 
           WHERE gm2.group_id = gc.group_id AND gm2.is_active = TRUE) as member_count,
          -- Get last message
          (SELECT message_text FROM Group_Messages 
           WHERE group_id = gc.group_id 
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM Group_Messages 
           WHERE group_id = gc.group_id 
           ORDER BY created_at DESC LIMIT 1) as last_message_time,
          -- Get unread count for this user
          (SELECT COUNT(*) FROM Group_Messages gm_msg
           WHERE gm_msg.group_id = gc.group_id 
           AND gm_msg.sender_id != ? 
           AND gm_msg.is_read = FALSE) as unread_count
        FROM Group_Chats gc
        LEFT JOIN Group_Members gm ON gc.group_id = gm.group_id
        LEFT JOIN Accounts creator ON gc.created_by = creator.Accounts_id
        WHERE gm.user_id = ? AND gm.is_active = TRUE AND gc.is_active = TRUE
        ORDER BY gc.updated_at DESC`,
        [userId, userId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Get group details
  getGroupDetails: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Check if user is member of the group
      const [accessCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to group');
      }

      const [rows] = await pool.execute(
        `SELECT 
          gc.group_id,
          gc.group_name,
          gc.description,
          gc.created_at,
          gc.updated_at,
          gc.created_by,
          CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, '')) as creator_name,
          gm.role as user_role
        FROM Group_Chats gc
        LEFT JOIN Group_Members gm ON gc.group_id = gm.group_id
        LEFT JOIN Accounts creator ON gc.created_by = creator.Accounts_id
        WHERE gc.group_id = ? AND gm.user_id = ? AND gc.is_active = TRUE`,
        [groupId, userId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  },

  // Get group members
  getGroupMembers: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Check if user is member of the group
      const [accessCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to group');
      }

      const [rows] = await pool.execute(
        `SELECT 
          gm.user_id,
          gm.role,
          gm.joined_at,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as user_name,
          a.image as user_image,
          a.nickname
        FROM Group_Members gm
        LEFT JOIN Accounts a ON gm.user_id = a.Accounts_id
        WHERE gm.group_id = ? AND gm.is_active = TRUE
        ORDER BY gm.role DESC, gm.joined_at ASC`,
        [groupId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Add member to group
  addMember: async (group_id, user_id, added_by) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      const addedById = parseInt(added_by);
      
      // Check if the person adding is admin
      const [adminCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, addedById]
      );

      if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
        throw new Error('Only admins can add members');
      }

      // Check if user is already a member
      const [existingMember] = await pool.execute(
        `SELECT member_id FROM Group_Members 
         WHERE group_id = ? AND user_id = ?`,
        [groupId, userId]
      );

      if (existingMember.length > 0) {
        // Reactivate if inactive
        await pool.execute(
          `UPDATE Group_Members 
           SET is_active = TRUE, joined_at = NOW() 
           WHERE group_id = ? AND user_id = ?`,
          [groupId, userId]
        );
        return 'Member reactivated';
      } else {
        // Add new member
        await pool.execute(
          `INSERT INTO Group_Members (group_id, user_id, role) 
           VALUES (?, ?, 'member')`,
          [groupId, userId]
        );
        return 'Member added';
      }
    } catch (error) {
      throw error;
    }
  },

  // Remove member from group
  removeMember: async (group_id, user_id, removed_by) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      const removedById = parseInt(removed_by);
      
      // Check if the person removing is admin or removing themselves
      const [adminCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, removedById]
      );

      if (adminCheck.length === 0) {
        throw new Error('Access denied');
      }

      // Can't remove admin unless it's themselves
      if (adminCheck[0].role === 'admin' && userId !== removedById) {
        throw new Error('Cannot remove admin');
      }

      // Deactivate member
      await pool.execute(
        `UPDATE Group_Members 
         SET is_active = FALSE 
         WHERE group_id = ? AND user_id = ?`,
        [groupId, userId]
      );

      return 'Member removed';
    } catch (error) {
      throw error;
    }
  },

  // Get group messages
  getGroupMessages: async (group_id, user_id, limit = 50, offset = 0) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      // Check if user is member of the group
      const [accessCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to group');
      }

      const [rows] = await pool.query(
        `SELECT 
          gm.message_id,
          gm.sender_id,
          gm.message_text,
          gm.message_type,
          gm.is_read,
          gm.created_at,
          CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as sender_name,
          a.image as sender_image
        FROM Group_Messages gm
        LEFT JOIN Accounts a ON gm.sender_id = a.Accounts_id
        WHERE gm.group_id = ?
        ORDER BY gm.created_at DESC
        LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [groupId]
      );

      return rows.reverse(); // Return in chronological order
    } catch (error) {
      throw error;
    }
  },

  // Send group message
  sendGroupMessage: async (group_id, sender_id, message_text, message_type = 'text') => {
    try {
      const groupId = parseInt(group_id);
      const senderId = parseInt(sender_id);
      
      // Check if user is member of the group
      const [accessCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, senderId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to group');
      }

      const [result] = await pool.execute(
        `INSERT INTO Group_Messages (group_id, sender_id, message_text, message_type) 
         VALUES (?, ?, ?, ?)`,
        [groupId, senderId, message_text, message_type]
      );

      // Update group's updated_at timestamp
      await pool.execute(
        `UPDATE Group_Chats SET updated_at = NOW() WHERE group_id = ?`,
        [groupId]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Mark group messages as read
  markGroupMessagesAsRead: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      await pool.execute(
        `UPDATE Group_Messages 
         SET is_read = TRUE 
         WHERE group_id = ? AND sender_id != ? AND is_read = FALSE`,
        [groupId, userId]
      );
    } catch (error) {
      throw error;
    }
  },

  // Get unread count for user's groups
  getUnreadCount: async (user_id) => {
    try {
      const userId = parseInt(user_id);
      
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as unread_count
        FROM Group_Messages gm
        JOIN Group_Members gm_members ON gm.group_id = gm_members.group_id
        WHERE gm_members.user_id = ?
        AND gm.sender_id != ?
        AND gm.is_read = FALSE
        AND gm_members.is_active = TRUE`,
        [userId, userId]
      );

      return rows[0].unread_count;
    } catch (error) {
      throw error;
    }
  },

  // Update group details (admin only)
  updateGroup: async (group_id, group_name, description, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Check if user is admin
      const [adminCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
        throw new Error('Only admins can update group details');
      }

      await pool.execute(
        `UPDATE Group_Chats 
         SET group_name = ?, description = ?, updated_at = NOW() 
         WHERE group_id = ?`,
        [group_name, description, groupId]
      );

      return 'Group updated successfully';
    } catch (error) {
      throw error;
    }
  },

  // Delete group (admin only)
  deleteGroup: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Check if user is admin
      const [adminCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
        throw new Error('Only admins can delete groups');
      }

      // Soft delete the group
      await pool.execute(
        `UPDATE Group_Chats SET is_active = FALSE WHERE group_id = ?`,
        [groupId]
      );

      return 'Group deleted successfully';
    } catch (error) {
      throw error;
    }
  }
};

module.exports = GroupChat;

