const { MessageModel } = require('../models/messageModel');

module.exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await MessageModel.getMessagesForUser(userId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

module.exports.sendMessage = async (req, res) => {
  try {
    const { recipient_id, content } = req.body;
    const senderId = req.user.id;

    if (!recipient_id || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }

    // Prevent sending messages to self
    if (Number(recipient_id) === Number(senderId)) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Ensure recipient exists and is allowed to receive messages
    const recipient = await MessageModel.getUserById(recipient_id);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (recipient.status === 'suspended') {
      return res.status(403).json({ message: 'Recipient is not available to receive messages' });
    }

    const messageId = await MessageModel.create(senderId, recipient_id, content);
    const messages = await MessageModel.getMessagesForUser(senderId);
    const newMessage = messages.find(m => m.id === messageId);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

module.exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const success = await MessageModel.markAsRead(messageId, userId);
    if (!success) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};

module.exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await MessageModel.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

module.exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await MessageModel.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

module.exports.getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    
    const messages = await MessageModel.getConversationMessages(currentUserId, otherUserId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ message: 'Failed to fetch conversation messages' });
  }
};

module.exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const q = req.query.q || req.query.search || '';
    const users = await MessageModel.getAvailableUsers(currentUserId, q);
    res.json(users);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Failed to fetch available users' });
  }
};

module.exports.createConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Ensure target user exists
    const user = await MessageModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Number(userId) === Number(currentUserId)) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'User is not available to receive messages' });
    }

    // Build a conversation-like object to return to the client
    const conversation = {
      id: user.id,
      name: user.name,
      company: user.company || '',
      last_message: '',
      last_message_time: null,
      unread_count: 0,
    };

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};
