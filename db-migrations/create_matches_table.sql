-- Create Matches table for the roommate matching system
CREATE TABLE IF NOT EXISTS Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    target_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (requester_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES Accounts(Accounts_id) ON DELETE CASCADE,
    
    -- Ensure a user cannot match with themselves
    CONSTRAINT check_no_self_match CHECK (requester_id != target_id),
    
    -- Ensure unique matches between two users (prevent duplicate matches)
    UNIQUE KEY unique_match (requester_id, target_id)
);

-- Create indexes for better performance
CREATE INDEX idx_matches_requester ON Matches(requester_id);
CREATE INDEX idx_matches_target ON Matches(target_id);
CREATE INDEX idx_matches_status ON Matches(status);
CREATE INDEX idx_matches_created_at ON Matches(created_at);

-- Insert sample data for testing (optional)
-- INSERT INTO Matches (requester_id, target_id, status) VALUES 
-- (1, 2, 'pending'),
-- (1, 3, 'confirmed'),
-- (2, 3, 'pending');

