const Match = require('../models/MatchModel');
const Account = require('../models/AccountModel');
const pool = require('../config/database');

const MatchController = {
  // Show all users that can be matched (excluding current user and existing matches)
  showMatchableUsers: async (req, res) => {
    try {
      const currentUserId = req.session.user.Accounts_id;
      
      // Get all accounts except current user and those already matched
      const [users] = await pool.execute(
        `SELECT 
          a.*,
          f.faculty_name,
          m.majors_name,
          GROUP_CONCAT(p.description SEPARATOR ', ') AS Personality
        FROM Accounts a
        LEFT JOIN Faculty f ON a.Faculty_id = f.faculty_id
        LEFT JOIN Majors m ON a.Majors_id = m.majors_id
        LEFT JOIN Accounts_has_Personality ap ON a.Accounts_id = ap.Accounts_id
        LEFT JOIN Personality p ON ap.Personality_id = p.Personality_id
        WHERE a.Accounts_id != ?
        AND a.Accounts_id NOT IN (
          SELECT CASE 
            WHEN requester_id = ? THEN target_id 
            ELSE requester_id 
          END 
          FROM Matches 
          WHERE requester_id = ? OR target_id = ?
        )
        GROUP BY a.Accounts_id
        ORDER BY a.name`,
        [currentUserId, currentUserId, currentUserId, currentUserId]
      );

      res.render('match', { 
        users, 
        title: 'Find Roommates',
        currentUser: req.session.user 
      });
    } catch (error) {
      console.error('Error fetching matchable users:', error);
      req.flash('error', 'Error loading users');
      res.redirect('/home');
    }
  },

  // Send a match request
  sendMatchRequest: async (req, res) => {
    try {
      const { target_id } = req.body;
      const requester_id = req.session.user.Accounts_id;

      // Validate input
      if (!target_id || target_id == requester_id) {
        req.flash('error', 'Invalid target user');
        return res.redirect('/match');
      }

      // Create match request
      const matchId = await Match.create(requester_id, target_id);
      
      req.flash('success', 'Match request sent successfully!');
      res.redirect('/match');
    } catch (error) {
      console.error('Error sending match request:', error);
      req.flash('error', error.message || 'Error sending match request');
      res.redirect('/match');
    }
  },

  // Show in-progress matches (pending requests)
  showInProgress: async (req, res) => {
    try {
      const currentUserId = req.session.user.Accounts_id;
      
      // Get pending matches where current user is the target
      const pendingMatches = await Match.getPendingMatches(currentUserId);
      
      // Get sent matches where current user is the requester
      const sentMatches = await Match.getSentMatches(currentUserId);

      res.render('in-progress', { 
        pendingMatches,
        sentMatches,
        title: 'In-Progress Matches',
        currentUser: req.session.user 
      });
    } catch (error) {
      console.error('Error fetching in-progress matches:', error);
      req.flash('error', 'Error loading matches');
      res.redirect('/home');
    }
  },

  // Show confirmed matches
  showMatched: async (req, res) => {
    try {
      const currentUserId = req.session.user.Accounts_id;
      const confirmedMatches = await Match.getConfirmedMatches(currentUserId);

      res.render('matched', { 
        confirmedMatches,
        title: 'Matched Roommates',
        currentUser: req.session.user 
      });
    } catch (error) {
      console.error('Error fetching confirmed matches:', error);
      req.flash('error', 'Error loading matches');
      res.redirect('/home');
    }
  },

  // Confirm a match request
  confirmMatch: async (req, res) => {
    try {
      const { match_id } = req.params;
      const currentUserId = req.session.user.Accounts_id;

      // Verify the match exists and user has permission to confirm
      const match = await Match.findById(match_id);
      if (!match || match.target_id !== currentUserId) {
        req.flash('error', 'Match not found or unauthorized');
        return res.redirect('/in-progress');
      }

      if (match.status !== 'pending') {
        req.flash('error', 'Match is no longer pending');
        return res.redirect('/in-progress');
      }

      // Update match status to confirmed
      await Match.updateStatus(match_id, 'confirmed');
      
      req.flash('success', 'Match confirmed successfully!');
      res.redirect('/matched');
    } catch (error) {
      console.error('Error confirming match:', error);
      req.flash('error', 'Error confirming match');
      res.redirect('/in-progress');
    }
  },

  // Reject a match request
  rejectMatch: async (req, res) => {
    try {
      const { match_id } = req.params;
      const currentUserId = req.session.user.Accounts_id;

      // Verify the match exists and user has permission to reject
      const match = await Match.findById(match_id);
      if (!match || match.target_id !== currentUserId) {
        req.flash('error', 'Match not found or unauthorized');
        return res.redirect('/in-progress');
      }

      if (match.status !== 'pending') {
        req.flash('error', 'Match is no longer pending');
        return res.redirect('/in-progress');
      }

      // Update match status to rejected
      await Match.updateStatus(match_id, 'rejected');
      
      req.flash('success', 'Match request rejected');
      res.redirect('/in-progress');
    } catch (error) {
      console.error('Error rejecting match:', error);
      req.flash('error', 'Error rejecting match');
      res.redirect('/in-progress');
    }
  },

  // Cancel a sent match request
  cancelMatch: async (req, res) => {
    try {
      const { match_id } = req.params;
      const currentUserId = req.session.user.Accounts_id;

      // Verify the match exists and user has permission to cancel
      const match = await Match.findById(match_id);
      if (!match || match.requester_id !== currentUserId) {
        req.flash('error', 'Match not found or unauthorized');
        return res.redirect('/in-progress');
      }

      if (match.status !== 'pending') {
        req.flash('error', 'Cannot cancel a match that is no longer pending');
        return res.redirect('/in-progress');
      }

      // Delete the match
      await Match.delete(match_id);
      
      req.flash('success', 'Match request cancelled');
      res.redirect('/in-progress');
    } catch (error) {
      console.error('Error cancelling match:', error);
      req.flash('error', 'Error cancelling match');
      res.redirect('/in-progress');
    }
  },

  // Get match statistics for dashboard
  getMatchStats: async (req, res) => {
    try {
      const currentUserId = req.session.user.Accounts_id;
      const stats = await Match.getMatchStats(currentUserId);
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching match stats:', error);
      res.status(500).json({ error: 'Error fetching match statistics' });
    }
  }
};

module.exports = MatchController;
