const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const postRoutes = require("./routes/postRoutes"); 
const homeRoutes = require("./routes/homeRoutes");
const matchRoutes = require("./routes/matchRoutes");
const chatRoutes = require("./routes/chatRoutes");
const groupChatRoutes = require("./routes/groupChatRoutes");


// Middleware พื้นฐาน
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

// Session
app.use(session({
  secret: "secret_roommate",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 600000 }
}));
app.use(flash());

// Global variables สำหรับ ejs
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.validationErrors = req.flash("validationErrors");
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/", accountRoutes);
app.use("/", postRoutes);
app.use("/", homeRoutes);
app.use("/match", matchRoutes);
app.use("/chat", chatRoutes);
app.use("/group-chat", groupChatRoutes);

// app.use("/room", roomRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Handle new message
  socket.on('new-message', (data) => {
    // Broadcast message to all users in the chat room
    socket.to(`chat-${data.chatId}`).emit('message-received', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      chatId: data.chatId
    });
  });

  // Handle stop typing
  socket.on('stop-typing', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-stopped-typing', {
      userId: data.userId,
      chatId: data.chatId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Pages (view only)
app.get("/", (req, res) => res.render("index"));
// app.get("/home", (req, res) => res.render("home"));



server.listen(3000, () => console.log("Server running on port 3000"));




