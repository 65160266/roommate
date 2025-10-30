/**
 * ไฟล์ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
 * 
 * หน้าที่:
 * - สร้าง connection pool สำหรับเชื่อมต่อ MySQL
 * - ใช้ Promise API สำหรับ async/await
 * - อ่านค่าจาก environment variables (.env)
 * 
 * Connection Pool คือ:
 * - เก็บ connection ไว้หลายๆ ตัว (10 connections)
 * - ใช้ซ้ำได้ ไม่ต้องสร้างใหม่ทุกครั้ง
 * - ประหยัดทรัพยากรและเร็วกว่า
 */

const mysql = require('mysql2');

// สร้าง connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',        // ที่อยู่ MySQL server
  user: process.env.DB_USER || 'root',             // username
  password: process.env.DB_PASSWORD || '1234',     // password
  database: process.env.DB_NAME || 'roommate',     // ชื่อ database
  waitForConnections: true,                        // รอถ้า connection เต็ม
  connectionLimit: 10,                             // จำนวน connection สูงสุด
  queueLimit: 0                                    // ไม่จำกัดจำนวน queue
});

// แปลงเป็น Promise API เพื่อใช้ async/await
const db = pool.promise();

module.exports = db;
