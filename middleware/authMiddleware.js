exports.isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// Middleware to check if user has account data
exports.hasAccountData = async (req, res, next) => {
  console.log('hasAccountData middleware called for:', req.url);
  
  const Register_id = req.session.user?.Register_id;
  if (!Register_id) {
    console.log('No Register_id found, redirecting to login');
    return res.redirect("/login");
  }
  
  try {
    const Account = require("../models/AccountModel");
    const rows = await Account.queryaccount(Register_id);
    
    console.log('Account check result:', rows);
    console.log('Has account data:', rows && rows.length > 0);
    
    if (rows && rows.length > 0) {
      console.log('User has account data, proceeding to:', req.url);
      next();
    } else {
      console.log('User has no account data, redirecting to accounts');
      return res.redirect("/accounts");
    }
  } catch (err) {
    console.error('Error checking account data:', err);
    return res.status(500).send("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
  }
};