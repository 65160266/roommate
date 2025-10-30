/**
 * AdminController - จัดการระบบแอดมิน
 */

const Account = require('../models/AccountModel');
const GroupChat = require('../models/GroupChatModel');
const db = require('../config/database');

// แสดง Dashboard แอดมิน
exports.dashboard = async (req, res) => {
  try {
    // Get system statistics
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM Accounts');
    const [groupCount] = await db.execute('SELECT COUNT(*) as count FROM Group_Chats');
    const [matchCount] = await db.execute('SELECT COUNT(*) as count FROM Matches WHERE status = "confirmed"');
    
    // Get recent users
    const [recentUsers] = await db.execute(`
      SELECT a.*, r.email, r.regis_date 
      FROM Accounts a 
      JOIN Register r ON a.Register_id = r.Register_id 
      ORDER BY r.regis_date DESC 
      LIMIT 5
    `);
    
    // Get recent groups
    const [recentGroups] = await db.execute(`
      SELECT gc.*, a.first_name, a.last_name 
      FROM Group_Chats gc 
      JOIN Accounts a ON gc.created_by = a.Accounts_id 
      ORDER BY gc.created_at DESC 
      LIMIT 5
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        users: userCount[0].count,
        groups: groupCount[0].count,
        matches: matchCount[0].count
      },
      recentUsers,
      recentGroups,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดแดชบอร์ด');
    res.redirect('/login');
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT a.*, r.email, r.regis_date, r.role_id, r.is_admin,
             CASE 
               WHEN r.role_id = 1 THEN 'Admin'
               WHEN r.role_id = 2 THEN 'User'
               ELSE 'No Role'
             END as role_name
      FROM Accounts a 
      JOIN Register r ON a.Register_id = r.Register_id 
      ORDER BY r.regis_date DESC
    `);

    res.render('admin/users', {
      title: 'User Management',
      users,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading users:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    res.redirect('/admin');
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Loading user details for ID:', id);
    
    const [users] = await db.execute(`
      SELECT a.*, r.email, r.regis_date, r.role_id, r.is_admin,
             f.faculty_name, m.majors_name
      FROM Accounts a 
      JOIN Register r ON a.Register_id = r.Register_id 
      LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
      LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
      WHERE a.Accounts_id = ?
    `, [id]);

    if (users.length === 0) {
      console.log('User not found:', id);
      req.flash('error', 'ไม่พบผู้ใช้');
      return res.redirect('/admin/users');
    }

    console.log('User found:', users[0].first_name, users[0].last_name);

    // Get user's personality
    const [personalities] = await db.execute(`
      SELECT p.description 
      FROM Personality p
      JOIN Accounts_has_Personality ap ON p.Personality_id = ap.Personality_id
      WHERE ap.Accounts_id = ?
    `, [id]);

    console.log('Personalities found:', personalities.length);

    // Get user's posts
    const [posts] = await db.execute(`
      SELECT * FROM Post WHERE author_id = ? ORDER BY created_at DESC
    `, [id]);

    console.log('Posts found:', posts.length);

    res.render('admin/user-detail', {
      title: 'User Details',
      user: users[0],
      personalities,
      posts,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading user:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้: ' + error.message);
    res.redirect('/admin/users');
  }
};

// Show edit user form
exports.showEditUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Loading user for edit, ID:', id);
    
    const [users] = await db.execute(`
      SELECT a.*, r.email, r.regis_date, r.role_id, r.is_admin,
             f.faculty_name, m.majors_name
      FROM Accounts a 
      JOIN Register r ON a.Register_id = r.Register_id 
      LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
      LEFT JOIN Majors m ON a.Majors_id = m.Majors_id
      WHERE a.Accounts_id = ?
    `, [id]);

    if (users.length === 0) {
      console.log('User not found for edit:', id);
      req.flash('error', 'ไม่พบผู้ใช้');
      return res.redirect('/admin/users');
    }

    console.log('User loaded for edit:', users[0].first_name, users[0].last_name);

    // Get user's personality
    const [personalities] = await db.execute(`
      SELECT Personality_id 
      FROM Accounts_has_Personality 
      WHERE Accounts_id = ?
    `, [id]);

    const user = users[0];
    user.personalities = personalities.map(p => p.Personality_id);

    console.log('Personalities loaded:', user.personalities);

    res.render('admin/user-edit', {
      title: 'Edit User',
      user: user,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading user for edit:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้: ' + error.message);
    res.redirect('/admin/users');
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, nickname, age, phone, gender, year, status } = req.body;

    await db.execute(`
      UPDATE Accounts 
      SET first_name = ?, last_name = ?, nickname = ?, age = ?, phone = ?, gender = ?, year = ?, status = ?
      WHERE Accounts_id = ?
    `, [first_name, last_name, nickname, age, phone, gender, year, status, id]);

    req.flash('success', 'อัปเดตข้อมูลผู้ใช้สำเร็จ');
    res.redirect(`/admin/users/${id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
    res.redirect(`/admin/users/${id}`);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting user with Accounts_id:', id);

    // Get Register_id first
    const [accounts] = await db.execute(
      'SELECT Register_id FROM Accounts WHERE Accounts_id = ?',
      [id]
    );

    if (accounts.length === 0) {
      req.flash('error', 'ไม่พบผู้ใช้');
      return res.redirect('/admin/users');
    }

    const registerId = accounts[0].Register_id;
    console.log('Register_id:', registerId);

    // Delete user's data in correct order (child tables first)
    // 1. Delete personality associations
    await db.execute('DELETE FROM Accounts_has_Personality WHERE Accounts_id = ?', [id]);
    console.log('Deleted personalities');

    // 2. Delete posts
    await db.execute('DELETE FROM Post WHERE author_id = ?', [id]);
    console.log('Deleted posts');

    // 3. Delete matches
    await db.execute('DELETE FROM Matches WHERE requester_id = ? OR target_id = ?', [id, id]);
    console.log('Deleted matches');

    // 4. Delete group chat messages
    await db.execute('DELETE FROM Group_Messages WHERE sender_id = ?', [id]);
    console.log('Deleted group messages');

    // 5. Delete group chat memberships
    await db.execute('DELETE FROM Group_Members WHERE user_id = ?', [id]);
    console.log('Deleted group memberships');

    // 6. Delete chat messages (via Chat_Rooms)
    // First, get all chat_ids where user is involved
    const [chatRooms] = await db.execute(
      'SELECT chat_id FROM Chat_Rooms WHERE user1_id = ? OR user2_id = ?',
      [id, id]
    );
    
    // Delete messages for each chat room
    for (const room of chatRooms) {
      await db.execute('DELETE FROM Messages WHERE chat_id = ?', [room.chat_id]);
    }
    console.log('Deleted chat messages');

    // 7. Delete chat rooms
    await db.execute('DELETE FROM Chat_Rooms WHERE user1_id = ? OR user2_id = ?', [id, id]);
    console.log('Deleted chat rooms');

    // 8. Delete accounts record
    await db.execute('DELETE FROM Accounts WHERE Accounts_id = ?', [id]);
    console.log('Deleted account');

    // 9. Finally delete register record
    await db.execute('DELETE FROM Register WHERE Register_id = ?', [registerId]);
    console.log('Deleted register');

    req.flash('success', 'ลบผู้ใช้สำเร็จ');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error deleting user:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการลบผู้ใช้: ' + error.message);
    res.redirect('/admin/users');
  }
};

// Role management removed - use phpMyAdmin instead

// Assign role to user
exports.assignRoleToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    console.log('Assigning role to user:', id, 'Role:', role_id);

    // Get Register_id from Accounts
    const [accounts] = await db.execute(
      'SELECT Register_id FROM Accounts WHERE Accounts_id = ?',
      [id]
    );

    if (accounts.length === 0) {
      req.flash('error', 'ไม่พบผู้ใช้');
      return res.redirect('/admin/users');
    }

    const registerId = accounts[0].Register_id;

    // Update role_id and is_admin in Register table
    const isAdmin = (role_id == 1) ? 1 : 0;
    
    await db.execute(
      'UPDATE Register SET role_id = ?, is_admin = ? WHERE Register_id = ?',
      [role_id || 2, isAdmin, registerId]
    );

    console.log('Role updated successfully. Register_id:', registerId, 'role_id:', role_id, 'is_admin:', isAdmin);

    req.flash('success', 'เปลี่ยน Role สำเร็จ');
    res.redirect(`/admin/users/${id}`);
  } catch (error) {
    console.error('Error assigning role:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการเปลี่ยน Role: ' + error.message);
    res.redirect(`/admin/users/${id}`);
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const [groups] = await db.execute(`
      SELECT gc.*, a.first_name, a.last_name, 
             COUNT(gm.user_id) as member_count
      FROM Group_Chats gc 
      JOIN Accounts a ON gc.created_by = a.Accounts_id 
      LEFT JOIN Group_Members gm ON gc.group_id = gm.group_id AND gm.is_active = TRUE
      GROUP BY gc.group_id
      ORDER BY gc.created_at DESC
    `);

    res.render('admin/groups', {
      title: 'Group Management',
      groups,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading groups:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม');
    res.redirect('/admin');
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [groups] = await db.execute(`
      SELECT gc.*, a.first_name, a.last_name 
      FROM Group_Chats gc 
      JOIN Accounts a ON gc.created_by = a.Accounts_id 
      WHERE gc.group_id = ?
    `, [id]);

    if (groups.length === 0) {
      req.flash('error', 'ไม่พบกลุ่ม');
      return res.redirect('/admin/groups');
    }

    const [members] = await db.execute(`
      SELECT a.*, gm.is_admin, gm.joined_at
      FROM Group_Members gm
      JOIN Accounts a ON gm.user_id = a.Accounts_id
      WHERE gm.group_id = ? AND gm.is_active = TRUE
      ORDER BY gm.is_admin DESC, gm.joined_at ASC
    `, [id]);

    res.render('admin/group-detail', {
      title: 'Group Details',
      group: groups[0],
      members,
      session: req.session,
      flashMessages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading group:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม');
    res.redirect('/admin/groups');
  }
};

// Join group as admin
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.session.user.Accounts_id;

    // Check if admin is already in group
    const [existing] = await db.execute(
      'SELECT * FROM Group_Members WHERE group_id = ? AND user_id = ?',
      [id, adminId]
    );

    if (existing.length === 0) {
      await db.execute(
        'INSERT INTO Group_Members (group_id, user_id, is_admin, joined_at) VALUES (?, ?, 1, NOW())',
        [id, adminId]
      );
    }

    req.flash('success', 'เข้าร่วมกลุ่มสำเร็จ');
    res.redirect(`/admin/groups/${id}`);
  } catch (error) {
    console.error('Error joining group:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม');
    res.redirect('/admin/groups');
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.session.user.Accounts_id;

    await db.execute(
      'UPDATE Group_Members SET is_active = FALSE WHERE group_id = ? AND user_id = ?',
      [id, adminId]
    );

    req.flash('success', 'ออกจากกลุ่มสำเร็จ');
    res.redirect('/admin/groups');
  } catch (error) {
    console.error('Error leaving group:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการออกจากกลุ่ม');
    res.redirect('/admin/groups');
  }
};

// Kick member from group
exports.kickMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const accountsId = userId; // userId from URL is actually Accounts_id

    console.log('Kicking member - group_id:', id, 'Accounts_id:', accountsId);

    // Find the user_id from Group_Members using Accounts_id
    const [members] = await db.execute(
      'SELECT gm.user_id FROM Group_Members gm WHERE gm.group_id = ? AND gm.user_id = ?',
      [id, accountsId]
    );

    if (members.length === 0) {
      console.log('Member not found in group');
      req.flash('error', 'ไม่พบสมาชิกในกลุ่ม');
      return res.redirect(`/admin/groups/${id}`);
    }

    const actualUserId = members[0].user_id;
    console.log('Found user_id:', actualUserId);

    // Update is_active to FALSE using the actual user_id
    await db.execute(
      'UPDATE Group_Members SET is_active = FALSE WHERE group_id = ? AND user_id = ?',
      [id, actualUserId]
    );

    console.log('Member kicked successfully');
    req.flash('success', 'เตะสมาชิกออกจากกลุ่มสำเร็จ');
    res.redirect(`/admin/groups/${id}`);
  } catch (error) {
    console.error('Error kicking member:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการเตะสมาชิก: ' + error.message);
    res.redirect(`/admin/groups/${id}`);
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting group:', id);

    // Delete group messages
    await db.execute('DELETE FROM Group_Messages WHERE group_id = ?', [id]);
    console.log('Deleted group messages');

    // Delete group members
    await db.execute('DELETE FROM Group_Members WHERE group_id = ?', [id]);
    console.log('Deleted group members');

    // Delete group
    await db.execute('DELETE FROM Group_Chats WHERE group_id = ?', [id]);
    console.log('Deleted group');

    req.flash('success', 'ลบกลุ่มสำเร็จ');
    res.redirect('/admin/groups');
  } catch (error) {
    console.error('Error deleting group:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการลบกลุ่ม: ' + error.message);
    res.redirect('/admin/groups');
  }
};

// Update group name
exports.updateGroupName = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name } = req.body;

    console.log('Updating group name:', id, 'New name:', group_name);

    await db.execute(
      'UPDATE Group_Chats SET group_name = ? WHERE group_id = ?',
      [group_name, id]
    );

    req.flash('success', 'แก้ไขชื่อกลุ่มสำเร็จ');
    res.redirect(`/admin/groups/${id}`);
  } catch (error) {
    console.error('Error updating group name:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการแก้ไขชื่อกลุ่ม: ' + error.message);
    res.redirect(`/admin/groups/${id}`);
  }
};

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { id, userId } = req.params;

    await db.execute(
      'DELETE FROM Group_Members WHERE group_id = ? AND user_id = ?',
      [id, userId]
    );

    req.flash('success', 'ลบสมาชิกออกจากกลุ่มสำเร็จ');
    res.redirect(`/admin/groups/${id}`);
  } catch (error) {
    console.error('Error removing user from group:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการลบสมาชิกออกจากกลุ่ม');
    res.redirect(`/admin/groups/${id}`);
  }
};

// Get system statistics
// System stats and logs removed - not needed
