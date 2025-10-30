/**
 * AuthController - จัดการการเข้าสู่ระบบและลงทะเบียน
 */

const Register = require("../models/RegisterModel");
const bcrypt = require("bcryptjs");

// แสดงหน้า login
exports.showLogin = (req, res) => res.render("login");

// แสดงหน้าลงทะเบียน
exports.showRegister = (req, res) => {
  const errors = req.flash("validationErrors") || [];
  res.render("register", { errors });
};

// เข้าสู่ระบบ
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ตรวจสอบ email และ password
    const user = await Register.checklogin(email, password);

    if (!user) {
      req.flash("validationErrors", ["อีเมลหรือรหัสผ่านไม่ถูกต้อง"]);
      return res.redirect("/login");
    }

    // เก็บข้อมูลผู้ใช้ใน session
    req.session.user = user;
    
    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    const db = require("../config/database");
    const [adminCheck] = await db.execute(`
      SELECT is_admin FROM Register WHERE Register_id = ? AND is_admin = TRUE
    `, [user.Register_id]);
    
    // ถ้าเป็นแอดมิน → ไปหน้า admin
    if (adminCheck.length > 0) {
      req.session.user.isAdmin = true;
      return res.redirect("/admin");
    }
    
    // ถ้าไม่ใช่แอดมิน → ไปกรอกข้อมูล
    res.redirect("/accounts");
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/login");
  }
};

// ลงทะเบียนผู้ใช้ใหม่
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ตรวจสอบ email ต้องเป็น @go.buu.ac.th
    if (!email.endsWith('@go.buu.ac.th')) {
      req.flash("validationErrors", ["กรุณาใช้อีเมล @go.buu.ac.th เท่านั้น"]);
      return res.redirect("/register");
    }
    
    // ตรวจสอบว่า email ถูกใช้แล้วหรือไม่
    const exist = await Register.findByEmail(email);
    if (exist) {
      req.flash("validationErrors", ["อีเมลนี้ถูกใช้แล้ว"]);
      return res.redirect("/register");
    }

    // สร้างบัญชีใหม่
    await Register.create(email, password);
    res.redirect("/login");
  } catch (err) {
    console.error("Register error:", err);
    req.flash("validationErrors", ["เกิดข้อผิดพลาด"]);
    res.redirect("/register");
  }
};

// ออกจากระบบ
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout Error");
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};
