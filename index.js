/**
 * ไฟล์หลักของแอปพลิเคชัน RoomMate
 * ระบบหาเพื่อนร่วมห้องสำหรับนิสิต
 * 
 * หน้าที่:
 * - ตั้งค่า Express server และ Socket.IO สำหรับ real-time chat
 * - กำหนด middleware สำหรับจัดการ session, flash messages, static files
 * - เชื่อมต่อ routes ทั้งหมด (auth, accounts, posts, chat, admin, etc.)
 * - จัดการ Socket.IO events สำหรับแชทส่วนตัวและแชทกลุ่ม
 */

// ===== Import Dependencies =====
const express = require("express");           // Web framework
const session = require("express-session");   // จัดการ session
const flash = require("connect-flash");       // ข้อความแจ้งเตือนชั่วคราว
const path = require("path");                 // จัดการ path ของไฟล์
const http = require("http");                 // สร้าง HTTP server
const socketIo = require("socket.io");        // Real-time communication

// สร้าง Express app และ HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);  // เชื่อมต่อ Socket.IO กับ server

// ===== Import Routes =====
const authRoutes = require("./routes/authRoutes");              // เข้าสู่ระบบ/ลงทะเบียน
const accountRoutes = require("./routes/accountRoutes");        // จัดการข้อมูลผู้ใช้
const postRoutes = require("./routes/postRoutes");              // จัดการประกาศหาเพื่อนร่วมห้อง
const homeRoutes = require("./routes/homeRoutes");              // หน้าแรก/ค้นหาเพื่อนร่วมห้อง
const chatRoutes = require("./routes/chatRoutes");              // แชทส่วนตัว (1:1)
const groupChatRoutes = require("./routes/groupChatRoutes");    // แชทกลุ่ม
const matchRoutes = require("./routes/matchRoutes");            // จัดการการจับคู่
const adminRoutes = require("./routes/adminRoutes");            // ระบบแอดมิน
const flashMiddleware = require("./middleware/flashMiddleware"); // ล้าง flash messages

// ===== Middleware Configuration =====
// Middleware สำหรับ parse request body
app.use(express.urlencoded({ extended: true }));  // รับข้อมูลจาก form
app.use(express.json());                          // รับข้อมูล JSON

// Static files (CSS, JS, รูปภาพ)
app.use(express.static(path.join(__dirname, "public")));

// ตั้งค่า template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);  // สำหรับ proxy (ถ้ามี)

// ===== Session Configuration =====
// ตั้งค่า session สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอิน
app.use(session({
  secret: "secret_roommate",      // คีย์สำหรับเข้ารหัส session
  resave: false,                  // ไม่บันทึก session ถ้าไม่มีการเปลี่ยนแปลง
  saveUninitialized: false,       // ไม่บันทึก session ว่างๆ
  cookie: { 
    secure: false,                // ไม่ใช้ HTTPS (development)
    maxAge: 600000                // อายุ session 10 นาที
  }
}));

// Flash messages สำหรับแสดงข้อความแจ้งเตือน
app.use(flash());

// Middleware สำหรับล้าง flash messages หลังแสดงแล้ว
app.use(flashMiddleware);

// ===== Global Variables =====
// ตัวแปรที่สามารถเข้าถึงได้จากทุก EJS template
app.use((req, res, next) => {
  res.locals.session = req.session;                           // ข้อมูล session
  res.locals.validationErrors = req.flash("validationErrors"); // ข้อผิดพลาดจาก validation
  next();
});

// ===== Routes Registration =====
// เชื่อมต่อ routes ทั้งหมดเข้ากับ Express app
app.use("/", authRoutes);              // /login, /register, /logout
app.use("/", accountRoutes);           // /accounts, /profile, /edit-profile
app.use("/", postRoutes);              // /post, /post/create, /post/edit
app.use("/", homeRoutes);              // /home (หน้าแรก/ค้นหา)
app.use("/chat", chatRoutes);          // /chat/* (แชทส่วนตัว)
app.use("/group-chat", groupChatRoutes); // /group-chat/* (แชทกลุ่ม)
app.use("/match", matchRoutes);        // /match/* (จับคู่)
app.use("/admin", adminRoutes);        // /admin/* (ระบบแอดมิน)

// ===== Socket.IO Configuration =====
/**
 * Socket.IO สำหรับ Real-time Communication
 * จัดการแชทส่วนตัวและแชทกลุ่มแบบ real-time
 */
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ===== แชทส่วนตัว (1:1 Chat) =====
  
  /**
   * เข้าร่วมห้องแชทส่วนตัว
   * ผู้ใช้จะเข้าร่วม room เฉพาะของแชทนั้นๆ
   */
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  /**
   * ออกจากห้องแชทส่วนตัว
   */
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  /**
   * ส่งข้อความใหม่ในแชทส่วนตัว
   * ส่งข้อความไปยังผู้ใช้คนอื่นในห้องแชทเดียวกัน
   */
  socket.on('new-message', (data) => {
    socket.to(`chat-${data.chatId}`).emit('message-received', data);
  });

  // ===== แชทกลุ่ม (Group Chat) =====
  
  /**
   * เข้าร่วมห้องแชทกลุ่ม
   */
  socket.on('join-group-chat', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  /**
   * ออกจากห้องแชทกลุ่ม
   */
  socket.on('leave-group-chat', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User ${socket.id} left group ${groupId}`);
  });

  /**
   * ส่งข้อความใหม่ในแชทกลุ่ม
   * ส่งข้อความไปยังสมาชิกทุกคนในกลุ่ม
   */
  socket.on('new-group-message', (data) => {
    socket.to(`group-${data.group_id}`).emit('new-group-message', data);
  });

  // ===== Typing Indicator =====
  
  /**
   * แสดงสถานะ "กำลังพิมพ์..."
   */
  socket.on('typing', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      chatId: data.chatId
    });
  });

  /**
   * ซ่อนสถานะ "กำลังพิมพ์..."
   */
  socket.on('stop-typing', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-stopped-typing', {
      userId: data.userId,
      chatId: data.chatId
    });
  });

  /**
   * ผู้ใช้ตัดการเชื่อมต่อ
   */
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ทำให้ Socket.IO สามารถเข้าถึงได้จาก routes อื่นๆ
app.set('io', io);

// ===== Landing Page =====
// หน้าแรกของเว็บไซต์ (ก่อนล็อกอิน)
app.get("/", (req, res) => res.render("index"));

// ===== Start Server =====
// เริ่มต้น server ที่ port 3000
server.listen(3000, () => console.log("Server running on port 3000"));




