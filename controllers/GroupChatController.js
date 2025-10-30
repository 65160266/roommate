/**
 * GroupChatController - จัดการแชทกลุ่ม
 */

const GroupChatModel = require('../models/GroupChatModel');
const MatchModel = require('../models/MatchModel');
const db = require('../config/database');

// แสดงรายการกลุ่มแชท
exports.showGroupChatList = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.redirect('/login');
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.redirect('/accounts');
        }

        // Check if user is admin
        const isAdmin = req.session.user?.isAdmin || false;
        let groupChats = [];

        if (isAdmin) {
            // Admin can see all groups
            const [allGroups] = await db.execute(`
                SELECT gc.*, a.first_name, a.last_name, 
                       COUNT(gcm.Accounts_id) as member_count
                FROM GroupChats gc 
                JOIN Accounts a ON gc.created_by = a.Accounts_id 
                LEFT JOIN GroupChatMembers gcm ON gc.GroupChat_id = gcm.GroupChat_id
                GROUP BY gc.GroupChat_id
                ORDER BY gc.created_at DESC
            `);
            groupChats = allGroups;
        } else {
            // Regular user sees only their groups
            groupChats = await GroupChatModel.getUserGroups(account.Accounts_id);
        }
        
        res.render('group-chat-list', {
            groupChats: groupChats || [],
            unreadCount: 0,
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error('Error loading group chat list:', error);
        res.status(500).send('Internal server error');
    }
};

exports.showCreateGroupForm = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.redirect('/login');
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.redirect('/accounts');
        }

        // Get matched users for inviting
        let matchedUsers = [];
        try {
            matchedUsers = await MatchModel.getConfirmedMatches(account.Accounts_id);
            console.log('Matched users for group creation:', matchedUsers);
        } catch (error) {
            console.error('Error getting matched users:', error);
            matchedUsers = [];
        }
        
        res.render('create-group', {
            matchedUsers: matchedUsers || []
        });
    } catch (error) {
        console.error('Error loading create group form:', error);
        res.status(500).send('Internal server error');
    }
};

exports.createGroup = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.redirect('/login');
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.redirect('/accounts');
        }

        const { group_name, description, member_ids } = req.body;
        console.log('Create group request body:', req.body);
        console.log('Member IDs:', member_ids);
        
        if (!group_name) {
            req.flash('error', 'กรุณากรอกชื่อกลุ่ม');
            return res.redirect('/group-chat/create');
        }

        // Create group
        const groupId = await GroupChatModel.createGroup(
            group_name,
            description || '',
            account.Accounts_id
        );

        // Add members if selected
        if (member_ids && Array.isArray(member_ids)) {
            console.log('Adding members:', member_ids);
            for (const memberId of member_ids) {
                try {
                    console.log('Adding member:', memberId, 'to group:', groupId);
                    await GroupChatModel.addMember(groupId, memberId, account.Accounts_id);
                    console.log('Member added successfully');
                } catch (error) {
                    console.error('Error adding member:', error);
                }
            }
        } else {
            console.log('No members to add or member_ids is not an array');
        }

        req.flash('success', 'สร้างกลุ่มสำเร็จแล้ว');
        res.redirect('/group-chat');
    } catch (error) {
        console.error('Error creating group:', error);
        req.flash('error', 'เกิดข้อผิดพลาดในการสร้างกลุ่ม');
        res.redirect('/group-chat/create');
    }
};

exports.showGroupChatRoom = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.redirect('/login');
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.redirect('/accounts');
        }

        const { group_id } = req.params;
        
        // Check if user is admin
        const isAdmin = req.session.user?.isAdmin || false;
        
        // Check if user is member of group
        const isMember = await GroupChatModel.isUserMember(group_id, account.Accounts_id);
        
        // If not a member and is admin, auto-join the group
        if (!isMember && isAdmin) {
            console.log('Admin auto-joining group:', group_id);
            try {
                await GroupChatModel.addAdminToGroup(group_id, account.Accounts_id);
                console.log('Admin successfully joined group');
            } catch (joinError) {
                console.error('Error auto-joining admin to group:', joinError);
            }
        } else if (!isMember && !isAdmin) {
            // Regular user without membership
            req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงกลุ่มนี้');
            return res.redirect('/group-chat');
        }

        // Get group details
        console.log('Getting group details for group_id:', group_id);
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        console.log('Group details result:', groupDetails);
        
        if (!groupDetails) {
            console.log('Group not found');
            req.flash('error', 'ไม่พบกลุ่ม');
            return res.redirect('/group-chat');
        }

        // Get messages
        const messages = await GroupChatModel.getGroupMessages(group_id, account.Accounts_id);
        
        // Get members
        const members = await GroupChatModel.getGroupMembers(group_id, account.Accounts_id);

        res.render('group-chat-room', {
            groupDetails: groupDetails,
            messages: messages,
            members: members,
            userId: account.Accounts_id
        });
    } catch (error) {
        console.error('Error loading group chat room:', error);
        res.status(500).send('Internal server error');
    }
};

exports.sendMessage = async (req, res) => {
    try {
        console.log('GroupChatController.sendMessage called with body:', req.body);
        
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            console.log('No Register_id in session');
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            console.log('Account not found for Register_id:', Register_id);
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        console.log('Account found:', { 
            Accounts_id: account.Accounts_id, 
            name: `${account.first_name} ${account.last_name}`,
            account_type: typeof account.Accounts_id,
            account_value: account.Accounts_id,
            account_keys: Object.keys(account)
        });

        const { group_id, message_text } = req.body;
        
        console.log('Request data:', { 
            group_id, 
            message_text,
            group_id_type: typeof group_id,
            group_id_value: group_id
        });
        
        if (!group_id || !message_text) {
            console.log('Missing required fields');
            return res.status(400).json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' });
        }

        // Check if user is member
        console.log('Checking if user is member...');
        const isMember = await GroupChatModel.isUserMember(group_id, account.Accounts_id);
        console.log('Is member result:', isMember);
        
        if (!isMember) {
            return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์ส่งข้อความในกลุ่มนี้' });
        }

        // Save message
        console.log('Saving message...');
        console.log('Account info:', { Accounts_id: account.Accounts_id, name: account.first_name });
        console.log('Request data:', { group_id, message_text });
        
        // ใช้วิธีเดิมที่ทำงานได้
        const groupId = parseInt(group_id);
        const senderId = parseInt(account.Accounts_id);
        const messageText = String(message_text).trim();
        
        console.log('Converted parameters for model:', { groupId, senderId, messageText });
        
        // ตรวจสอบค่าที่แปลงแล้ว
        if (isNaN(groupId) || groupId <= 0) {
            throw new Error('Invalid group_id: ' + group_id);
        }
        if (isNaN(senderId) || senderId <= 0) {
            throw new Error('Invalid sender_id: ' + account.Accounts_id);
        }
        if (messageText.length === 0) {
            throw new Error('Invalid message_text: ' + message_text);
        }
        
        // เรียกใช้ Model
        const messageId = await GroupChatModel.sendMessage(
            groupId,
            senderId,
            messageText
        );

        console.log('Message saved with ID:', messageId);

        // Emit to socket.io
        const io = req.app.get('io');
        const messageData = {
            group_id: parseInt(group_id),
            message_id: messageId,
            sender_id: account.Accounts_id,
            sender_name: `${account.first_name} ${account.last_name}`,
            message_text: message_text.trim(),
            created_at: new Date()
        };
        
        console.log('Emitting message to socket:', messageData);
        io.to(`group-${group_id}`).emit('new-group-message', messageData);

        res.json({ success: true, message_id: messageId });
    } catch (error) {
        console.error('Error sending group message:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการส่งข้อความ: ' + error.message });
    }
};

exports.addMember = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกผู้ใช้' });
        }

        // Add member
        await GroupChatModel.addMember(group_id, user_id, account.Accounts_id);

        res.json({ success: true, message: 'เพิ่มสมาชิกสำเร็จ' });
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก' });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกผู้ใช้' });
        }

        // Remove member
        await GroupChatModel.removeMember(group_id, user_id, account.Accounts_id);

        res.json({ success: true, message: 'ลบสมาชิกสำเร็จ' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบสมาชิก' });
    }
};

// Edit group details
exports.editGroup = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.redirect('/login');
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.redirect('/accounts');
        }

        const { group_id } = req.params;
        
        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        if (!groupDetails || groupDetails.created_by !== account.Accounts_id) {
            req.flash('error', 'คุณไม่มีสิทธิ์แก้ไขกลุ่มนี้');
            return res.redirect('/group-chat');
        }

        // Get matched users for adding members
        let matchedUsers = [];
        try {
            matchedUsers = await MatchModel.getConfirmedMatches(account.Accounts_id);
        } catch (error) {
            console.error('Error getting matched users:', error);
            matchedUsers = [];
        }

        // Get current members
        const members = await GroupChatModel.getGroupMembers(group_id, account.Accounts_id);

        res.render('edit-group', {
            groupDetails: groupDetails,
            matchedUsers: matchedUsers || [],
            members: members || []
        });
    } catch (error) {
        console.error('Error loading edit group form:', error);
        req.flash('error', 'เกิดข้อผิดพลาดในการโหลดหน้าแก้ไขกลุ่ม');
        res.redirect('/group-chat');
    }
};

// Update group details
exports.updateGroup = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;
        const { group_name, description } = req.body;

        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        if (!groupDetails || groupDetails.created_by !== account.Accounts_id) {
            return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์แก้ไขกลุ่มนี้' });
        }

        if (!group_name) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อกลุ่ม' });
        }

        // Update group
        console.log('Updating group:', { group_id, group_name, description });
        const success = await GroupChatModel.updateGroup(group_id, group_name, description || '');
        console.log('Update result:', success);
        
        if (success) {
            res.json({ success: true, message: 'แก้ไขกลุ่มสำเร็จแล้ว' });
        } else {
            res.status(500).json({ success: false, error: 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขกลุ่ม: ' + error.message });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;

        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        if (!groupDetails || groupDetails.created_by !== account.Accounts_id) {
            return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์ลบกลุ่มนี้' });
        }

        // Delete group
        console.log('Deleting group:', { group_id });
        const success = await GroupChatModel.deleteGroup(group_id);
        console.log('Delete result:', success);
        
        if (success) {
            res.json({ success: true, message: 'ลบกลุ่มสำเร็จแล้ว' });
        } else {
            res.status(500).json({ success: false, error: 'ไม่สามารถลบกลุ่มได้' });
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบกลุ่ม' });
    }
};

// Leave group
exports.leaveGroup = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;

        // Check if user is member
        const isMember = await GroupChatModel.isUserMember(group_id, account.Accounts_id);
        if (!isMember) {
            return res.status(403).json({ success: false, error: 'คุณไม่ได้เป็นสมาชิกของกลุ่มนี้' });
        }

        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id);
        if (groupDetails && groupDetails.created_by === account.Accounts_id) {
            return res.status(403).json({ success: false, error: 'ผู้สร้างกลุ่มไม่สามารถออกจากกลุ่มได้ กรุณาลบกลุ่มแทน' });
        }

        // Leave group
        await GroupChatModel.removeMember(group_id, account.Accounts_id, account.Accounts_id);

        res.json({ success: true, message: 'ออกจากกลุ่มสำเร็จแล้ว' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการออกจากกลุ่ม' });
    }
};

// Get invite members (matched users not in group)
exports.getInviteMembers = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;

        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        if (!groupDetails || groupDetails.created_by !== account.Accounts_id) {
            return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์เชิญสมาชิก' });
        }

        // Get matched users not in group
        const matchedUsers = await MatchModel.getConfirmedMatches(account.Accounts_id);
        const currentMembers = await GroupChatModel.getGroupMembers(group_id, account.Accounts_id);
        const currentMemberIds = currentMembers.map(member => member.user_id);
        
        const availableMembers = matchedUsers.filter(user => 
            !currentMemberIds.includes(user.Accounts_id)
        );

        res.json({ 
            success: true, 
            members: availableMembers 
        });
    } catch (error) {
        console.error('Error getting invite members:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
    }
};

// Add multiple members to group
exports.addMembers = async (req, res) => {
    try {
        const Register_id = req.session.user?.Register_id;
        if (!Register_id) {
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
        }

        const account = await require('../models/AccountModel').findByRegisterId(Register_id);
        if (!account) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบัญชี' });
        }

        const { group_id } = req.params;
        const { member_ids } = req.body;

        // Check if user is the creator
        const groupDetails = await GroupChatModel.getGroupDetails(group_id, account.Accounts_id);
        if (!groupDetails || groupDetails.created_by !== account.Accounts_id) {
            return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์เชิญสมาชิก' });
        }

        if (!member_ids || !Array.isArray(member_ids)) {
            return res.status(400).json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' });
        }

        // Add each member
        const results = [];
        for (const memberId of member_ids) {
            try {
                await GroupChatModel.addMember(group_id, memberId, account.Accounts_id);
                results.push({ memberId, success: true });
            } catch (error) {
                console.error(`Error adding member ${memberId}:`, error);
                results.push({ memberId, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({ 
            success: true, 
            message: `เชิญสมาชิกสำเร็จ ${successCount} คน${failCount > 0 ? `, ล้มเหลว ${failCount} คน` : ''}`,
            results: results
        });
    } catch (error) {
        console.error('Error adding members:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเชิญสมาชิก' });
    }
};