# Roommate Match System Implementation

## Overview
This implementation provides a complete match flow system for the roommate application, allowing users to send match requests, manage pending matches, and view confirmed matches.

## Features Implemented

### 1. Database Schema
- **Matches Table**: Stores match requests with status tracking
- **Status Types**: `pending`, `confirmed`, `rejected`
- **Constraints**: Prevents self-matching and duplicate matches

### 2. MVC Components

#### Model (`models/MatchModel.js`)
- `create()` - Create new match request
- `findByUsers()` - Find existing match between users
- `updateStatus()` - Update match status (confirm/reject)
- `getPendingMatches()` - Get pending requests for a user
- `getSentMatches()` - Get sent requests by a user
- `getConfirmedMatches()` - Get confirmed matches
- `getMatchStats()` - Get match statistics

#### Controller (`controllers/MatchController.js`)
- `showMatchableUsers()` - Display users available for matching
- `sendMatchRequest()` - Send a match request
- `showInProgress()` - Show pending matches
- `showMatched()` - Show confirmed matches
- `confirmMatch()` - Confirm a match request
- `rejectMatch()` - Reject a match request
- `cancelMatch()` - Cancel a sent request

#### Routes (`routes/matchRoutes.js`)
- `GET /match` - Find roommates
- `POST /match` - Send match request
- `GET /match/in-progress` - View pending matches
- `GET /match/matched` - View confirmed matches
- `POST /match/:id/confirm` - Confirm match
- `POST /match/:id/reject` - Reject match
- `DELETE /match/:id/cancel` - Cancel match

#### Views
- `views/match.ejs` - Find and match with users
- `views/in-progress.ejs` - Manage pending matches
- `views/matched.ejs` - View confirmed matches

## Database Setup

### 1. Run the Migration
```sql
-- Execute the migration file
SOURCE db-migrations/create_matches_table.sql;
```

### 2. Example SQL Queries

#### Create a match request
```sql
INSERT INTO Matches (requester_id, target_id, status) 
VALUES (1, 2, 'pending');
```

#### Get pending matches for a user
```sql
SELECT m.*, a.name as requester_name, a.image as requester_image
FROM Matches m
LEFT JOIN Accounts a ON m.requester_id = a.Accounts_id
WHERE m.target_id = 2 AND m.status = 'pending';
```

#### Confirm a match
```sql
UPDATE Matches 
SET status = 'confirmed', updated_at = NOW() 
WHERE match_id = 1;
```

#### Get match statistics
```sql
SELECT 
  COUNT(CASE WHEN status = 'pending' AND target_id = 1 THEN 1 END) as pending_requests,
  COUNT(CASE WHEN status = 'pending' AND requester_id = 1 THEN 1 END) as sent_requests,
  COUNT(CASE WHEN status = 'confirmed' AND (requester_id = 1 OR target_id = 1) THEN 1 END) as confirmed_matches
FROM Matches
WHERE requester_id = 1 OR target_id = 1;
```

#### Find users available for matching
```sql
SELECT a.*, f.faculty_name, m.majors_name
FROM Accounts a
LEFT JOIN Faculty f ON a.Faculty_id = f.faculty_id
LEFT JOIN Majors m ON a.Majors_id = m.majors_id
WHERE a.Accounts_id != 1
AND a.Accounts_id NOT IN (
  SELECT CASE 
    WHEN requester_id = 1 THEN target_id 
    ELSE requester_id 
  END 
  FROM Matches 
  WHERE requester_id = 1 OR target_id = 1
);
```

## API Endpoints

### Match Flow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/match` | Show available users to match with |
| POST | `/match` | Send a match request |
| GET | `/match/in-progress` | Show pending matches |
| GET | `/match/matched` | Show confirmed matches |
| POST | `/match/:id/confirm` | Confirm a match request |
| POST | `/match/:id/reject` | Reject a match request |
| DELETE | `/match/:id/cancel` | Cancel a sent request |
| GET | `/match/stats` | Get match statistics (JSON) |

### Request/Response Examples

#### Send Match Request
```http
POST /match
Content-Type: application/x-www-form-urlencoded

target_id=2
```

#### Confirm Match
```http
POST /match/1/confirm
```

#### Get Match Statistics
```http
GET /match/stats
```

Response:
```json
{
  "pending_requests": 2,
  "sent_requests": 1,
  "confirmed_matches": 3
}
```

## Usage Flow

### 1. Finding Roommates
1. User visits `/match`
2. System shows all available users (excluding current user and existing matches)
3. User clicks "Send Match Request" on desired user
4. System creates pending match record

### 2. Managing In-Progress Matches
1. User visits `/match/in-progress`
2. System shows:
   - **Pending Requests**: Matches waiting for user's response
   - **Sent Requests**: Matches user has sent (waiting for response)
3. User can:
   - Confirm/Reject pending requests
   - Cancel sent requests

### 3. Viewing Confirmed Matches
1. User visits `/match/matched`
2. System shows all confirmed matches
3. User can view matched roommate details

## Validation Rules

### Match Creation
- Users cannot match with themselves
- Duplicate matches are prevented
- Only one pending match allowed between two users

### Match Actions
- Only target user can confirm/reject match
- Only requester can cancel sent request
- Status changes are validated

## Error Handling

### Common Error Scenarios
1. **Duplicate Match**: "Match already exists between these users"
2. **Unauthorized Action**: "Match not found or unauthorized"
3. **Invalid Status**: "Match is no longer pending"
4. **Self Match**: "Cannot match with yourself"

### Flash Messages
- Success: Green notification for successful actions
- Error: Red notification for failed actions
- Auto-hide after 5 seconds

## Testing the System

### 1. Database Setup
```bash
# Start the application
npm start

# Access phpMyAdmin at http://localhost:8080
# Run the migration SQL
```

### 2. Test Scenarios
1. **Create Accounts**: Register multiple users
2. **Send Match Request**: User A sends request to User B
3. **View In-Progress**: User B sees pending request
4. **Confirm Match**: User B confirms the match
5. **View Matched**: Both users see confirmed match

### 3. Sample Test Data
```sql
-- Insert sample users
INSERT INTO Accounts (name, age, Faculty_id, Majors_id, image) VALUES
('John Doe', 20, 1, 1, 'https://example.com/john.jpg'),
('Jane Smith', 21, 1, 2, 'https://example.com/jane.jpg'),
('Bob Wilson', 19, 2, 1, 'https://example.com/bob.jpg');

-- Create sample matches
INSERT INTO Matches (requester_id, target_id, status) VALUES
(1, 2, 'pending'),
(1, 3, 'confirmed'),
(2, 3, 'pending');
```

## Security Considerations

1. **Authentication**: All routes protected by auth middleware
2. **Authorization**: Users can only act on their own matches
3. **Input Validation**: All inputs validated before processing
4. **SQL Injection**: Using parameterized queries
5. **XSS Protection**: EJS auto-escapes output

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns
2. **Efficient Queries**: Optimized JOIN operations
3. **Caching**: Consider implementing for high-traffic scenarios
4. **Pagination**: Can be added for large user lists

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration
2. **Match Preferences**: Filtering based on user preferences
3. **Match Scoring**: Algorithm-based matching
4. **Chat Integration**: Direct messaging between matches
5. **Mobile App**: API endpoints for mobile applications

## Troubleshooting

### Common Issues
1. **Database Connection**: Check MySQL service and credentials
2. **Session Issues**: Verify session configuration
3. **Route Conflicts**: Ensure proper route ordering
4. **View Errors**: Check EJS syntax and file paths

### Debug Mode
Enable debug logging by setting:
```javascript
app.set('env', 'development');
```

## Support
For issues or questions, check the application logs and database queries for detailed error information.
