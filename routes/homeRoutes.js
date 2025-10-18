// routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const HomeController = require("../controllers/HomeController");
const { isAuthenticated, hasAccountData } = require("../middleware/authMiddleware");

// Apply authentication middleware
router.use(isAuthenticated);

router.get("/home", hasAccountData, HomeController.getHome);

// Search functionality
router.get("/search", hasAccountData, HomeController.searchUsers);

// Match actions
router.post("/match", HomeController.sendMatchRequest);
router.post("/match/:match_id/confirm", HomeController.confirmMatch);
router.post("/match/:match_id/reject", HomeController.rejectMatch);

// Match pages (require account data)
router.get("/match/in-progress", hasAccountData, HomeController.showInProgress);
router.get("/match/matched", hasAccountData, HomeController.showMatched);

module.exports = router;
