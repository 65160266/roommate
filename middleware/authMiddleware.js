/**
 * ไฟล์ Middleware สำหรับตรวจสอบสิทธิ์การเข้าถึง
 * 
 * หน้าที่:
 * - ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
 * - ตรวจสอบว่าผู้ใช้กรอกข้อมูลส่วนตัวแล้วหรือไม่
 * - ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
 */

/**
 * ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
 * ถ้ายังไม่ล็อกอิน จะ redirect ไปหน้า login
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

/**
 * ตรวจสอบว่าผู้ใช้กรอกข้อมูลส่วนตัวแล้วหรือไม่
 * ถ้ายังไม่กรอก จะ redirect ไปหน้า /accounts
 * 
 * ใช้กับหน้าที่ต้องการให้ผู้ใช้กรอกข้อมูลก่อน เช่น /home, /chat
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.hasAccountData = async (req, res, next) => {
  console.log('hasAccountData middleware called for:', req.url);
  
  const Register_id = req.session.user?.Register_id;
  if (!Register_id) {
    console.log('No Register_id found, redirecting to login');
    return res.redirect("/login");
  }
  
  try {
    const Account = require("../models/AccountModel");
    // ดึงข้อมูล account จากฐานข้อมูล
    const rows = await Account.queryaccount(Register_id);
    
    console.log('Account check result:', rows);
    console.log('Has account data:', rows && rows.length > 0);
    
    if (rows && rows.length > 0) {
      // มีข้อมูลแล้ว ให้ผ่านไปหน้าถัดไป
      console.log('User has account data, proceeding to:', req.url);
      next();
    } else {
      // ยังไม่มีข้อมูล redirect ไปกรอกข้อมูล
      console.log('User has no account data, redirecting to accounts');
      return res.redirect("/accounts");
    }
  } catch (err) {
    console.error('Error checking account data:', err);
    return res.status(500).send("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
  }
};

/**
 * ตรวจสอบว่าผู้ใช้เป็นแอดมินหรือไม่
 * ถ้าไม่ใช่แอดมิน จะ redirect กลับไปหน้า /home
 * 
 * ใช้กับหน้าที่เฉพาะแอดมินเท่านั้น เช่น /admin/*
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.isAdmin = async (req, res, next) => {
  try {
    // ตรวจสอบว่าล็อกอินแล้วหรือไม่
    if (!req.session.user) {
      req.flash('error', 'Please login first');
      return res.redirect('/login');
    }

    const Register_id = req.session.user.Register_id;
    const Account = require("../models/AccountModel");
    const db = require("../config/database");
    
    // ดึงข้อมูล account
    const accountData = await Account.queryaccount(Register_id);
    
    if (!accountData || accountData.length === 0) {
      req.flash('error', 'Account not found');
      return res.redirect('/accounts');
    }

    const account = accountData[0];

    // ตรวจสอบว่าเป็นแอดมินหรือไม่จากตาราง Register
    const [registerCheck] = await db.execute(`
      SELECT r.is_admin, r.role_id
      FROM Register r
      WHERE r.Register_id = ? AND r.is_admin = TRUE
    `, [Register_id]);

    if (registerCheck.length === 0) {
      // ไม่ใช่แอดมิน ปฏิเสธการเข้าถึง
      req.flash('error', 'Access denied. Admin privileges required.');
      return res.redirect('/home');
    }

    // เพิ่มข้อมูลแอดมินลง session
    req.session.user.Accounts_id = account.Accounts_id;
    req.session.user.isAdmin = true;
    
    // เป็นแอดมิน ให้ผ่านไปหน้าถัดไป
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    req.flash('error', 'Error checking admin status');
    res.redirect('/login');
  }
};