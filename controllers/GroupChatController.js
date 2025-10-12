const GroupChat = require('../models/GroupChatModel');
const Account = require('../models/AccountModel');
const HomeModel = require('../models/HomeModel');

const GroupChatController = {
  // Show list of group chats for the logged-in user
  showGroupChats: async (req, res) => {
    try {
      if (!req.session.user) {
        req.flash('error', 'Please log in to view group chats.');
        return res.redirect('/login');
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);

      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      const userGroups = await GroupChat.getUserGroups(account.Accounts_id);
      const unreadCount = await GroupChat.getUnreadCount(account.Accounts_id);

      res.render('group-chat-list', {
        title: 'Group Chats',
        userGroups,
        unreadCount,
        currentUser: account
      });
    } catch (error) {
      console.error('Error showing group chats:', error);
      req.flash('error', 'Error loading group chats');
      res.redirect('/home');
    }
  },

  // Show specific group chat room
  showGroupChat: async (req, res) => {
    try {
      const { group_id } = req.params;
      
      if (!group_id || isNaN(parseInt(group_id))) {
        req.flash('error', 'Invalid group ID');
        return res.redirect('/group-chat');
      }
      
      if (!req.session.user) {
        return res.redirect('/login');
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      // Get group details and verify access
      const groupDetails = await GroupChat.getGroupDetails(parseInt(group_id), account.Accounts_id);
      
      if (!groupDetails) {
        req.flash('error', 'Group not found or access denied');
        return res.redirect('/group-chat');
      }

      // Get group members
      const groupMembers = await GroupChat.getGroupMembers(parseInt(group_id), account.Accounts_id);

      // Get messages
      const messages = await GroupChat.getGroupMessages(parseInt(group_id), account.Accounts_id);

      // Mark messages as read
      await GroupChat.markGroupMessagesAsRead(parseInt(group_id), account.Accounts_id);

      res.render('group-chat-room', {
        groupDetails,
        groupMembers,
        messages: messages || [],
        currentUser: account,
        title: `Group: ${groupDetails.group_name}`
      });
    } catch (error) {
      console.error('Error loading group chat:', error);
      req.flash('error', 'Error loading group chat. Please try again.');
      res.redirect('/group-chat');
    }
  },

  // Create new group chat
  createGroup: async (req, res) => {
    try {
      const { group_name, description } = req.body;
      
      if (!req.session.user) {
        req.flash('error', 'Please log in to create a group.');
        return res.redirect('/login');
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      if (!group_name || group_name.trim() === '') {
        req.flash('error', 'Group name is required');
        return res.redirect('/group-chat');
      }

      const groupId = await GroupChat.createGroup(
        group_name.trim(),
        description ? description.trim() : '',
        account.Accounts_id
      );

      req.flash('success', 'Group created successfully!');
      res.redirect(`/group-chat/${groupId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      req.flash('error', 'Error creating group. Please try again.');
      res.redirect('/group-chat');
    }
  },

  // Add member to group
  addMember: async (req, res) => {
    try {
      const { group_id } = req.params;
      const { user_id } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (!group_id || !user_id || isNaN(parseInt(group_id)) || isNaN(parseInt(user_id))) {
        return res.status(400).json({ error: 'Invalid group or user ID' });
      }

      const result = await GroupChat.addMember(
        parseInt(group_id),
        parseInt(user_id),
        account.Accounts_id
      );

      res.json({ success: true, message: result });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ error: error.message || 'Error adding member' });
    }
  },

  // Remove member from group
  removeMember: async (req, res) => {
    try {
      const { group_id } = req.params;
      const { user_id } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (!group_id || !user_id || isNaN(parseInt(group_id)) || isNaN(parseInt(user_id))) {
        return res.status(400).json({ error: 'Invalid group or user ID' });
      }

      const result = await GroupChat.removeMember(
        parseInt(group_id),
        parseInt(user_id),
        account.Accounts_id
      );

      res.json({ success: true, message: result });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: error.message || 'Error removing member' });
    }
  },

  // Send group message (API endpoint)
  sendGroupMessage: async (req, res) => {
    try {
      const { group_id, message_text } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (!group_id || isNaN(parseInt(group_id))) {
        return res.status(400).json({ error: 'Invalid group ID' });
      }

      if (!message_text || message_text.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      const messageId = await GroupChat.sendGroupMessage(
        parseInt(group_id),
        account.Accounts_id,
        message_text.trim()
      );

      res.json({
        success: true,
        message_id: messageId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending group message:', error);
      res.status(500).json({
        error: 'Error sending message',
        details: error.message
      });
    }
  },

  // Get group messages (API endpoint)
  getGroupMessages: async (req, res) => {
    try {
      const { group_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const messages = await GroupChat.getGroupMessages(
        parseInt(group_id),
        account.Accounts_id,
        parseInt(limit),
        parseInt(offset)
      );

      res.json(messages);
    } catch (error) {
      console.error('Error getting group messages:', error);
      res.status(500).json({ error: 'Error getting messages' });
    }
  },

  // Update group details
  updateGroup: async (req, res) => {
    try {
      const { group_id } = req.params;
      const { group_name, description } = req.body;
      
      if (!req.session.user) {
        req.flash('error', 'Please log in to update group.');
        return res.redirect('/login');
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      if (!group_id || isNaN(parseInt(group_id))) {
        req.flash('error', 'Invalid group ID');
        return res.redirect('/group-chat');
      }

      if (!group_name || group_name.trim() === '') {
        req.flash('error', 'Group name is required');
        return res.redirect(`/group-chat/${group_id}`);
      }

      await GroupChat.updateGroup(
        parseInt(group_id),
        group_name.trim(),
        description ? description.trim() : '',
        account.Accounts_id
      );

      req.flash('success', 'Group updated successfully!');
      res.redirect(`/group-chat/${group_id}`);
    } catch (error) {
      console.error('Error updating group:', error);
      req.flash('error', error.message || 'Error updating group');
      res.redirect(`/group-chat/${group_id}`);
    }
  },

  // Get available users to add to group
  getAvailableUsers: async (req, res) => {
    try {
      const { group_id } = req.params;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get all users
      const allUsers = await HomeModel.getAllUsers();
      
      // Get current group members
      const groupMembers = await GroupChat.getGroupMembers(parseInt(group_id), account.Accounts_id);
      const memberIds = groupMembers.map(member => member.user_id);
      
      // Filter out current members
      const availableUsers = allUsers.filter(user => 
        user.Accounts_id !== account.Accounts_id && 
        !memberIds.includes(user.Accounts_id)
      );

      res.json(availableUsers);
    } catch (error) {
      console.error('Error getting available users:', error);
      res.status(500).json({ error: 'Error getting available users' });
    }
  },

  // Get unread count (API endpoint)
  getUnreadCount: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const unreadCount = await GroupChat.getUnreadCount(account.Accounts_id);
      res.json({ unread_count: unreadCount });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Error getting unread count' });
    }
  }
};

module.exports = GroupChatController;

