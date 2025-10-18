const Register = require("../models/RegisterModel");
const bcrypt = require("bcryptjs");

exports.showLogin = (req, res) => res.render("login");
exports.showRegister = (req, res) => {
  const errors = req.flash("validationErrors") || [];
  res.render("register", { errors });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Register.checklogin(email, password);

    if (!user) {
      req.flash("validationErrors", ["อีเมลหรือรหัสผ่านไม่ถูกต้อง"]);
      return res.redirect("/login");
    }

    req.session.user = user;
    res.redirect("/accounts");
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/login");
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ตรวจสอบ email domain
    if (!email.endsWith('@go.buu.ac.th')) {
      req.flash("validationErrors", ["กรุณาใช้อีเมล @go.buu.ac.th เท่านั้น"]);
      return res.redirect("/register");
    }
    
    const exist = await Register.findByEmail(email);
    if (exist) {
      req.flash("validationErrors", ["อีเมลนี้ถูกใช้แล้ว"]);
      return res.redirect("/register");
    }

    await Register.create(email, password);
    res.redirect("/login");
  } catch (err) {
    console.error("Register error:", err);
    req.flash("validationErrors", ["เกิดข้อผิดพลาด"]);
    res.redirect("/register");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout Error");
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};
