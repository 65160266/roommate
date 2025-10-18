const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

class PostModel {
  // หาข้อมูลโพสต์ของ user จากตาราง Post
  static async getPostByUser(Register_id) {
    const [rows] = await pool.execute(
      `SELECT 
        post.Post_id,
        post.author_id,
        post.title,
        post.content,
        post.room_status,
        post.people_needed,
        post.room_description,
        post.created_at,
        post.updated_at,
        a.first_name,
        a.last_name,
        a.nickname,
        a.image,
        a.age,
        a.phone,
        a.gender,
        f.faculty_name, 
        m.majors_name,
        GROUP_CONCAT(DISTINCT p.description SEPARATOR ', ') AS Personality
      FROM Post post
      INNER JOIN Accounts a ON post.author_id = a.Accounts_id
      LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
      LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
      LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
      LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
      WHERE a.Register_id = ?
      GROUP BY post.Post_id, post.author_id, post.title, post.content, post.room_status, 
               post.people_needed, post.room_description, post.created_at, post.updated_at,
               a.Accounts_id, a.first_name, a.last_name, a.nickname, a.image, a.age, 
               a.phone, a.gender, a.Register_id, a.Faculty_id, a.Majors_id, 
               f.faculty_name, m.majors_name
      ORDER BY post.created_at DESC
      LIMIT 1`,
      [Register_id]
    );
    return rows[0] || null;
  }

  // สร้างโพสต์ใหม่
  static async createPost(Accounts_id, content, room_status = 'needs_room', people_needed = 0, room_description = '') {
    const [check] = await pool.execute(
      "SELECT * FROM Post WHERE author_id = ?",
      [Accounts_id]
    );

    if (check.length > 0) {
      throw new Error("User already has a post");
    }

    await pool.execute(
      "INSERT INTO Post (author_id, title, content, room_status, people_needed, room_description, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [Accounts_id, 'โพสต์หาห้อง', content, room_status, people_needed, room_description]
    );
  }

  // ดึงโพสต์ของผู้ใช้
  static async getUserPosts(Accounts_id) {
    const [rows] = await pool.execute(
      `SELECT p.*, a.first_name, a.last_name, a.nickname, a.image
       FROM Post p
       LEFT JOIN Accounts a ON p.author_id = a.Accounts_id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC`,
      [Accounts_id]
    );
    return rows;
  }

  // อัปเดตโพสต์ (ทุกฟิลด์)
  static async updatePost(Post_id, content, Accounts_id, room_status = 'needs_room', people_needed = 0, room_description = '') {
    const [result] = await pool.execute(
      `UPDATE Post 
       SET content = ?, 
           room_status = ?, 
           people_needed = ?, 
           room_description = ?, 
           updated_at = NOW() 
       WHERE Post_id = ? AND author_id = ?`,
      [content, room_status, people_needed, room_description, Post_id, Accounts_id]
    );
    return result.affectedRows > 0;
  }

  // ลบโพสต์
  static async deletePost(Post_id, Accounts_id) {
    try {
      console.log('PostModel.deletePost called with:', { Post_id, Accounts_id });
      
      // ตรวจสอบว่าโพสต์มีอยู่จริงหรือไม่
      const [checkRows] = await pool.execute(
        `SELECT Post_id, author_id FROM Post WHERE Post_id = ? AND author_id = ?`,
        [Post_id, Accounts_id]
      );
      
      console.log('Post check result:', checkRows);
      
      if (checkRows.length === 0) {
        console.log('Post not found or no permission');
        return false;
      }
      
      // ลบโพสต์
      const [result] = await pool.execute(
        `DELETE FROM Post WHERE Post_id = ? AND author_id = ?`,
        [Post_id, Accounts_id]
      );
      
      console.log('Delete result:', result);
      console.log('Affected rows:', result.affectedRows);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('PostModel.deletePost error:', error);
      throw error;
    }
  }

  // ดึงโพสต์ตาม ID
  static async getPostById(Post_id, Accounts_id) {
    try {
      console.log('PostModel.getPostById called with:', { Post_id, Accounts_id });
      
      const [rows] = await pool.execute(
        `SELECT p.*, a.first_name, a.last_name, a.nickname, a.image
         FROM Post p
         LEFT JOIN Accounts a ON p.author_id = a.Accounts_id
         WHERE p.Post_id = ? AND p.author_id = ?`,
        [Post_id, Accounts_id]
      );
      
      console.log('Post found:', rows[0] || null);
      return rows[0] || null;
    } catch (error) {
      console.error('PostModel.getPostById error:', error);
      throw error;
    }
  }

  // อัปเดตจำนวนคนที่ต้องการ
  static async updatePeopleNeeded(Post_id, people_needed, Accounts_id) {
    const [result] = await pool.execute(
      `UPDATE Post SET people_needed = ?, updated_at = NOW() 
       WHERE Post_id = ? AND author_id = ?`,
      [people_needed, Post_id, Accounts_id]
    );
    return result.affectedRows > 0;
  }
}


module.exports = PostModel;
