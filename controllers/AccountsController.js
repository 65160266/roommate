const cloudinary = require("../config/cloudinary");
const Account = require("../models/AccountModel");
const pool = require("../config/database");

//เช็คว่าผู้ใช้ถ้ามีข้อมูลแล้วให้ไปแสดงหน้า profile
exports.getAccount = async (req, res) => {
  const Register_id = req.session.user?.Register_id;
  if (!Register_id) {
    return res.status(401).send("กรุณาเข้าสู่ระบบก่อน");
  }
  try {
    const [rows] = await Account.queryaccount(Register_id);
    if (rows) {
      // ถ้ามีข้อมูลแล้ว → ไปหน้าโปรไฟล์
      return res.redirect("/profile");
    }
    // ถ้ายังไม่มีข้อมูล → แสดงหน้าเพิ่มข้อมูล
    return res.render("accounts", { userData: null });
  } catch (err) {
    console.error("Error checking existing account:", err);
    return res.status(500).send("เกิดข้อผิดพลาดในการโหลดข้อมูล");
  }
};



// เพิ่มข้อมูลผู้ใช้
exports.createAccount = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      nickname,
      student_id,
      age,
      year,
      phone,
      gender,
      Faculty_id,
      Majors_id,
      status,
      Personality_id,
    } = req.body; 

    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.status(401).send("กรุณาเข้าสู่ระบบก่อน");

    if (!req.file) {
      return res.status(400).json({ message: "ไม่เจอไฟล์" });
    }

    // อัพโหลดรูป
    const fileBuffer = req.file.buffer;
    const base64Image = fileBuffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: `Student-${Date.now()}`,
      resource_type: "image",
      folder: "Student-images",
    });

    const secure_url = result.secure_url;

    const accounts = await Account.insertaccounts(first_name, last_name, nickname, age, phone, status, gender, student_id, year, secure_url, Register_id, Faculty_id, Majors_id);

    const Accounts_id = accounts.insertId;
  
    if (Personality_id && Personality_id.length > 0) {
  // ลบเก่าก่อนกันซ้ำ
  await pool.execute(
    "DELETE FROM Accounts_has_Personality WHERE Accounts_id = ?",
    [Accounts_id]
    );
  }
    // personality
    if (Personality_id) {
      await pool.execute(
        `INSERT INTO Accounts_has_Personality (Accounts_id, Personality_id) VALUES (?, ?)`,
        [Accounts_id, Personality_id]
      );
    }

    return res.redirect("/home");
  } catch (error) {
    console.error("Create account error:", error);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาด",
      error: error.message,
    });
  }
};

// ---------------- Profile ----------------
//แสดงหน้าโปร์ไฟล์
exports.getProfile = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) {
      return res.redirect("/login");
    }

    const account = await Account.findByRegisterId(Register_id);

    if (!account) {
      return res.redirect("/accounts"); // ยังไม่มีโปรไฟล์ → ไปสร้างใหม่
    }

    res.render("profile", { userData: account });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการโหลดโปรไฟล์");
  }
};

// ------------------ GET หน้าแก้ไขโปรไฟล์ ------------------
exports.showEditProfile = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);

    if (!account) {
      // ยังไม่มี account → ให้ไปสร้างก่อน
      return res.redirect("/accounts");
    }

    res.render("edit-profile", { userData: account });
  } catch (err) {
    console.error("Show edit profile error:", err);
    res.status(500).send("Internal server error");
  }
};

// ------------------ POST อัพเดทโปรไฟล์ ------------------
exports.updateProfile = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.status(401).send("กรุณาเข้าสู่ระบบก่อน");

    const { first_name, last_name, nickname, phone } = req.body;
     let secure_url = null;

    // ถ้ามีการอัพโหลดไฟล์ใหม่
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const base64Image = fileBuffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "Student-images",
        public_id: `Student-${Date.now()}`
      });
      secure_url = result.secure_url;
    }

    // const accounts = await Account.update(first_name ,last_name  ,nickname ,phone , image=COALESCE);

    await pool.execute(
       `UPDATE Accounts 
       SET first_name=?, last_name=?, nickname=?, phone=?, image=COALESCE(?, image)
       WHERE Register_id=?`,
      [
        first_name ?? null,
        last_name ?? null,
        nickname ?? null,
        phone ?? null,
        secure_url,
        Register_id
      ]
    );

    req.flash("success", "อัพเดทข้อมูลเรียบร้อยแล้ว");
    res.redirect("/profile");
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).send("บันทึกข้อมูลล้มเหลว");
  }
};



