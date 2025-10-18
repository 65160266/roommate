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

      // Add creator as leader
      await pool.execute(
        `INSERT INTO Group_Members (group_id, user_id, role) 
         VALUES (?, ?, 'leader')`,
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

  // Get group details (with user access check)
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
          a.first_name,
          a.last_name,
          a.image,
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

  // Add member to group (only matched users)
  addMember: async (group_id, user_id, added_by) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      const addedById = parseInt(added_by);
      
      // Check if the person adding is leader or admin
      const [adminCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, addedById]
      );

      if (adminCheck.length === 0 || !['leader', 'admin'].includes(adminCheck[0].role)) {
        throw new Error('Only group leaders and admins can add members');
      }

      // Check if users are matched
      const Match = require('./MatchModel');
      const matchData = await Match.findByUsers(addedById, userId);
      if (!matchData || matchData.status !== 'confirmed') {
        throw new Error('You can only invite people you have matched with');
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

  // Remove member from group (leader only)
  removeMember: async (group_id, user_id, removed_by) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      const removedById = parseInt(removed_by);
      
      // Allow self-removal (leaving group)
      if (userId === removedById) {
        await pool.execute(
          `DELETE FROM Group_Members 
           WHERE group_id = ? AND user_id = ?`,
          [groupId, userId]
        );
        return 'Member left group';
      }
      
      // Check if the person removing is leader or creator
      const [adminCheck] = await pool.execute(
        `SELECT gm.role, gc.created_by FROM Group_Members gm
         JOIN Group_Chats gc ON gm.group_id = gc.group_id
         WHERE gm.group_id = ? AND gm.user_id = ? AND gm.is_active = TRUE`,
        [groupId, removedById]
      );

      if (adminCheck.length === 0) {
        throw new Error('You are not a member of this group');
      }

      // Allow creator to remove anyone, or leader to remove non-leaders
      const isCreator = adminCheck[0].created_by === removedById;
      const isLeader = adminCheck[0].role === 'leader';
      
      if (!isCreator && !isLeader) {
        throw new Error('Only group leaders or creators can remove members');
      }

      // Check target user role
      const [targetCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (targetCheck.length > 0 && targetCheck[0].role === 'leader' && !isCreator) {
        throw new Error('Only group creator can remove leaders');
      }

      // Remove member
      await pool.execute(
        `DELETE FROM Group_Members 
         WHERE group_id = ? AND user_id = ?`,
        [groupId, userId]
      );

      return 'Member removed';
    } catch (error) {
      throw error;
    }
  },

  // Update group details
  updateGroup: async (group_id, group_name, description) => {
    try {
      console.log('GroupChatModel.updateGroup called with:', { group_id, group_name, description });
      
      const [result] = await pool.execute(
        `UPDATE Group_Chats SET group_name = ?, description = ?, updated_at = NOW() WHERE group_id = ?`,
        [group_name, description, group_id]
      );
      
      console.log('Update group result:', result);
      console.log('Affected rows:', result.affectedRows);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('GroupChatModel.updateGroup error:', error);
      throw error;
    }
  },

  // Delete group
  deleteGroup: async (group_id) => {
    try {
      console.log('GroupChatModel.deleteGroup called with:', { group_id });
      
      // Delete all messages first
      const [messagesResult] = await pool.execute(`DELETE FROM Group_Messages WHERE group_id = ?`, [group_id]);
      console.log('Deleted messages:', messagesResult.affectedRows);
      
      // Delete all members
      const [membersResult] = await pool.execute(`DELETE FROM Group_Members WHERE group_id = ?`, [group_id]);
      console.log('Deleted members:', membersResult.affectedRows);
      
      // Delete the group
      const [result] = await pool.execute(
        `DELETE FROM Group_Chats WHERE group_id = ?`,
        [group_id]
      );
      
      console.log('Delete group result:', result);
      console.log('Affected rows:', result.affectedRows);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('GroupChatModel.deleteGroup error:', error);
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

  // Send message (alias for sendGroupMessage)
  sendMessage: async (group_id, sender_id, message_text, message_type = 'text') => {
    try {
      console.log('GroupChatModel.sendMessage called with:', { group_id, sender_id, message_text, message_type });
      
      // ใช้วิธีเดิมที่ทำงานได้
      const groupId = parseInt(group_id);
      const senderId = parseInt(sender_id);
      const messageText = String(message_text).trim();
      const messageType = String(message_type || 'text');

      console.log('Converted parameters:', { groupId, senderId, messageText, messageType });
      
      // ตรวจสอบค่าที่แปลงแล้ว
      if (isNaN(groupId) || groupId <= 0) {
        throw new Error('Invalid group_id: ' + group_id);
      }
      if (isNaN(senderId) || senderId <= 0) {
        throw new Error('Invalid sender_id: ' + sender_id);
      }
      if (messageText.length === 0) {
        throw new Error('Invalid message_text: ' + message_text);
      }
      
      // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของกลุ่มหรือไม่
      const [accessCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, senderId]
      );

      if (accessCheck.length === 0) {
        throw new Error('Access denied to group');
      }

      // ใช้ SQL insert ธรรมดา
      const [result] = await pool.execute(
        `INSERT INTO Group_Messages (group_id, sender_id, message_text, message_type, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [groupId, senderId, messageText, messageType]
      );

      const messageId = result.insertId;
      console.log('Message inserted with ID:', messageId);

      // อัปเดตเวลาของกลุ่ม
      await pool.execute(
        `UPDATE Group_Chats SET updated_at = NOW() WHERE group_id = ?`,
        [groupId]
      );

      return messageId;
    } catch (error) {
      console.error('GroupChatModel.sendMessage error:', error);
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



  // Leave group
  leaveGroup: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Check if user is member of the group
      const [memberCheck] = await pool.execute(
        `SELECT role FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (memberCheck.length === 0) {
        throw new Error('You are not a member of this group');
      }

      // If user is leader, check if there are other leaders
      if (memberCheck[0].role === 'leader') {
        const [leaderCount] = await pool.execute(
          `SELECT COUNT(*) as leader_count FROM Group_Members 
           WHERE group_id = ? AND role = 'leader' AND is_active = TRUE`,
          [groupId]
        );

        if (leaderCount[0].leader_count <= 1) {
          throw new Error('Cannot leave group as the only leader. Transfer leadership or delete group first.');
        }
      }

      // Deactivate member
      await pool.execute(
        `UPDATE Group_Members 
         SET is_active = FALSE 
         WHERE group_id = ? AND user_id = ?`,
        [groupId, userId]
      );

      return 'Successfully left the group';
    } catch (error) {
      throw error;
    }
  },

  // Get available users to add to group (only matched users)
  getAvailableUsers: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      // Get only matched users
      const Match = require('./MatchModel');
      const matchedUsers = await Match.getConfirmedMatches(userId);
      
      // Get current group members (without access check)
      const [groupMembers] = await pool.execute(
        `SELECT user_id FROM Group_Members 
         WHERE group_id = ? AND is_active = TRUE`,
        [groupId]
      );
      const memberIds = groupMembers.map(member => member.user_id);
      
      // Filter out current members and format data
      const availableUsers = matchedUsers.filter(user => 
        user.matched_user_id !== userId && 
        !memberIds.includes(user.matched_user_id)
      ).map(user => ({
        Accounts_id: user.matched_user_id,
        first_name: user.matched_user_name.split(' ')[0] || '',
        last_name: user.matched_user_name.split(' ').slice(1).join(' ') || '',
        image: user.matched_user_image,
        age: user.matched_user_age,
        faculty_name: user.matched_user_faculty,
        majors_name: user.matched_user_major
      }));

      return availableUsers;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is member of group
  isUserMember: async (group_id, user_id) => {
    try {
      const groupId = parseInt(group_id);
      const userId = parseInt(user_id);
      
      const [rows] = await pool.execute(
        `SELECT member_id FROM Group_Members 
         WHERE group_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  },

  // Get group details (without user check)
  getGroupDetails: async (group_id) => {
    try {
      console.log('GroupChatModel.getGroupDetails called with:', group_id);
      const groupId = parseInt(group_id);
      console.log('Parsed groupId:', groupId);
      
      const [rows] = await pool.execute(
        `SELECT 
          gc.group_id,
          gc.group_name,
          gc.description,
          gc.created_at,
          gc.updated_at,
          gc.created_by,
          CONCAT(COALESCE(creator.first_name, ''), ' ', COALESCE(creator.last_name, '')) as creator_name,
          (SELECT COUNT(*) FROM Group_Members gm2 
           WHERE gm2.group_id = gc.group_id AND gm2.is_active = TRUE) as member_count
        FROM Group_Chats gc
        LEFT JOIN Accounts creator ON gc.created_by = creator.Accounts_id
        WHERE gc.group_id = ? AND gc.is_active = TRUE`,
        [groupId]
      );

      console.log('Group details query result:', rows);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('GroupChatModel.getGroupDetails error:', error);
      throw error;
    }
  },

  // Get group members (without user check)
  getGroupMembers: async (group_id) => {
    try {
      const groupId = parseInt(group_id);
      
      const [rows] = await pool.execute(
        `SELECT 
          gm.user_id,
          gm.role,
          gm.joined_at,
          a.first_name,
          a.last_name,
          a.image,
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

  // Get group messages (without user check)
  getGroupMessages: async (group_id) => {
    try {
      const groupId = parseInt(group_id);
      
      const [rows] = await pool.execute(
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
        ORDER BY gm.created_at ASC`,
        [groupId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  },

};

module.exports = GroupChat;
