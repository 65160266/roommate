const express = require('express');
const router = express.Router();
const MatchController = require('../controllers/MatchController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// GET /match - Show all users that can be matched
router.get('/', MatchController.showMatchableUsers);

// POST /match - Send a match request
router.post('/', MatchController.sendMatchRequest);

// GET /in-progress - Show pending matches (in-progress)
router.get('/in-progress', MatchController.showInProgress);

// GET /matched - Show confirmed matches
router.get('/matched', MatchController.showMatched);

// POST /match/:match_id/confirm - Confirm a match request
router.post('/:match_id/confirm', MatchController.confirmMatch);

// POST /match/:match_id/reject - Reject a match request
router.post('/:match_id/reject', MatchController.rejectMatch);

// DELETE /match/:match_id/cancel - Cancel a sent match request
router.delete('/:match_id/cancel', MatchController.cancelMatch);

// GET /match/stats - Get match statistics (API endpoint)
router.get('/stats', MatchController.getMatchStats);

module.exports = router;
