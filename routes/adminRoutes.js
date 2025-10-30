/**
 * adminRoutes - เส้นทางสำหรับระบบแอดมิน
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// ตรวจสอบการเข้าสู่ระบบและสิทธิ์แอดมินทุก route
router.use(isAuthenticated);
router.use(isAdmin);

// Admin Dashboard
router.get('/', AdminController.dashboard);

// User Management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.get('/users/:id/edit', AdminController.showEditUser);
router.post('/users/:id/update', AdminController.updateUser);
router.post('/users/:id/delete', AdminController.deleteUser); // Use POST instead of DELETE
router.delete('/users/:id', AdminController.deleteUser); // Keep DELETE for compatibility

// Role Management - simplified
router.post('/users/:id/assign-role', AdminController.assignRoleToUser);

// Group Chat Management
router.get('/groups', AdminController.getAllGroups);
router.get('/groups/:id', AdminController.getGroupById);
router.post('/groups/:id/join', AdminController.joinGroup);
router.post('/groups/:id/leave', AdminController.leaveGroup);
router.post('/groups/:id/kick/:userId', AdminController.kickMember);
router.post('/groups/:id/delete', AdminController.deleteGroup);
router.post('/groups/:id/update-name', AdminController.updateGroupName);
router.delete('/groups/:id/leave', AdminController.leaveGroup);
router.delete('/groups/:id/remove-user/:userId', AdminController.removeUserFromGroup);

// System Management - removed (not needed)

module.exports = router;
