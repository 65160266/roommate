/**
 * ไฟล์ตั้งค่า Cloudinary
 * 
 * หน้าที่:
 * - ตั้งค่าการเชื่อมต่อกับ Cloudinary API
 * - ใช้สำหรับอัปโหลดและเก็บรูปภาพบน cloud
 * 
 * Cloudinary คือ:
 * - บริการเก็บรูปภาพบน cloud (ฟรี 25GB)
 * - อัปโหลดรูปผ่าน API
 * - ได้ URL รูปภาพกลับมาเก็บในฐานข้อมูล
 * 
 * ต้องสมัครที่: https://cloudinary.com/
 */

const cloudinary = require("cloudinary").v2;

// โหลด environment variables จากไฟล์ .env
require("dotenv").config();

// ตั้งค่า Cloudinary credentials
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,           // ชื่อ cloud
    api_key: process.env.CLOUDINARY_CLOUDAPI,               // API key
    api_secret: process.env.CLOUDINARY_CLOUDAPI_SECRET      // API secret
});

module.exports = cloudinary;