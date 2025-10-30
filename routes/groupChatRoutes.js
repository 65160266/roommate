/**
 * groupChatRoutes - เส้นทางสำหรับแชทกลุ่ม
 */

const express = require('express');
const router = express.Router();
const GroupChatController = require('../controllers/GroupChatController');
const { isAuthenticated, hasAccountData } = require('../middleware/authMiddleware');

// ตรวจสอบการเข้าสู่ระบบและข้อมูลผู้ใช้ทุก route
router.use(isAuthenticated);
router.use(hasAccountData);

// Group chat routes
router.get('/', GroupChatController.showGroupChatList);
router.get('/create', GroupChatController.showCreateGroupForm);
router.post('/create', GroupChatController.createGroup);
router.get('/:group_id', GroupChatController.showGroupChatRoom);
router.get('/:group_id/edit', GroupChatController.editGroup);
router.post('/:group_id/edit', GroupChatController.updateGroup);
router.get('/:group_id/invite-members', GroupChatController.getInviteMembers);
router.post('/:group_id/add-members', GroupChatController.addMembers);
router.delete('/:group_id', GroupChatController.deleteGroup);
router.post('/:group_id/leave', GroupChatController.leaveGroup);
router.post('/send-message', GroupChatController.sendMessage);
router.post('/:group_id/add-member', GroupChatController.addMember);
router.post('/:group_id/remove-member', GroupChatController.removeMember);

module.exports = router;
