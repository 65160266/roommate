# 🔧 Match System Setup Guide

## ✅ **Fixed Issues**
The home page loading issue has been resolved! The page will now load properly even if the match database table doesn't exist yet.

## 🚀 **Quick Setup (3 Steps)**

### **Step 1: Create the Matches Table**
Run this SQL in your database (phpMyAdmin at http://localhost:8080):

```sql
-- Create Matches table
CREATE TABLE IF NOT EXISTS Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    target_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (requester_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    CONSTRAINT check_no_self_match CHECK (requester_id != target_id),
    UNIQUE KEY unique_match (requester_id, target_id)
);

-- Create indexes for better performance
CREATE INDEX idx_matches_requester ON Matches(requester_id);
CREATE INDEX idx_matches_target ON Matches(target_id);
CREATE INDEX idx_matches_status ON Matches(status);
CREATE INDEX idx_matches_created_at ON Matches(created_at);
```

### **Step 2: Test the Home Page**
1. Go to `http://localhost:3000/home`
2. You should see the home page with tabs: "Find Roommates", "In-Progress", "Matched"
3. The "Find Roommates" tab should show all users with match buttons

### **Step 3: Test Match Functionality**
1. Click "จับคู่" (Match) button on any user
2. You should see a success message
3. Click "กำลังดำเนินการ" (In-Progress) tab to see sent requests
4. The target user can then confirm/reject the match

## 🎯 **What's Working Now**

### **✅ Home Page**
- Loads properly with all user data
- Shows tabbed interface
- Handles missing match data gracefully

### **✅ Navigation**
- "จับคู่" → Find Roommates tab
- "กำลังดำเนินการ" → In-Progress tab  
- "จับคู่สำเร็จ" → Matched tab

### **✅ Match Flow**
1. **Find Roommates**: Browse users, send match requests
2. **In-Progress**: Manage pending/sent requests
3. **Matched**: View confirmed matches

## 🐛 **If You Still Have Issues**

### **Check Console Logs**
Look for any error messages in the terminal where you're running the server.

### **Verify Database Connection**
Make sure your MySQL database is running and accessible.

### **Check User Authentication**
Ensure you're logged in and have a valid session.

## 📊 **Database Status**
- **Without Matches table**: Home page works, match buttons show error messages
- **With Matches table**: Full match functionality works

## 🎉 **Success Indicators**
- Home page loads without "loading" message
- User data displays properly
- Tabs switch correctly
- Match buttons work (after creating the table)

The system is now robust and will work whether or not the match database table exists!

