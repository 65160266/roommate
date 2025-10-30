/**
 * MatchController - จัดการการจับคู่เพื่อนร่วมห้อง
 */

const Match = require('../models/MatchModel');
const Account = require('../models/AccountModel');

// แสดงรายการจับคู่สำเร็จ
exports.showMatched = async (req, res) => {
  try {
    const Register_id = req.session.user?.Register_id;
    if (!Register_id) {
      req.flash('error', 'กรุณาเข้าสู่ระบบ');
      return res.redirect('/login');
    }
    
    const account = await Account.findByRegisterId(Register_id);
    if (!account) {
      req.flash('error', 'ไม่พบข้อมูลบัญชี');
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
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดรายการจับคู่');
    res.redirect('/home');
  }
};

// แสดงรายการจับคู่ที่รอดำเนินการ
exports.showInProgress = async (req, res) => {
  try {
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'ไม่พบข้อมูลบัญชี');
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
    req.flash('error', 'เกิดข้อผิดพลาดในการโหลดรายการจับคู่');
    res.redirect('/home');
  }
};

// ยืนยันการจับคู่
exports.confirmMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'ไม่พบข้อมูลบัญชี');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.confirmMatch(match_id, currentUserId);
    
    if (result.success) {
      res.json({ success: true, message: 'ยืนยันการจับคู่สำเร็จ!' });
    } else {
      res.json({ success: false, message: result.message || 'ไม่สามารถยืนยันการจับคู่ได้' });
    }
  } catch (error) {
    console.error('Error confirming match:', error);
    res.json({ success: false, message: 'เกิดข้อผิดพลาดในการยืนยันการจับคู่' });
  }
};

// Reject a match request
exports.rejectMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'ไม่พบข้อมูลบัญชี');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.rejectMatch(match_id, currentUserId);
    
    if (result.success) {
      res.json({ success: true, message: 'ปฏิเสธการจับคู่แล้ว' });
    } else {
      res.json({ success: false, message: result.message || 'ไม่สามารถปฏิเสธการจับคู่ได้' });
    }
  } catch (error) {
    console.error('Error rejecting match:', error);
    res.json({ success: false, message: 'เกิดข้อผิดพลาดในการปฏิเสธการจับคู่' });
  }
};

// Cancel a sent match request
exports.cancelMatch = async (req, res) => {
  try {
    const { match_id } = req.params;
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      req.flash('error', 'ไม่พบข้อมูลบัญชี');
      return res.redirect('/home');
    }
    
    const currentUserId = account.Accounts_id;
    const result = await Match.cancelMatch(match_id, currentUserId);
    
    if (result.success) {
      req.flash('success', 'ยกเลิกคำขอจับคู่แล้ว');
    } else {
      req.flash('error', result.message || 'ไม่สามารถยกเลิกคำขอจับคู่ได้');
    }
    
    res.redirect('/match/in-progress');
  } catch (error) {
    console.error('Error cancelling match:', error);
    req.flash('error', 'เกิดข้อผิดพลาดในการยกเลิกคำขอจับคู่');
    res.redirect('/match/in-progress');
  }
};

// Get match statistics
exports.getMatchStats = async (req, res) => {
  try {
    const Register_id = req.session.user.Register_id;
    const account = await Account.findByRegisterId(Register_id);
    
    if (!account) {
      return res.status(401).json({ error: 'ไม่พบข้อมูลบัญชี' });
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
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติการจับคู่' });
  }
};
