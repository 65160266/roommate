const express = require('express');
const router = express.Router();
const GroupChatController = require('../controllers/GroupChatController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Apply authentication middleware to all group chat routes
router.use(isAuthenticated);

// GET /group-chat - Show list of group chats for the logged-in user
router.get('/', GroupChatController.showGroupChats);

// GET /group-chat/create - Show create group form
router.get('/create', (req, res) => {
  res.render('create-group', {
    title: 'Create Group Chat',
    currentUser: req.session.user
  });
});

// POST /group-chat/create - Create new group chat
router.post('/create', GroupChatController.createGroup);

// GET /group-chat/:group_id - Show specific group chat room
router.get('/:group_id', GroupChatController.showGroupChat);

// POST /group-chat/:group_id/message - Send group message
router.post('/:group_id/message', GroupChatController.sendGroupMessage);

// GET /group-chat/:group_id/messages - Get group messages
router.get('/:group_id/messages', GroupChatController.getGroupMessages);

// POST /group-chat/:group_id/update - Update group details
router.post('/:group_id/update', GroupChatController.updateGroup);

// POST /group-chat/:group_id/add-member - Add member to group
router.post('/:group_id/add-member', GroupChatController.addMember);

// POST /group-chat/:group_id/remove-member - Remove member from group
router.post('/:group_id/remove-member', GroupChatController.removeMember);

// GET /group-chat/:group_id/available-users - Get available users to add
router.get('/:group_id/available-users', GroupChatController.getAvailableUsers);

// GET /group-chat/unread-count - Get unread message count
router.get('/unread-count', GroupChatController.getUnreadCount);

module.exports = router;

