const Match = require('../models/MatchModel');
const Account = require('../models/AccountModel');

// Show confirmed matches
exports.showMatched = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) {
      req.flash('error', 'User not authenticated');
      return res.redirect('/login');
    }
    
    const account = await Account.findByRegisterId(Register_id);
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const matchedUsers = await Match.getConfirmedMatches(currentUserId);

    res.render('matched', { 
      matchedUsers: matchedUsers || [],
      title: 'Matched Roommates',
      currentUser: account 
    });
  } catch (error) {
    console.error('Error fetching confirmed matches:', error);
    req.flash('error', 'Error loading matched users');
    res.redirect('/home');
  }
};

// Show in-progress matches
exports.showInProgress = async (req, res) => {
  try {
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const pendingMatches = await Match.getPendingMatches(currentUserId);
    const sentMatches = await Match.getSentMatches(currentUserId);

    res.render('in-progress', { 
      pendingMatches,
      sentMatches,
      title: 'In Progress Matches',
      currentUser: account 
    });
  } catch (error) {
    console.error('Error fetching in-progress matches:', error);
    req.flash('error', 'Error loading matches');
    res.redirect('/home');
  }
};

// Confirm a match request
exports.confirmMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.confirmMatch(match_id, currentUserId);
    
    if (result.success) {
      res.json({ success: true, message: 'Match confirmed successfully!' });
    } else {
      res.json({ success: false, message: result.message || 'Failed to confirm match' });
    }
  } catch (error) {
    console.error('Error confirming match:', error);
    res.json({ success: false, message: 'Error confirming match' });
  }
};

// Reject a match request
exports.rejectMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.rejectMatch(match_id, currentUserId);
    
    if (result.success) {
      res.json({ success: true, message: 'Match rejected' });
    } else {
      res.json({ success: false, message: result.message || 'Failed to reject match' });
    }
  } catch (error) {
    console.error('Error rejecting match:', error);
    res.json({ success: false, message: 'Error rejecting match' });
  }
};

// Cancel a sent match request
exports.cancelMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.cancelMatch(match_id, currentUserId);
    
    if (result.success) {
      req.flash('success', 'Match request cancelled');
    } else {
      req.flash('error', result.message || 'Failed to cancel match');
    }
    
    res.redirect('/match/in-progress');
  } catch (error) {
    console.error('Error cancelling match:', error);
    req.flash('error', 'Error cancelling match');
    res.redirect('/match/in-progress');
  }
};

// Get match statistics
exports.getMatchStats = async (req, res) => {
  try {
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      return res.status(401).json({ error: 'Account not found' });
    }
    
    const currentUserId = account.Accounts_id;
    const pendingMatches = await Match.getPendingMatches(currentUserId);
    const sentMatches = await Match.getSentMatches(currentUserId);
    const confirmedMatches = await Match.getConfirmedMatches(currentUserId);
    
    res.json({
      pending: pendingMatches.length,
      sent: sentMatches.length,
      confirmed: confirmedMatches.length
    });
  } catch (error) {
    console.error('Error getting match stats:', error);
    res.status(500).json({ error: 'Error getting match statistics' });
  }
};
