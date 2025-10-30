/**
 * Flash Message Middleware
 * 
 * หน้าที่:
 * - จัดการ flash messages ให้แสดงครั้งเดียวแล้วหายไป
 * - Flash messages ใช้สำหรับแสดงข้อความแจ้งเตือนชั่วคราว เช่น
 *   - "ลงทะเบียนสำเร็จ"
 *   - "เข้าสู่ระบบสำเร็จ"
 *   - "เกิดข้อผิดพลาด"
 * 
 * วิธีการทำงาน:
 * 1. เก็บ flash messages ไว้ใน res.locals เพื่อให้ EJS template เข้าถึงได้
 * 2. หลังจาก render หน้าเว็บแล้ว จะลบ flash messages ทิ้ง
 * 3. ถ้ามีการ redirect จะเก็บ flash messages ไว้แสดงที่หน้าถัดไป
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
module.exports = (req, res, next) => {
  // เก็บ flash messages ไว้ใน res.locals เพื่อให้ view เข้าถึงได้
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    
    // Override res.render เพื่อล้าง flash หลัง render
    const originalRender = res.render;
    res.render = function(...args) {
      // ลบ flash ก่อน render (เพราะแสดงแล้ว)
      delete req.session.flash;
      // เรียก render ตามปกติ
      originalRender.apply(this, args);
    };
    
    // Override res.redirect เพื่อเก็บ flash ไว้
    const originalRedirect = res.redirect;
    res.redirect = function(...args) {
      // ถ้า redirect แล้วยังมี flash ให้เก็บไว้สำหรับหน้าถัดไป
      // (ไม่ต้องลบ flash เพราะจะแสดงที่หน้าถัดไป)
      originalRedirect.apply(this, args);
    };
  } else {
    // ไม่มี flash messages
    res.locals.flash = null;
  }
  
  next();
};

