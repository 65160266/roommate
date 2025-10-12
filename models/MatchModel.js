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
        throw new Error('Match already exists between these users');
      }

      const [result] = await pool.execute(
        `INSERT INTO Matches (requester_id, target_id, status, created_at) 
         VALUES (?, ?, 'pending', NOW())`,
        [requester_id, target_id]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },

  // Find match by requester and target users
  findByUsers: async (requester_id, target_id) => {
    const [rows] = await pool.execute(
      `SELECT * FROM Matches 
       WHERE (requester_id = ? AND target_id = ?) 
       OR (requester_id = ? AND target_id = ?)`,
      [requester_id, target_id, target_id, requester_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Update match status (confirm/reject)
  updateStatus: async (match_id, status) => {
    const [result] = await pool.execute(
      `UPDATE Matches SET status = ?, updated_at = NOW() WHERE match_id = ?`,
      [status, match_id]
    );
    return result.affectedRows > 0;
  },

  // Get all pending matches for a user (in-progress)
  getPendingMatches: async (user_id) => {
    if (!user_id) {
      return [];
    }
    const [rows] = await pool.execute(
      `SELECT 
        m.*,
        CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, '')) as requester_name,
        a1.image as requester_image,
        a1.age as requester_age,
        COALESCE(f1.faculty_name, 'Not specified') as requester_faculty,
        COALESCE(m1.majors_name, 'Not specified') as requester_major,
        CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, '')) as target_name,
        a2.image as target_image,
        a2.age as target_age,
        COALESCE(f2.faculty_name, 'Not specified') as target_faculty,
        COALESCE(m2.majors_name, 'Not specified') as target_major
      FROM Matches m
      LEFT JOIN Accounts a1 ON m.requester_id = a1.Accounts_id
      LEFT JOIN Accounts a2 ON m.target_id = a2.Accounts_id
      LEFT JOIN Faculty f1 ON a1.Faculty_id = f1.faculty_id AND a1.Faculty_id IS NOT NULL
      LEFT JOIN Faculty f2 ON a2.Faculty_id = f2.faculty_id AND a2.Faculty_id IS NOT NULL
      LEFT JOIN Majors m1 ON a1.Majors_id = m1.majors_id AND a1.Majors_id IS NOT NULL
      LEFT JOIN Majors m2 ON a2.Majors_id = m2.majors_id AND a2.Majors_id IS NOT NULL
      WHERE m.target_id = ? AND m.status = 'pending'
      ORDER BY m.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  // Get all sent matches for a user
  getSentMatches: async (user_id) => {
    if (!user_id) {
      return [];
    }
    const [rows] = await pool.execute(
      `SELECT 
        m.*,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as target_name,
        a.image as target_image,
        a.age as target_age,
        COALESCE(f.faculty_name, 'Not specified') as target_faculty,
        COALESCE(ma.majors_name, 'Not specified') as target_major
      FROM Matches m
      LEFT JOIN Accounts a ON m.target_id = a.Accounts_id
      LEFT JOIN Faculty f ON a.Faculty_id = f.faculty_id AND a.Faculty_id IS NOT NULL
      LEFT JOIN Majors ma ON a.Majors_id = ma.majors_id AND a.Majors_id IS NOT NULL
      WHERE m.requester_id = ?
      ORDER BY m.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  // Get all confirmed matches for a user
  getConfirmedMatches: async (user_id) => {
    if (!user_id) {
      return [];
    }
    const [rows] = await pool.execute(
      `SELECT 
        m.*,
        CASE 
          WHEN m.requester_id = ? THEN m.target_id
          ELSE m.requester_id
        END as matched_user_id,
        CASE 
          WHEN m.requester_id = ? THEN CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, ''))
          ELSE CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, ''))
        END as matched_user_name,
        CASE 
          WHEN m.requester_id = ? THEN a2.image
          ELSE a1.image
        END as matched_user_image,
        CASE 
          WHEN m.requester_id = ? THEN a2.age
          ELSE a1.age
        END as matched_user_age,
        CASE 
          WHEN m.requester_id = ? THEN COALESCE(f2.faculty_name, 'Not specified')
          ELSE COALESCE(f1.faculty_name, 'Not specified')
        END as matched_user_faculty,
        CASE 
          WHEN m.requester_id = ? THEN COALESCE(ma2.majors_name, 'Not specified')
          ELSE COALESCE(ma1.majors_name, 'Not specified')
        END as matched_user_major
      FROM Matches m
      LEFT JOIN Accounts a1 ON m.requester_id = a1.Accounts_id
      LEFT JOIN Accounts a2 ON m.target_id = a2.Accounts_id
      LEFT JOIN Faculty f1 ON a1.Faculty_id = f1.faculty_id AND a1.Faculty_id IS NOT NULL
      LEFT JOIN Faculty f2 ON a2.Faculty_id = f2.faculty_id AND a2.Faculty_id IS NOT NULL
      LEFT JOIN Majors ma1 ON a1.Majors_id = ma1.majors_id AND a1.Majors_id IS NOT NULL
      LEFT JOIN Majors ma2 ON a2.Majors_id = ma2.majors_id AND a2.Majors_id IS NOT NULL
      WHERE (m.requester_id = ? OR m.target_id = ?) AND m.status = 'confirmed'
      ORDER BY m.updated_at DESC`,
      [user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id]
    );
    return rows;
  },

  // Get match by ID
  findById: async (match_id) => {
    const [rows] = await pool.execute(
      `SELECT 
        m.*,
        CONCAT(COALESCE(a1.first_name, ''), ' ', COALESCE(a1.last_name, '')) as requester_name,
        a1.image as requester_image,
        CONCAT(COALESCE(a2.first_name, ''), ' ', COALESCE(a2.last_name, '')) as target_name,
        a2.image as target_image
      FROM Matches m
      LEFT JOIN Accounts a1 ON m.requester_id = a1.Accounts_id
      LEFT JOIN Accounts a2 ON m.target_id = a2.Accounts_id
      WHERE m.match_id = ?`,
      [match_id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Delete a match (for canceling)
  delete: async (match_id) => {
    const [result] = await pool.execute(
      `DELETE FROM Matches WHERE match_id = ?`,
      [match_id]
    );
    return result.affectedRows > 0;
  },

  // Get match statistics for a user
  getMatchStats: async (user_id) => {
    if (!user_id) {
      return { pending_requests: 0, sent_requests: 0, confirmed_matches: 0 };
    }
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'pending' AND target_id = ? THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'pending' AND requester_id = ? THEN 1 END) as sent_requests,
        COUNT(CASE WHEN status = 'confirmed' AND (requester_id = ? OR target_id = ?) THEN 1 END) as confirmed_matches
      FROM Matches
      WHERE requester_id = ? OR target_id = ?`,
      [user_id, user_id, user_id, user_id, user_id, user_id]
    );
    return rows.length > 0 ? rows[0] : { pending_requests: 0, sent_requests: 0, confirmed_matches: 0 };
  }
};

module.exports = Match;
