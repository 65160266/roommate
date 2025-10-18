const pool = require("../config/database");

const Match = {
  // Create a new match request
  create: async (requester_id, target_id) => {
    try {
      
      // Validate parameters
      if (!requester_id || !target_id) {
        throw new Error('Missing required parameters');
      }

      if (requester_id === target_id) {
        throw new Error('Cannot match with yourself');
      }

      // Check if match already exists
      const existingMatch = await Match.findByUsers(requester_id, target_id);
      if (existingMatch) {
        if (existingMatch.status === 'pending') {
          return existingMatch.match_id;
        } else if (existingMatch.status === 'confirmed') {
          throw new Error('Match already confirmed');
        } else if (existingMatch.status === 'rejected') {
          // Allow creating new match if previous was rejected
        } else if (existingMatch.status === 'cancelled') {
          // Allow creating new match if previous was cancelled
        }
      }

      // Create new match
      const [result] = await pool.execute(
        `INSERT INTO Matches (requester_id, target_id, status, created_at) 
         VALUES (?, ?, 'pending', NOW())`,
        [requester_id, target_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating match:', error.message);
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        const existingMatch = await Match.findByUsers(requester_id, target_id);
        if (existingMatch) {
          return existingMatch.match_id;
        } else {
          throw new Error('Duplicate entry but no existing match found');
        }
      }
      throw error;
    }
  },

  // Find match by users
  findByUsers: async (requester_id, target_id) => {
    const [rows] = await pool.execute(
      `SELECT * FROM Matches 
       WHERE (requester_id = ? AND target_id = ?) 
       OR (requester_id = ? AND target_id = ?)
       ORDER BY created_at DESC LIMIT 1`,
      [requester_id, target_id, target_id, requester_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Update match status
  updateStatus: async (match_id, status) => {
    const [result] = await pool.execute(
      `UPDATE Matches SET status = ?, updated_at = NOW() WHERE match_id = ?`,
      [status, match_id]
    );
    return result.affectedRows > 0;
  },

  // Get pending matches for user (where user is the target)
  getPendingMatches: async (user_id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, a.first_name, a.last_name, a.image, a.age, a.nickname, a.gender, a.year,
              COALESCE(f.faculty_name, 'ไม่ระบุ') as faculty_name, 
              COALESCE(mj.majors_name, 'ไม่ระบุ') as majors_name
       FROM Matches m
       JOIN Accounts a ON m.requester_id = a.Accounts_id
       LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
       LEFT JOIN Majors mj ON a.Majors_id = mj.Majors_id
       WHERE m.target_id = ? AND m.status = 'pending'
       ORDER BY m.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  // Get sent matches for user (where user is the requester)
  getSentMatches: async (user_id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, a.first_name, a.last_name, a.image, a.age, a.nickname, a.gender, a.year,
              COALESCE(f.faculty_name, 'ไม่ระบุ') as faculty_name, 
              COALESCE(mj.majors_name, 'ไม่ระบุ') as majors_name
       FROM Matches m
       JOIN Accounts a ON m.target_id = a.Accounts_id
       LEFT JOIN Faculty f ON a.Faculty_id = f.Faculty_id
       LEFT JOIN Majors mj ON a.Majors_id = mj.Majors_id
       WHERE m.requester_id = ? AND m.status = 'pending'
       ORDER BY m.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  // Get confirmed matches for user
  getConfirmedMatches: async (user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT m.*, 
                CASE 
                  WHEN m.requester_id = ? THEN a2.first_name
                  ELSE a1.first_name
                END as first_name,
                CASE 
                  WHEN m.requester_id = ? THEN a2.last_name
                  ELSE a1.last_name
                END as last_name,
                CASE 
                  WHEN m.requester_id = ? THEN a2.image
                  ELSE a1.image
                END as image,
                CASE 
                  WHEN m.requester_id = ? THEN a2.age
                  ELSE a1.age
                END as age,
                CASE 
                  WHEN m.requester_id = ? THEN a2.Accounts_id
                  ELSE a1.Accounts_id
                END as Accounts_id,
                CASE 
                  WHEN m.requester_id = ? THEN COALESCE(f2.faculty_name, 'ไม่ระบุ')
                  ELSE COALESCE(f1.faculty_name, 'ไม่ระบุ')
                END as faculty_name,
                CASE 
                  WHEN m.requester_id = ? THEN COALESCE(mj2.majors_name, 'ไม่ระบุ')
                  ELSE COALESCE(mj1.majors_name, 'ไม่ระบุ')
                END as majors_name
         FROM Matches m
         JOIN Accounts a1 ON m.requester_id = a1.Accounts_id
         JOIN Accounts a2 ON m.target_id = a2.Accounts_id
         LEFT JOIN Faculty f1 ON a1.Faculty_id = f1.Faculty_id
         LEFT JOIN Faculty f2 ON a2.Faculty_id = f2.Faculty_id
         LEFT JOIN Majors mj1 ON a1.Majors_id = mj1.Majors_id
         LEFT JOIN Majors mj2 ON a2.Majors_id = mj2.Majors_id
         WHERE (m.requester_id = ? OR m.target_id = ?) AND m.status = 'confirmed'
         ORDER BY m.updated_at DESC`,
        [user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id]
      );
      return rows;
    } catch (error) {
      console.error('Error in getConfirmedMatches:', error);
      return [];
    }
  },

  // Get match statistics
  getMatchStats: async (user_id) => {
    const [pendingRows] = await pool.execute(
      `SELECT COUNT(*) as count FROM Matches WHERE target_id = ? AND status = 'pending'`,
      [user_id]
    );
    
    const [sentRows] = await pool.execute(
      `SELECT COUNT(*) as count FROM Matches WHERE requester_id = ? AND status = 'pending'`,
      [user_id]
    );
    
    const [confirmedRows] = await pool.execute(
      `SELECT COUNT(*) as count FROM Matches 
       WHERE (requester_id = ? OR target_id = ?) AND status = 'confirmed'`,
      [user_id, user_id]
    );
    
    return {
      pending: pendingRows[0].count,
      sent: sentRows[0].count,
      confirmed: confirmedRows[0].count
    };
  },

  // Get all matches for a user (all statuses)
  getAllMatchesForUser: async (user_id) => {
    const [rows] = await pool.execute(
      `SELECT * FROM Matches 
       WHERE requester_id = ? OR target_id = ?
       ORDER BY created_at DESC`,
      [user_id, user_id]
    );
    return rows;
  },

  // Check if two users are matched (confirmed)
  areUsersMatched: async (user1_id, user2_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM Matches 
         WHERE ((requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?))
         AND status = 'confirmed'`,
        [user1_id, user2_id, user2_id, user1_id]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if users are matched:', error);
      return false;
    }
  },

  // Confirm a match request
  confirmMatch: async (match_id, user_id) => {
    try {
      const [result] = await pool.execute(
        'UPDATE Matches SET status = "confirmed", updated_at = NOW() WHERE match_id = ? AND target_id = ? AND status = "pending"',
        [match_id, user_id]
      );
      
      if (result.affectedRows > 0) {
        return { success: true, message: 'Match confirmed successfully' };
      } else {
        return { success: false, message: 'Match not found or already processed' };
      }
    } catch (error) {
      console.error('Error confirming match:', error);
      return { success: false, message: 'Error confirming match' };
    }
  },

  // Reject a match request
  rejectMatch: async (match_id, user_id) => {
    try {
      const [result] = await pool.execute(
        'UPDATE Matches SET status = "rejected", updated_at = NOW() WHERE match_id = ? AND target_id = ? AND status = "pending"',
        [match_id, user_id]
      );
      
      if (result.affectedRows > 0) {
        return { success: true, message: 'Match rejected' };
      } else {
        return { success: false, message: 'Match not found or already processed' };
      }
    } catch (error) {
      console.error('Error rejecting match:', error);
      return { success: false, message: 'Error rejecting match' };
    }
  },

  // Cancel a sent match request
  cancelMatch: async (match_id, user_id) => {
    try {
      const [result] = await pool.execute(
        'UPDATE Matches SET status = "cancelled", updated_at = NOW() WHERE match_id = ? AND requester_id = ? AND status = "pending"',
        [match_id, user_id]
      );
      
      if (result.affectedRows > 0) {
        return { success: true, message: 'Match request cancelled' };
      } else {
        return { success: false, message: 'Match not found or already processed' };
      }
    } catch (error) {
      console.error('Error cancelling match:', error);
      return { success: false, message: 'Error cancelling match' };
    }
  }
};

module.exports = Match;
