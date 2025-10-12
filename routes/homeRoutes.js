// routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const HomeController = require("../controllers/HomeController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Apply authentication middleware
router.use(isAuthenticated);

router.get("/home", HomeController.getHome);

// Match actions
router.post("/home/match", HomeController.sendMatchRequest);
router.post("/home/match/:match_id/confirm", HomeController.confirmMatch);
router.post("/home/match/:match_id/reject", HomeController.rejectMatch);
router.delete("/home/match/:match_id/cancel", HomeController.cancelMatch);

module.exports = router;
