const PostModel = require("../models/PostModel");
const Account = require("../models/AccountModel");

exports.showMyPost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("http://localhost:3000/http://localhost:3000//login");

    const post = await PostModel.getPostByUser(Register_id);

    // แสดงหน้า my-post ไม่ว่าจะมีโพสต์หรือไม่
    // ถ้าไม่มีโพสต์ post จะเป็น null และหน้า my-post จะแสดงปุ่มสร้างโพสต์ใหม่
    res.render("my-post", { post, session: req.session });
  } catch (err) {
    console.error("Show my post error:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.showCreatePost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.redirect("/accounts");

    // ตรวจสอบว่ามีโพสต์อยู่แล้วหรือไม่
    const existingPosts = await PostModel.getUserPosts(account.Accounts_id);
    if (existingPosts && existingPosts.length > 0) {
      // ถ้ามีโพสต์อยู่แล้ว redirect ไปหน้าดูโพสต์พร้อมข้อความแจ้งเตือน
      req.session.flash = {
        error: 'คุณมีโพสต์อยู่แล้ว 1 โพสต์ กรุณาลบโพสต์เก่าก่อนสร้างใหม่'
      };
      return res.redirect("/post");
    }

    res.render("create-post", { account });
  } catch (err) {
    console.error("Show create post error:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.storePost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.redirect("/accounts");

    // ส่ง room status และข้อมูลห้อง
    const { content, room_status, people_needed, room_description } = req.body;
    await PostModel.createPost(
      account.Accounts_id, 
      content, 
      room_status || 'needs_room', 
      parseInt(people_needed) || 0, 
      room_description || ''
    );

    // แสดงข้อความสำเร็จ
    req.session.flash = {
      success: 'สร้างโพสต์สำเร็จแล้ว!'
    };
    res.redirect("/home");
  } catch (err) {
    console.error("Store post error:", err.message);
    if (err.message === "User already has a post") {
      // แสดงข้อความแจ้งเตือน
      req.session.flash = {
        error: 'คุณมีโพสต์อยู่แล้ว 1 โพสต์ กรุณาลบโพสต์เก่าก่อนสร้างใหม่'
      };
      return res.redirect("/post");
    }
    res.status(500).send("Internal Server Error");
  }
};

// Show post management page
exports.showManagePosts = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.redirect("/accounts");

    const posts = await PostModel.getUserPosts(account.Accounts_id);
    res.render("manage-posts", { posts, user: account });
  } catch (err) {
    console.error("Show manage posts error:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Show edit post page
exports.showEditPost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.redirect("/accounts");

    const { post_id } = req.params;
    const post = await PostModel.getPostById(post_id, account.Accounts_id);
    
    if (!post) {
      req.session.flash = {
        error: 'ไม่พบโพสต์หรือคุณไม่มีสิทธิ์แก้ไข'
      };
      return res.redirect("/post");
    }

    res.render("edit-post", { post, session: req.session });
  } catch (err) {
    console.error("Show edit post error:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.redirect("/login");

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.redirect("/accounts");

    const { post_id } = req.params;
    const { content, room_status, people_needed, room_description } = req.body;

    // อัปเดตโพสต์พร้อมข้อมูลทั้งหมด
    const success = await PostModel.updatePost(
      post_id, 
      content, 
      account.Accounts_id,
      room_status || 'needs_room',
      parseInt(people_needed) || 0,
      room_description || ''
    );
    
    if (success) {
      req.session.flash = {
        success: 'แก้ไขโพสต์สำเร็จแล้ว!'
      };
    } else {
      req.session.flash = {
        error: 'ไม่สามารถแก้ไขโพสต์ได้ กรุณาลองใหม่อีกครั้ง'
      };
    }
    
    res.redirect("/post");
  } catch (err) {
    console.error("Update post error:", err);
    req.session.flash = {
      error: 'เกิดข้อผิดพลาดในการแก้ไขโพสต์'
    };
    res.redirect("/post");
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    console.log('Delete post request received:', req.params);
    
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) {
      console.log('No Register_id found in session');
      return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
    }

    const account = await Account.findByRegisterId(Register_id);
    if (!account) {
      console.log('Account not found for Register_id:', Register_id);
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
    }

    const { post_id } = req.params;
    console.log('Attempting to delete post:', post_id, 'for account:', account.Accounts_id);
    
    // ตรวจสอบ post_id
    if (!post_id || isNaN(post_id)) {
      console.log('Invalid post_id:', post_id);
      return res.status(400).json({ success: false, error: 'รหัสโพสต์ไม่ถูกต้อง' });
    }
    
    // ตรวจสอบว่าโพสต์มีอยู่จริงหรือไม่
    const existingPost = await PostModel.getPostById(post_id, account.Accounts_id);
    if (!existingPost) {
      console.log('Post not found or no permission:', post_id);
      return res.status(404).json({ success: false, error: 'ไม่พบโพสต์หรือคุณไม่มีสิทธิ์ลบ' });
    }
    
    console.log('Post found:', existingPost);

    const success = await PostModel.deletePost(post_id, account.Accounts_id);
    console.log('Delete result:', success);
    
    if (success) {
      console.log('Post deleted successfully');
      res.json({ success: true, message: 'ลบโพสต์สำเร็จแล้ว!' });
    } else {
      console.log('Failed to delete post - no rows affected');
      res.status(404).json({ success: false, error: 'ไม่พบโพสต์หรือคุณไม่มีสิทธิ์ลบ' });
    }
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบโพสต์: ' + err.message });
  }
};

// Force delete post (for fixing stuck posts)
exports.forceDeletePost = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.status(404).json({ success: false, error: 'Account not found' });

    const { post_id } = req.params;

    // Force delete without checking ownership
    const success = await PostModel.deletePost(post_id, account.Accounts_id);
    
    if (success) {
      res.json({ success: true, message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Post not found or already deleted' });
    }
  } catch (err) {
    console.error("Force delete post error:", err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update people needed for a post
exports.updatePeopleNeeded = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const account = await Account.findByRegisterId(Register_id);
    if (!account) return res.status(404).json({ success: false, error: 'Account not found' });

    const { post_id, people_needed } = req.body;
    
    if (!post_id || people_needed === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const peopleNeededNum = parseInt(people_needed);
    if (isNaN(peopleNeededNum) || peopleNeededNum < 0 || peopleNeededNum > 10) {
      return res.status(400).json({ success: false, error: 'Invalid people needed value' });
    }

    // Update the post
    const success = await PostModel.updatePeopleNeeded(post_id, peopleNeededNum, account.Accounts_id);
    
    if (success) {
      res.json({ success: true, message: 'People needed updated successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Post not found or you do not have permission' });
    }
  } catch (err) {
    console.error("Update people needed error:", err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


