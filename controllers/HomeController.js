const Account = require("../models/AccountModel");
const HomeModel = require("../models/HomeModel");

exports.getHome = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      console.log("No user session found");
      return res.redirect("/login");
    }

    // Debug session data
    console.log("Session user:", req.session.user);
    
    const Register_id = req.session.user.Register_id;
    if (!Register_id) {
      console.log("No Register_id found in session");
      return res.redirect("/login");
    }

    // ข้อมูลของตัวเอง
    const account = await Account.findByRegisterId(Register_id);
    console.log("Account found:", account ? "Yes" : "No");

    if (!account) {
      console.log("Account not found for Register_id:", Register_id);
      return res.redirect("/accounts");
    }

    // ดึงผู้ใช้ทั้งหมด
    const accounts = await HomeModel.getAllUsers();
    
    // Get match data
    const Match = require("../models/MatchModel");
    let pendingMatches = [];
    let sentMatches = [];
    let confirmedMatches = [];
    let matchStats = { pending_requests: 0, sent_requests: 0, confirmed_matches: 0 };

    try {
      // Validate that we have a valid Accounts_id
      if (account.Accounts_id && typeof account.Accounts_id === 'number') {
        pendingMatches = await Match.getPendingMatches(account.Accounts_id);
        sentMatches = await Match.getSentMatches(account.Accounts_id);
        confirmedMatches = await Match.getConfirmedMatches(account.Accounts_id);
        matchStats = await Match.getMatchStats(account.Accounts_id);
      } else {
        console.log("Invalid Accounts_id:", account.Accounts_id);
      }
    } catch (matchError) {
      console.log("Match data error (non-critical):", matchError.message);
      // Continue with empty arrays - match functionality will still work
    }

    res.render("home", { 
      accounts, 
      userData: account,
      pendingMatches,
      sentMatches,
      confirmedMatches,
      matchStats
    });
  } catch (err) {
    console.error("Get home error:", err);
    res.status(500).send("โหลดหน้า Home ล้มเหลว");
  }
};

// Send match request
exports.sendMatchRequest = async (req, res) => {
  try {
    const { target_id } = req.body;
    
    // Check if user is logged in
    if (!req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }

    // Get the user's account to get the Accounts_id
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found. Please complete your profile first.');
      return res.redirect('/accounts');
    }

    const requester_id = account.Accounts_id;

    console.log("Match request - target_id:", target_id, "requester_id:", requester_id);
    console.log("Session user:", req.session.user);

    // Validate all parameters
    if (!target_id || !requester_id) {
      req.flash('error', 'User information is invalid. Please log in again.');
      return res.redirect('/login');
    }

    if (target_id == requester_id) {
      req.flash('error', 'Cannot match with yourself');
      return res.redirect('/home');
    }

    // Ensure values are numbers
    const targetId = parseInt(target_id);
    const requesterId = parseInt(requester_id);

    if (isNaN(targetId) || isNaN(requesterId)) {
      req.flash('error', 'Invalid user IDs');
      return res.redirect('/home');
    }

    const Match = require("../models/MatchModel");
    await Match.create(requesterId, targetId);
    req.flash('success', 'Match request sent successfully!');
    res.redirect('/home');
  } catch (error) {
    console.error('Error sending match request:', error);
    req.flash('error', error.message || 'Error sending match request');
    res.redirect('/home');
  }
};

// Confirm match
exports.confirmMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    // Check if user is logged in
    if (!req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }

    // Get the user's account to get the Accounts_id
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found. Please complete your profile first.');
      return res.redirect('/accounts');
    }

    const currentUserId = account.Accounts_id;

    // Validate parameters
    if (!match_id || !currentUserId) {
      req.flash('error', 'Invalid match data');
      return res.redirect('/home');
    }

    const matchId = parseInt(match_id);
    const userId = parseInt(currentUserId);

    if (isNaN(matchId) || isNaN(userId)) {
      req.flash('error', 'Invalid IDs');
      return res.redirect('/home');
    }

    const Match = require("../models/MatchModel");
    const match = await Match.findById(matchId);
    if (!match || match.target_id !== userId) {
      req.flash('error', 'Match not found or unauthorized');
      return res.redirect('/home');
    }

    if (match.status !== 'pending') {
      req.flash('error', 'Match is no longer pending');
      return res.redirect('/home');
    }

    await Match.updateStatus(matchId, 'confirmed');
    
    // Create chat room for the confirmed match
    const Chat = require("../models/ChatModel");
    try {
      await Chat.getOrCreateChatRoom(match.requester_id, match.target_id);
      console.log('Chat room created for match:', matchId);
    } catch (chatError) {
      console.error('Error creating chat room:', chatError);
      // Don't fail the match confirmation if chat room creation fails
    }
    
    req.flash('success', 'Match confirmed successfully! You can now chat with your new roommate.');
    res.redirect('/home');
  } catch (error) {
    console.error('Error confirming match:', error);
    req.flash('error', 'Error confirming match');
    res.redirect('/home');
  }
};

// Reject match
exports.rejectMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    // Check if user is logged in
    if (!req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }

    // Get the user's account to get the Accounts_id
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found. Please complete your profile first.');
      return res.redirect('/accounts');
    }

    const currentUserId = account.Accounts_id;

    // Validate parameters
    if (!match_id || !currentUserId) {
      req.flash('error', 'Invalid match data');
      return res.redirect('/home');
    }

    const matchId = parseInt(match_id);
    const userId = parseInt(currentUserId);

    if (isNaN(matchId) || isNaN(userId)) {
      req.flash('error', 'Invalid IDs');
      return res.redirect('/home');
    }

    const Match = require("../models/MatchModel");
    const match = await Match.findById(matchId);
    if (!match || match.target_id !== userId) {
      req.flash('error', 'Match not found or unauthorized');
      return res.redirect('/home');
    }

    if (match.status !== 'pending') {
      req.flash('error', 'Match is no longer pending');
      return res.redirect('/home');
    }

    await Match.updateStatus(matchId, 'rejected');
    req.flash('success', 'Match request rejected');
    res.redirect('/home');
  } catch (error) {
    console.error('Error rejecting match:', error);
    req.flash('error', 'Error rejecting match');
    res.redirect('/home');
  }
};

// Cancel match
exports.cancelMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    // Check if user is logged in
    if (!req.session.user) {
      req.flash('error', 'Please log in first.');
      return res.redirect('/login');
    }

    // Get the user's account to get the Accounts_id
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found. Please complete your profile first.');
      return res.redirect('/accounts');
    }

    const currentUserId = account.Accounts_id;

    // Validate parameters
    if (!match_id || !currentUserId) {
      req.flash('error', 'Invalid match data');
      return res.redirect('/home');
    }

    const matchId = parseInt(match_id);
    const userId = parseInt(currentUserId);

    if (isNaN(matchId) || isNaN(userId)) {
      req.flash('error', 'Invalid IDs');
      return res.redirect('/home');
    }

    const Match = require("../models/MatchModel");
    const match = await Match.findById(matchId);
    if (!match || match.requester_id !== userId) {
      req.flash('error', 'Match not found or unauthorized');
      return res.redirect('/home');
    }

    if (match.status !== 'pending') {
      req.flash('error', 'Cannot cancel a match that is no longer pending');
      return res.redirect('/home');
    }

    await Match.delete(matchId);
    req.flash('success', 'Match request cancelled');
    res.redirect('/home');
  } catch (error) {
    console.error('Error cancelling match:', error);
    req.flash('error', 'Error cancelling match');
    res.redirect('/home');
  }
};




