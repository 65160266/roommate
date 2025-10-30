/**
 * ไฟล์ตั้งค่า Multer สำหรับอัปโหลดไฟล์
 * 
 * หน้าที่:
 * - จัดการการอัปโหลดไฟล์จาก form
 * - ใช้ memory storage (เก็บไฟล์ใน RAM ชั่วคราว)
 * - หลังจากนั้นจะอัปโหลดไปยัง Cloudinary
 * 
 * Multer คือ:
 * - Middleware สำหรับจัดการ multipart/form-data
 * - ใช้สำหรับอัปโหลดไฟล์ (รูปภาพ, เอกสาร)
 * 
 * Memory Storage:
 * - เก็บไฟล์ใน RAM แทนที่จะเก็บบน disk
 * - เหมาะสำหรับอัปโหลดไป cloud service
 * - ไม่ต้องลบไฟล์ temp
 */

const multer = require('multer');

// ตั้งค่าให้เก็บไฟล์ใน memory (RAM)
const storage = multer.memoryStorage();

// สร้าง upload middleware
const upload = multer({ storage });

module.exports = upload; 