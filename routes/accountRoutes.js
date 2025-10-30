/**
 * accountRoutes - เส้นทางสำหรับจัดการข้อมูลผู้ใช้และโปรไฟล์
 */

const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {isAuthenticated, hasAccountData} = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const AccountController = require("../controllers/AccountsController");

// หน้ากรอกข้อมูลผู้ใช้
router.get("/accounts",isAuthenticated,AccountController.getAccount ); 
router.post("/accounts",isAuthenticated,upload.single("image"),AccountController.createAccount );

// API: Get majors by faculty
router.get("/api/majors/:facultyId", isAuthenticated, AccountController.getMajorsByFaculty);

// API: Get user profile by ID
router.get("/api/user-profile/:userId", isAuthenticated, AccountController.getUserProfile); 



// ---------------- Profile Management ----------------
// แสดงโปรไฟล์ของผู้ใช้ที่ล็อกอิน (ต้องมีข้อมูลแล้ว)
router.get("/profile", isAuthenticated, hasAccountData, AccountController.getProfile);
router.get("/edit-profile", isAuthenticated, hasAccountData, upload.single("image"), AccountController.showEditProfile);
router.post("/update/accounts", isAuthenticated, hasAccountData, upload.single("image"), AccountController.updateProfile);

module.exports = router;
