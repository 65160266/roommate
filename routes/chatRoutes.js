/**
 * chatRoutes - เส้นทางสำหรับแชทส่วนตัว
 */

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const { isAuthenticated, hasAccountData } = require('../middleware/authMiddleware');

// ตรวจสอบการเข้าสู่ระบบและข้อมูลผู้ใช้ทุก route
router.use(isAuthenticated);
router.use(hasAccountData);

// GET /chat - Show chat list page
router.get('/', ChatController.showChatList);

// GET /chat/unread-count - Get unread message count
router.get('/unread-count', ChatController.getUnreadCount);

// GET /chat/start/:user_id - Start chat with a matched user
router.get('/start/:user_id', ChatController.startChat);


// API Routes for chat messaging
// POST /chat/send-message - Send message to individual chat
router.post('/send-message', ChatController.sendMessage);

// Individual Chat Routes (must come after group routes)
// GET /chat/:chat_id - Show specific individual chat room
router.get('/:chat_id', ChatController.showChatRoom);

// POST /chat/:chat_id/message - Send message (alternative endpoint)
router.post('/:chat_id/message', ChatController.sendMessage);

// GET /chat/:chat_id/messages - Get messages
router.get('/:chat_id/messages', ChatController.getMessages);

// POST /chat/:chat_id/read - Mark messages as read
router.post('/:chat_id/read', ChatController.markAsRead);

module.exports = router;
