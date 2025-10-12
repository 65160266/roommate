const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// GET /chat - Show chat list (matched users only)
router.get('/', ChatController.showChatList);

// GET /chat/:chat_id - Show specific chat room
router.get('/:chat_id', ChatController.showChatRoom);

// POST /chat/start/:user_id - Start chat with a matched user
router.post('/start/:user_id', ChatController.startChat);

// API Routes for real-time messaging
// POST /chat/:chat_id/message - Send message
router.post('/:chat_id/message', ChatController.sendMessage);

// GET /chat/:chat_id/messages - Get messages
router.get('/:chat_id/messages', ChatController.getMessages);

// POST /chat/:chat_id/read - Mark messages as read
router.post('/:chat_id/read', ChatController.markAsRead);

// GET /chat/unread-count - Get unread message count
router.get('/unread-count', ChatController.getUnreadCount);

module.exports = router;
