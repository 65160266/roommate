/**
 * HomeModel - จัดการข้อมูลหน้าแรกในฐานข้อมูล
 */

const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

class HomeModel {
  // ดึงข้อมูลผู้ใช้ทั้งหมด
  static async getAllUsers() {
    const [rows] = await pool.execute(
      `SELECT 
          a.*, 
          f.faculty_name, 
          m.majors_name,
          GROUP_CONCAT(p.description SEPARATOR ', ') AS Personality
       FROM Accounts a
       LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
       LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
       LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
       LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
       GROUP BY a.Accounts_id`
    );
    return rows;
  }

  static async getAllUsersWithPosts() {
    const [rows] = await pool.execute(
      `SELECT 
          a.*, 
          f.faculty_name, 
          m.majors_name,
          GROUP_CONCAT(DISTINCT p.description SEPARATOR ', ') AS Personality,
          MAX(post.Post_id) as Post_id,
          MAX(post.title) as post_title,
          MAX(post.content) as post_content,
          MAX(post.created_at) as post_created_at,
          MAX(post.room_status) as room_status,
          MAX(post.people_needed) as people_needed,
          MAX(post.room_description) as room_description
       FROM Accounts a
       LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
       LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
       LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
       LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
       LEFT JOIN Post post ON a.Accounts_id = post.author_id
       GROUP BY a.Accounts_id, a.first_name, a.last_name, a.nickname, a.image, a.age, a.phone, a.gender, a.year, a.status, a.Register_id, a.Faculty_id, a.Majors_id, f.faculty_name, m.majors_name
       ORDER BY a.first_name, a.last_name`
    );
    return rows;
  }

  static async searchUsers(searchQuery, currentUserId) {
    const searchTerm = `%${searchQuery}%`;
    const [rows] = await pool.execute(
      `SELECT 
          a.*, 
          f.faculty_name, 
          m.majors_name,
          GROUP_CONCAT(DISTINCT p.description SEPARATOR ', ') AS Personality,
          MAX(post.Post_id) as Post_id,
          MAX(post.title) as post_title,
          MAX(post.content) as post_content,
          MAX(post.created_at) as post_created_at,
          MAX(post.room_status) as room_status,
          MAX(post.people_needed) as people_needed,
          MAX(post.room_description) as room_description
       FROM Accounts a
       LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
       LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
       LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
       LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
       LEFT JOIN Post post ON a.Accounts_id = post.author_id
       WHERE a.Accounts_id != ? 
         AND post.content IS NOT NULL 
         AND post.content != ''
         AND (
           a.first_name LIKE ? OR 
           a.last_name LIKE ? OR 
           a.nickname LIKE ? OR 
           f.faculty_name LIKE ? OR 
           m.majors_name LIKE ? OR 
           p.description LIKE ? OR
           post.title LIKE ? OR
           post.content LIKE ?
         )
       GROUP BY a.Accounts_id, a.first_name, a.last_name, a.nickname, a.image, a.age, a.phone, a.gender, a.year, a.status, a.Register_id, a.Faculty_id, a.Majors_id, f.faculty_name, m.majors_name
       ORDER BY 
         CASE 
           WHEN a.first_name LIKE ? THEN 1
           WHEN a.last_name LIKE ? THEN 2
           WHEN a.nickname LIKE ? THEN 3
           WHEN f.faculty_name LIKE ? THEN 4
           WHEN m.majors_name LIKE ? THEN 5
           WHEN p.description LIKE ? THEN 6
           WHEN post.title LIKE ? THEN 7
           WHEN post.content LIKE ? THEN 8
           ELSE 9
         END,
         a.first_name, a.last_name`,
      [
        currentUserId,
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
      ]
    );
    return rows;
  }
}

module.exports = HomeModel;
