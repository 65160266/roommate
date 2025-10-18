const express = require("express");
const router = express.Router();
const {isAuthenticated} = require("../middleware/authMiddleware");
const AuthController = require("../controllers/AuthController");

// Root route - show index page or redirect based on account status
router.get("/", async (req, res) => {
  if (req.session && req.session.user) {
    try {
      const Account = require("../models/AccountModel");
      const rows = await Account.queryaccount(req.session.user.Register_id);
      
      if (rows && rows.length > 0) {
        // User has account data, redirect to home
        res.redirect("/home");
      } else {
        // User has no account data, redirect to accounts
        res.redirect("/accounts");
      }
    } catch (err) {
      console.error("Error checking account status:", err);
      res.redirect("/accounts");
    }
  } else {
    res.render("index");
  }
});

router.get("/login", AuthController.showLogin);
router.post("/login", AuthController.login);
router.get("/register", AuthController.showRegister);
router.post("/register", AuthController.register);
router.get("/logout", AuthController.logout);

module.exports = router;

