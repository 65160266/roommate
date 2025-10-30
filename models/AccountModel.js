/**
 * AccountModel - จัดการข้อมูลผู้ใช้ในฐานข้อมูล
 */

const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

const Account = {

  // ดึงข้อมูลผู้ใช้จาก Register_id
  findByRegisterId: async (Register_id) => {
    const [rows] = await pool.execute(
      `SELECT 
        a.*, 
        f.faculty_name, 
        m.majors_name,
        GROUP_CONCAT(p.description SEPARATOR ', ') AS Personalitiy
      FROM Accounts a
      LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
      LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
      LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
      LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
      WHERE a.Register_id = ?
      GROUP BY a.Accounts_id
      LIMIT 1`,
      [Register_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },
 //สร้าง Account แบบง่าย
  create: async (data) => {
    const { Register_id, name, age, Faculty_id, Majors_id, image } = data;
    const [result] = await pool.execute(
      `INSERT INTO Accounts (Register_id, name, age, Faculty_id, Majors_id, image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Register_id, name, age, Faculty_id, Majors_id, image]
    );
    return result.insertId;
  },
//อัพเดท Account
  update: async (Accounts_id, data) => {
    const { name, age, Faculty_id, Majors_id, image } = data;
    await pool.execute(
      `UPDATE Accounts SET name=?, age=?, Faculty_id=?, Majors_id=?, image=? WHERE Accounts_id=?`,
      [name, age, Faculty_id, Majors_id, image, Accounts_id]
    );
    return true;
  },
// เช็คว่ามี Account แล้วหรือยัง
  queryaccount: async(regisId) => {
    const [result] = await pool.query(`SELECT * FROM Accounts WHERE Register_id = ? LIMIT 1`,[regisId]);
    return result;
  },
//สร้าง Account
  insertaccounts: async(first_name, last_name, nickname, age, phone, status, gender, student_id, year, secure_url, Register_id, Faculty_id, Majors_id) => {
    const sql =  `INSERT INTO Accounts
        (first_name, last_name, nickname, age, phone, status, gender, student_id, year, image, Register_id, Faculty_id, Majors_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [result] = await pool.query(sql, [
        first_name || null,
        last_name || null,
        nickname || null,
        age || null,
        phone || null,
        status || null,
        gender || null,
        student_id || null,
        year || null,
        secure_url,
        Register_id,
        Faculty_id,
        Majors_id,
      ]);
      return result;
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          a.Accounts_id,
          a.first_name,
          a.last_name,
          a.image,
          a.age,
          a.Faculty_id,
          a.Majors_id,
          f.faculty_name,
          m.majors_name
        FROM Accounts a
        LEFT JOIN Faculty f ON a.Faculty_id = f.faculty_id
        LEFT JOIN Majors m ON a.Majors_id = m.majors_id
        ORDER BY a.first_name, a.last_name
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

};




module.exports = Account;




