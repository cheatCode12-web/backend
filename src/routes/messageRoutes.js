const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply auth middleware to all message routes
router.use(protect);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Create a new conversation (returns user info to start a convo)
router.post('/conversations', messageController.createConversation);

// Get all messages for a specific conversation
router.get('/conversations/:userId', messageController.getConversationMessages);
router.get('/conversations/:userId/messages', messageController.getConversationMessages);

// Get all messages for the current user
router.get('/', messageController.getMessages);

// Get available users to start a conversation (searchable)
router.get('/available-users', messageController.getAvailableUsers);

// Send a new message
router.post('/', messageController.sendMessage);

// Mark a message as read
router.patch('/:messageId/read', messageController.markAsRead);

// Get unread messages count
router.get('/unread/count', messageController.getUnreadCount);

module.exports = router;
