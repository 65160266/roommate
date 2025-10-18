// Flash Message Middleware
// จัดการ flash messages ให้แสดงครั้งเดียวแล้วหายไป

module.exports = (req, res, next) => {
  // เก็บ flash messages ไว้ใน res.locals เพื่อให้ view เข้าถึงได้
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    
    // ล้าง flash messages หลังจาก response ส่งเสร็จ
    const originalRender = res.render;
    res.render = function(...args) {
      // ลบ flash ก่อน render
      delete req.session.flash;
      // เรียก render ตามปกติ
      originalRender.apply(this, args);
    };
    
    const originalRedirect = res.redirect;
    res.redirect = function(...args) {
      // ถ้า redirect แล้วยังมี flash ให้เก็บไว้สำหรับหน้าถัดไป
      // (ไม่ต้องลบ flash เพราะจะแสดงที่หน้าถัดไป)
      originalRedirect.apply(this, args);
    };
  } else {
    res.locals.flash = null;
  }
  
  next();
};

