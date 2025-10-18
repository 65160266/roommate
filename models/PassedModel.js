const pool = require("../config/database");

const Passed = {
  // Add user to passed list
  addPassedUser: async (user_id, passed_user_id) => {
    try {
      console.log('Adding passed user:', user_id, 'passed', passed_user_id);
      const [result] = await pool.execute(
        `INSERT INTO Passed_Users (user_id, passed_user_id, created_at) 
         VALUES (?, ?, NOW())`,
        [user_id, passed_user_id]
      );
      console.log('Passed user added with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Error adding passed user:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('User already passed, returning existing record');
        return null;
      }
      throw error;
    }
  },

  // Get all passed users for a user
  getPassedUsers: async (user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT passed_user_id FROM Passed_Users WHERE user_id = ?`,
        [user_id]
      );
      return rows.map(row => row.passed_user_id);
    } catch (error) {
      console.error('Error getting passed users:', error);
      throw error;
    }
  },

  // Check if user has passed another user
  hasPassedUser: async (user_id, passed_user_id) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id FROM Passed_Users WHERE user_id = ? AND passed_user_id = ?`,
        [user_id, passed_user_id]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if user has passed:', error);
      throw error;
    }
  }
};

module.exports = Passed;
