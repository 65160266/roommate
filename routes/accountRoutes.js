const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {isAuthenticated, hasAccountData} = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const AccountController = require("../controllers/AccountsController");




// Main accounts route
router.get("/accounts",isAuthenticated,AccountController.getAccount ); 
router.post("/accounts",isAuthenticated,upload.single("image"),AccountController.createAccount ); 



// ---------------- Profile Management ----------------
// แสดงโปรไฟล์ของผู้ใช้ที่ล็อกอิน (ต้องมีข้อมูลแล้ว)
router.get("/profile", isAuthenticated, hasAccountData, AccountController.getProfile);
router.get("/edit-profile", isAuthenticated, hasAccountData, upload.single("image"), AccountController.showEditProfile);
router.post("/update/accounts", isAuthenticated, hasAccountData, upload.single("image"), AccountController.updateProfile);

module.exports = router;
