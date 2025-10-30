/**
 * postRoutes - เส้นทางสำหรับจัดการประกาศ
 */

const express = require("express");
const router = express.Router();
const PostController = require("../controllers/PostController");
const { isAuthenticated, hasAccountData } = require("../middleware/authMiddleware");

// ตรวจสอบการเข้าสู่ระบบทุก route
router.use(isAuthenticated);

router.get("/post", hasAccountData, PostController.showMyPost);        
router.get("/post/create", hasAccountData, PostController.showCreatePost); 
router.post("/post/create", hasAccountData, PostController.storePost);

// Post management routes (now integrated into home page)
router.get("/post/edit/:post_id", hasAccountData, PostController.showEditPost);
router.post("/post/edit/:post_id", hasAccountData, PostController.updatePost);
router.post("/post/delete/:post_id", hasAccountData, PostController.deletePost);

// Update people needed
router.post("/post/update-people-needed", PostController.updatePeopleNeeded);

module.exports = router;