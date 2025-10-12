const Chat = require('../models/ChatModel');
const Account = require('../models/AccountModel');

const ChatController = {
  // Show chat list (only matched users)
  showChatList: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.user) {
        return res.redirect('/login');
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      // Get user's chat rooms (only with matched users)
      const chatRooms = await Chat.getUserChatRooms(account.Accounts_id);
      const unreadCount = await Chat.getUnreadCount(account.Accounts_id);

      res.render('chat-list', {
        chatRooms,
        unreadCount,
        currentUser: account,
        title: 'Chat with Matched Roommates'
      });
    } catch (error) {
      console.error('Error loading chat list:', error);
      req.flash('error', 'Error loading chat list');
      res.redirect('/home');
    }
  },

  // Show specific chat room
  showChatRoom: async (req, res) => {
    try {
      const { chat_id } = req.params;
      
      // Validate chat_id
      if (!chat_id || isNaN(parseInt(chat_id))) {
        req.flash('error', 'Invalid chat room ID');
        return res.redirect('/chat');
      }
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.redirect('/login');
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      // Get chat room info and verify access
      const chatRoomInfo = await Chat.getChatRoomInfo(parseInt(chat_id), account.Accounts_id);
      
      if (!chatRoomInfo) {
        req.flash('error', 'Chat room not found or access denied');
        return res.redirect('/chat');
      }

      // Get messages
      const messages = await Chat.getChatMessages(parseInt(chat_id), account.Accounts_id);

      // Mark messages as read
      await Chat.markMessagesAsRead(parseInt(chat_id), account.Accounts_id);

      res.render('chat-room-simple', {
        chatRoomInfo,
        messages: messages || [],
        currentUser: account,
        title: `Chat with ${chatRoomInfo.other_user_name}`
      });
    } catch (error) {
      console.error('Error loading chat room:', error);
      req.flash('error', 'Error loading chat room. Please try again.');
      res.redirect('/chat');
    }
  },

  // Start chat with a matched user
  startChat: async (req, res) => {
    try {
      const { user_id } = req.params;
      
      // Validate user_id
      if (!user_id || isNaN(parseInt(user_id))) {
        req.flash('error', 'Invalid user ID');
        return res.redirect('/home');
      }
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.redirect('/login');
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        req.flash('error', 'Account not found. Please complete your profile first.');
        return res.redirect('/accounts');
      }

      const targetUserId = parseInt(user_id);
      const currentUserId = account.Accounts_id;

      // Check if users are matched
      const areMatched = await Chat.areUsersMatched(currentUserId, targetUserId);
      
      if (!areMatched) {
        req.flash('error', 'You can only chat with users you have matched with');
        return res.redirect('/home');
      }

      // Get or create chat room
      const chatId = await Chat.getOrCreateChatRoom(currentUserId, targetUserId);
      
      res.redirect(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      req.flash('error', 'Error starting chat. Please try again.');
      res.redirect('/home');
    }
  },

  // Send message (API endpoint)
  sendMessage: async (req, res) => {
    try {
      const { chat_id, message_text } = req.body;
      
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Validate inputs
      if (!chat_id || isNaN(parseInt(chat_id))) {
        return res.status(400).json({ error: 'Invalid chat ID' });
      }

      if (!message_text || !message_text.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // Send message
      const messageId = await Chat.sendMessage(
        parseInt(chat_id), 
        account.Accounts_id, 
        message_text.trim()
      );

      res.json({ 
        success: true, 
        message_id: messageId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.message);
      res.status(500).json({ 
        error: 'Error sending message',
        details: error.message 
      });
    }
  },

  // Get messages (API endpoint)
  getMessages: async (req, res) => {
    try {
      const { chat_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get messages
      const messages = await Chat.getChatMessages(
        parseInt(chat_id), 
        account.Accounts_id, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({ messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Error getting messages' });
    }
  },

  // Mark messages as read (API endpoint)
  markAsRead: async (req, res) => {
    try {
      const { chat_id } = req.params;
      
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Mark messages as read
      await Chat.markMessagesAsRead(parseInt(chat_id), account.Accounts_id);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Error marking messages as read' });
    }
  },

  // Get unread count (API endpoint)
  getUnreadCount: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user's account
      const Register_id = req.session.user.Register_id;
      const account = await Account.findByRegisterId(Register_id);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get unread count
      const unreadCount = await Chat.getUnreadCount(account.Accounts_id);

      res.json({ unread_count: unreadCount });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Error getting unread count' });
    }
  }
};

module.exports = ChatController;
