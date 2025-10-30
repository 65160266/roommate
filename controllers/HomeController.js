/**
 * HomeController - จัดการหน้าแรกและการค้นหาผู้ใช้
 */

const Account = require("../models/AccountModel");
const HomeModel = require("../models/HomeModel");
const Match = require("../models/MatchModel");

// แสดงหน้าแรก - แสดงผู้ใช้ทั้งหมดที่มีประกาศ
exports.getHome = async (req, res) => {
  try {
    // ตรวจสอบว่าล็อกอินแล้วหรือไม่
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

    // ดึงผู้ใช้ทั้งหมดพร้อมข้อมูลโพสต์
    const allAccounts = await HomeModel.getAllUsersWithPosts();
    
    // Get current user's post data
    const currentUserPost = allAccounts.find(user => user.Accounts_id === account.Accounts_id);
    if (currentUserPost) {
      account.Post_id = currentUserPost.Post_id;
      account.post_title = currentUserPost.post_title;
      account.post_content = currentUserPost.post_content;
      account.post_created_at = currentUserPost.post_created_at;
      account.room_status = currentUserPost.room_status;
      account.people_needed = currentUserPost.people_needed;
      account.room_description = currentUserPost.room_description;
    }
    
        // Filter out users without posts and exclude current user
        let accounts = allAccounts.filter(user => 
            user.Accounts_id !== account.Accounts_id && 
            user.post_content && 
            user.post_content.trim() !== ''
        );
    
    // Get match data to filter out already matched users
    const Match = require('../models/MatchModel');
    const Passed = require('../models/PassedModel');
    const currentUserId = account.Accounts_id;
    
    // Get all matches for current user (pending, confirmed, cancelled)
    const allMatches = await Match.getAllMatchesForUser(currentUserId);
    console.log('All matches for user:', allMatches);
    
    // Filter out only active matches (pending, confirmed) - not cancelled
    const activeMatches = allMatches.filter(match => 
      match.status === 'pending' || match.status === 'confirmed'
    );
    
    const matchedUserIds = activeMatches.map(match => 
      match.requester_id === currentUserId ? match.target_id : match.requester_id
    );
    
    // Get passed users
    const passedUserIds = await Passed.getPassedUsers(currentUserId);
    console.log('Passed user IDs:', passedUserIds);
    
    console.log('Before filtering - accounts count:', accounts.length);
    console.log('Active matches:', activeMatches);
    console.log('Matched user IDs to exclude:', matchedUserIds);
    console.log('Passed user IDs to exclude:', passedUserIds);
    
    // Filter out users that have been matched with (only active matches) and passed users
    accounts = accounts.filter(user => 
      !matchedUserIds.includes(user.Accounts_id) && 
      !passedUserIds.includes(user.Accounts_id)
    );
    
    console.log('After filtering - accounts count:', accounts.length);
    console.log('Remaining user IDs:', accounts.map(user => user.Accounts_id));
    
    // Debug: Show which users were filtered out and why
    const allUserIds = allAccounts.filter(user => 
      user.Accounts_id !== account.Accounts_id && 
      user.post_content && 
      user.post_content.trim() !== ''
    ).map(user => user.Accounts_id);
    
    const filteredOutUserIds = allUserIds.filter(userId => matchedUserIds.includes(userId));
    console.log('Users filtered out:', filteredOutUserIds);
    console.log('Users that should be visible (including cancelled):', accounts.map(user => user.Accounts_id));

    // Check if user is admin
    const db = require("../config/database");
    let isAdmin = false;
    try {
      const [adminCheck] = await db.execute(`
        SELECT is_admin FROM Register WHERE Register_id = ? AND is_admin = TRUE
      `, [Register_id]);
      isAdmin = adminCheck.length > 0;
    } catch (err) {
      console.error('Error checking admin status:', err);
    }

    // Add isAdmin to session
    if (isAdmin) {
      req.session.user.isAdmin = true;
    }

    res.render("home", { 
      accounts, 
      userData: account
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

    await Match.create(requesterId, targetId);
    req.flash('success', 'Match request sent successfully!');
    res.redirect('/home');
  } catch (error) {
    console.error('Error sending match request:', error);
    req.flash('error', error.message || 'Error sending match request');
    res.redirect('/home');
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      console.log("No user session found");
      return res.redirect("/login");
    }

    const Register_id = req.session.user.Register_id;
    if (!Register_id) {
      console.log("No Register_id found in session");
      return res.redirect("/login");
    }

    // Get search query
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.trim() === '') {
      req.flash('error', 'กรุณาใส่คำค้นหา');
      return res.redirect('/home');
    }

    // ข้อมูลของตัวเอง
    const account = await Account.findByRegisterId(Register_id);
    if (!account) {
      console.log("Account not found for Register_id:", Register_id);
      return res.redirect("/accounts");
    }

    // Search users
    const searchResults = await HomeModel.searchUsers(searchQuery, account.Accounts_id);
    
    // Get match data to filter out already matched users
    const Match = require('../models/MatchModel');
    const Passed = require('../models/PassedModel');
    
    const allMatches = await Match.getAllMatches();
    const activeMatches = allMatches.filter(match => 
      match.status === 'pending' || match.status === 'accepted'
    );
    
    const matchedUserIds = new Set();
    activeMatches.forEach(match => {
      if (match.requester_id === account.Accounts_id) {
        matchedUserIds.add(match.target_id);
      } else if (match.target_id === account.Accounts_id) {
        matchedUserIds.add(match.requester_id);
      }
    });
    
    const passedUserIds = await Passed.getPassedUserIds(account.Accounts_id);
    const passedUserIdsSet = new Set(passedUserIds);
    
    // Filter out matched and passed users
    const filteredResults = searchResults.filter(user => 
      !matchedUserIds.has(user.Accounts_id) && 
      !passedUserIdsSet.has(user.Accounts_id)
    );

    console.log('Search query:', searchQuery);
    console.log('Search results count:', filteredResults.length);

    res.render("search-results", { 
      accounts: filteredResults, 
      userData: account,
      searchQuery: searchQuery
    });
  } catch (err) {
    console.error("Search error:", err);
    req.flash('error', 'เกิดข้อผิดพลาดในการค้นหา');
    res.redirect('/home');
  }
};

// Send match request
exports.sendMatchRequest = async (req, res) => {
  try {
    const { target_user_id, action } = req.body;
    
    // Get user account
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      return res.json({ success: false, message: 'Account not found' });
    }
    
    const requester_id = account.Accounts_id;

    // Validate input
    if (!target_user_id || target_user_id == requester_id) {
      return res.json({ success: false, message: 'Invalid target user' });
    }

    if (action === 'match') {
      console.log('Creating match request...');
      console.log('Requester ID:', requester_id);
      console.log('Target User ID:', target_user_id);
      
      try {
        console.log('Creating match between:', requester_id, 'and', target_user_id);
        const matchId = await Match.create(requester_id, target_user_id);
        console.log('Match created successfully, ID:', matchId);
        
        return res.json({ 
          success: true, 
          message: 'Match request sent successfully!',
          matchId: matchId 
        });
      } catch (matchError) {
        console.log('Match creation error:', matchError.message);
        console.log('Error details:', matchError);
        if (matchError.message.includes('already exists') || matchError.message.includes('already confirmed')) {
          return res.json({ 
            success: true, 
            message: 'Match request already sent!',
            matchId: null 
          });
        }
        throw matchError;
      }
    } else if (action === 'pass') {
      console.log('Passing user...');
      console.log('User ID:', requester_id, 'Passed User ID:', target_user_id);
      
      const Passed = require('../models/PassedModel');
      await Passed.addPassedUser(requester_id, target_user_id);
      
      return res.json({ 
        success: true, 
        message: 'User passed successfully!' 
      });
    } else {
      return res.json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error processing match action:', error);
    return res.json({ 
      success: false, 
      message: error.message || 'Error processing request' 
    });
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
};

// Show matched users
exports.showMatched = async (req, res) => {
  try {
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'Account not found');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const matchedUsers = await Match.getConfirmedMatches(currentUserId);

    res.render('matched', { 
      matchedUsers,
      title: 'Matched Roommates',
      currentUser: account 
    });
  } catch (error) {
    console.error('Error fetching confirmed matches:', error);
    req.flash('error', 'Error loading matches');
    res.redirect('/home');
  }
};

// Confirm match
exports.confirmMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      return res.json({ success: false, message: 'Account not found' });
    }
    
    const currentUserId = account.Accounts_id;
    await Match.updateStatus(match_id, 'confirmed');
    
    return res.json({ 
      success: true, 
      message: 'Match confirmed successfully!' 
    });
  } catch (error) {
    console.error('Error confirming match:', error);
    return res.json({ 
      success: false, 
      message: 'Error confirming match' 
    });
  }
};

// Reject match
exports.rejectMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      return res.json({ success: false, message: 'Account not found' });
    }
    
    const currentUserId = account.Accounts_id;
    await Match.updateStatus(match_id, 'rejected');
    
    return res.json({ 
      success: true, 
      message: 'Match rejected successfully!' 
    });
  } catch (error) {
    console.error('Error rejecting match:', error);
    return res.json({ 
      success: false, 
      message: 'Error rejecting match' 
    });
  }
};


