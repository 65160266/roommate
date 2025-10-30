/**
 * AccountsController - จัดการข้อมูลผู้ใช้และโปรไฟล์
 */

const cloudinary = require("../config/cloudinary");
const Account = require("../models/AccountModel");
const pool = require("../config/database");
const db = require("../config/database");

// แสดงหน้ากรอกข้อมูลผู้ใช้ครั้งแรก
exports.getAccount = async (req, res) => {
  const Register_id = req.session.user?.Register_id;
  if (!Register_id) {
    return res.status(401).send("กรุณาเข้าสู่ระบบก่อน");
  }
  
  try {
    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    const [adminCheck] = await db.execute(`
      SELECT is_admin FROM Register WHERE Register_id = ? AND is_admin = TRUE
    `, [Register_id]);
    
    // ถ้าเป็นแอดมิน → redirect ไปหน้า admin
    if (adminCheck.length > 0) {
      console.log('getAccount - User is admin, redirecting to admin panel');
      req.session.user.isAdmin = true;
      return res.redirect("/admin");
    }
    
    // ตรวจสอบว่าผู้ใช้มีข้อมูลแล้วหรือยัง
    const rows = await Account.queryaccount(Register_id);
    console.log('getAccount - Account check result:', rows);
    console.log('getAccount - Has account data:', rows && rows.length > 0);
    
    if (rows && rows.length > 0) {
      // ถ้ามีข้อมูลแล้ว → redirect ไปหน้า profile
      console.log('getAccount - User has account data, redirecting to profile');
      return res.redirect("/profile");
    }
    
    // ถ้ายังไม่มีข้อมูล → แสดงหน้า accounts
    console.log('getAccount - User has no account data, showing accounts page');
    return res.render("accounts", { 
      userData: null,
      session: req.session
    });
  } catch (err) {
    console.error("Error loading accounts page:", err);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      error: err.message
    });
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

    console.log('Personality_id received:', Personality_id);
    console.log('Type of Personality_id:', typeof Personality_id);
    console.log('Is array:', Array.isArray(Personality_id)); 

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
    console.log('Account created with ID:', Accounts_id);
  
    // personality - handle array of Personality_id
    if (Personality_id) {
      console.log('Processing personality data:', Personality_id);
      
      // ลบเก่าก่อนกันซ้ำ
      await pool.execute(
        "DELETE FROM Accounts_has_Personality WHERE Accounts_id = ?",
        [Accounts_id]
      );
      
      // Handle both array and single value
      let personalityIds = [];
      if (Array.isArray(Personality_id)) {
        personalityIds = Personality_id;
      } else if (typeof Personality_id === 'string' && Personality_id.trim() !== '') {
        personalityIds = [Personality_id];
      }
      
      console.log('Personality IDs to insert:', personalityIds);
      
      // insert แต่ละ Personality_id
      for (const personalityId of personalityIds) {
        if (personalityId && personalityId.toString().trim() !== '') {
          const intValue = parseInt(personalityId);
          if (!isNaN(intValue) && intValue > 0) {
            console.log('Inserting personality:', personalityId, 'as integer:', intValue);
            await pool.execute(
              `INSERT INTO Accounts_has_Personality (Accounts_id, Personality_id) VALUES (?, ?)`,
              [Accounts_id, intValue]
            );
          } else {
            console.log('Skipping invalid personality ID:', personalityId);
          }
        }
      }
    } else {
      console.log('No personality data to process');
    }

    // Redirect ไปหน้า home หลังจากบันทึกข้อมูลสำเร็จ
    console.log('Account created successfully, redirecting to home');
    
    // เพิ่ม delay เล็กน้อยเพื่อให้ database มีเวลาบันทึกข้อมูล
    setTimeout(() => {
      return res.redirect("/home");
    }, 100);
  } catch (error) {
    console.error("Create account error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
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

    // ดึงข้อมูล personality ปัจจุบัน
    const [personalityRows] = await pool.execute(
      `SELECT Personality_id FROM Accounts_has_Personality WHERE Accounts_id = ?`,
      [account.Accounts_id]
    );
    
    const personalities = personalityRows.map(row => row.Personality_id);
    console.log('Current personalities for user:', personalities);
    
    // เพิ่มข้อมูล personality ลงใน account object
    account.personalities = personalities;

    res.render("edit-profile", { 
      userData: account,
      session: req.session
    });
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

    const { 
      first_name, 
      last_name, 
      nickname, 
      phone, 
      student_id, 
      age, 
      gender, 
      status, 
      Faculty_id, 
      Majors_id, 
      Personality_id 
    } = req.body;
    
    console.log('Update profile - Personality_id received:', Personality_id);
    
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

    // ดึง Accounts_id
    const account = await Account.findByRegisterId(Register_id);
    if (!account) {
      return res.status(404).send("ไม่พบข้อมูลบัญชี");
    }

    // อัพเดทข้อมูลหลัก
    await pool.execute(
       `UPDATE Accounts 
       SET first_name=?, last_name=?, nickname=?, phone=?, student_id=?, age=?, gender=?, status=?, Faculty_id=?, Majors_id=?, image=COALESCE(?, image)
       WHERE Register_id=?`,
      [
        first_name ?? null,
        last_name ?? null,
        nickname ?? null,
        phone ?? null,
        student_id ?? null,
        age ?? null,
        gender ?? null,
        status ?? null,
        Faculty_id ?? null,
        Majors_id ?? null,
        secure_url,
        Register_id
      ]
    );

    // จัดการ personality data
    if (Personality_id !== undefined) {
      console.log('Processing personality data for update:', Personality_id);
      
      // ลบข้อมูล personality เก่า
      await pool.execute(
        "DELETE FROM Accounts_has_Personality WHERE Accounts_id = ?",
        [account.Accounts_id]
      );
      
      // เพิ่มข้อมูล personality ใหม่
      if (Personality_id && Personality_id.length > 0) {
        let personalityIds = [];
        if (Array.isArray(Personality_id)) {
          personalityIds = Personality_id;
        } else if (typeof Personality_id === 'string' && Personality_id.trim() !== '') {
          personalityIds = [Personality_id];
        }
        
        console.log('Personality IDs to insert:', personalityIds);
        
        for (const personalityId of personalityIds) {
          if (personalityId && personalityId.toString().trim() !== '') {
            const intValue = parseInt(personalityId);
            if (!isNaN(intValue) && intValue > 0) {
              console.log('Inserting personality:', personalityId, 'as integer:', intValue);
              await pool.execute(
                `INSERT INTO Accounts_has_Personality (Accounts_id, Personality_id) VALUES (?, ?)`,
                [account.Accounts_id, intValue]
              );
            }
          }
        }
      }
    }

    req.flash("success", "อัพเดทข้อมูลเรียบร้อยแล้ว");
    res.redirect("/profile");
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).send("บันทึกข้อมูลล้มเหลว");
  }
};

// API: Get majors by faculty
exports.getMajorsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    console.log('Fetching majors for faculty:', facultyId);
    
    // ใช้ subquery เพื่อเลือก Majors_id ที่เล็กที่สุดของแต่ละชื่อสาขา
    const [majors] = await db.execute(
      `SELECT m.Majors_id, m.majors_name 
       FROM Majors m
       INNER JOIN (
         SELECT MIN(Majors_id) as min_id, majors_name
         FROM Majors
         WHERE Faculty_id = ?
         GROUP BY majors_name
       ) AS unique_majors ON m.Majors_id = unique_majors.min_id
       ORDER BY m.majors_name`,
      [facultyId]
    );
    
    console.log('Found majors:', majors.length);
    console.log('Majors list:', majors.map(m => m.majors_name));
    res.json(majors);
  } catch (error) {
    console.error('Error fetching majors:', error);
    res.status(500).json({ error: 'Failed to fetch majors', details: error.message });
  }
};

// Get user profile by ID (for viewing in group chat)
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data with faculty and major names
    const [users] = await db.execute(`
      SELECT a.*, f.faculty_name, m.majors_name
      FROM Accounts a
      LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
      LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
      WHERE a.Accounts_id = ?
    `, [userId]);
    
    if (users.length === 0) {
      return res.json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    const user = users[0];
    
    // Get user's personalities
    const [personalities] = await db.execute(`
      SELECT p.description
      FROM Personality p
      JOIN Accounts_has_Personality ap ON p.Personality_id = ap.Personality_id
      WHERE ap.Accounts_id = ?
    `, [userId]);
    
    user.personalities = personalities.map(p => p.description);
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
};

