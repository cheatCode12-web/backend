const { pool } = require('../config/db');

class MessageModel {
  static async create(senderId, recipientId, content) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)',
        [senderId, recipientId, content]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getMessagesForUser(userId) {
    try {
      const [messages] = await pool.execute(
        `SELECT m.*, 
         u1.name as sender_name, 
         u2.name as recipient_name
         FROM messages m
         JOIN users u1 ON m.sender_id = u1.id
         JOIN users u2 ON m.recipient_id = u2.id
         WHERE m.sender_id = ? OR m.recipient_id = ?
         ORDER BY m.created_at DESC`,
        [userId, userId]
      );
      return messages;
    } catch (error) {
      throw error;
    }
  }

  static async markAsRead(messageId, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE messages SET is_read = TRUE WHERE id = ? AND recipient_id = ?',
        [messageId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const [result] = await pool.execute(
        'SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = FALSE',
        [userId]
      );
      return result[0].count;
    } catch (error) {
      throw error;
    }
  }

  static async getConversations(userId) {
    try {
      const [conversations] = await pool.execute(
        `WITH LastMessages AS (
          SELECT 
            CASE 
              WHEN sender_id = ? THEN recipient_id
              ELSE sender_id
            END AS other_user_id,
            m.content,
            m.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY 
                CASE 
                  WHEN sender_id = ? THEN recipient_id
                  ELSE sender_id
                END 
              ORDER BY created_at DESC
            ) as rn
          FROM messages m
          WHERE sender_id = ? OR recipient_id = ?
        )
        SELECT 
          u.id,
          u.name,
          u.company,
          lm.content AS last_message,
          lm.created_at AS last_message_time,
          COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.recipient_id = ? THEN m.id END) AS unread_count
        FROM users u
        INNER JOIN LastMessages lm ON u.id = lm.other_user_id AND lm.rn = 1
        LEFT JOIN messages m ON m.sender_id = u.id AND m.recipient_id = ? AND m.is_read = FALSE
        WHERE u.id IN (
          SELECT DISTINCT
            CASE 
              WHEN sender_id = ? THEN recipient_id
              ELSE sender_id
            END
          FROM messages 
          WHERE sender_id = ? OR recipient_id = ?
        )
        GROUP BY u.id, u.name, u.company, lm.content, lm.created_at
        ORDER BY lm.created_at DESC`,
        [userId, userId, userId, userId, userId, userId, userId, userId, userId]
      );
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  static async getConversationMessages(user1Id, user2Id) {
    try {
      const [messages] = await pool.execute(
        `SELECT m.*, 
         u1.name as sender_name,
         u2.name as recipient_name
         FROM messages m
         JOIN users u1 ON m.sender_id = u1.id
         JOIN users u2 ON m.recipient_id = u2.id
         WHERE (m.sender_id = ? AND m.recipient_id = ?) 
            OR (m.sender_id = ? AND m.recipient_id = ?)
         ORDER BY m.created_at ASC`,
        [user1Id, user2Id, user2Id, user1Id]
      );
      return messages;
    } catch (error) {
      throw error;
    }
  }

    static async getAvailableUsers(currentUserId, query) {
      try {
    let sql = `SELECT id, name, company, company AS businessName, email, role FROM users WHERE id != ? AND status != 'suspended'`;
        const params = [currentUserId];
        if (query) {
          sql += ` AND (name LIKE ? OR email LIKE ? OR company LIKE ?)`;
          const like = `%${query}%`;
          params.push(like, like, like);
        }
        sql += ` ORDER BY name LIMIT 100`;
        const [rows] = await pool.execute(sql, params);
        return rows;
      } catch (error) {
        throw error;
      }
    }

    static async getUserById(userId) {
      try {
        const [rows] = await pool.execute(
          'SELECT id, name, company, email, role, status FROM users WHERE id = ?',
          [userId]
        );
        return rows[0] || null;
      } catch (error) {
        throw error;
      }
    }
}

module.exports.MessageModel = MessageModel;
