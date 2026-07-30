const { pool } = require("../config/db");
const { safeEnsureMessageSchema } = require("../db/schemaGuard");

class MessageModel {
  static async create(senderId, recipientId, content) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      "INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING id",
      [senderId, recipientId, content]
    );
    return result.rows[0].id;
  }

  static async getMessagesForUser(userId) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      `SELECT m.*,
       u1.name AS sender_name,
       u2.name AS recipient_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.recipient_id = u2.id
       WHERE m.sender_id = $1 OR m.recipient_id = $2
       ORDER BY m.created_at DESC`,
      [userId, userId]
    );
    return result.rows;
  }

  static async markAsRead(messageId, userId) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      "UPDATE messages SET is_read = TRUE WHERE id = $1 AND recipient_id = $2",
      [messageId, userId]
    );
    return result.rowCount > 0;
  }

  static async getUnreadCount(userId) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      "SELECT COUNT(*) AS count FROM messages WHERE recipient_id = $1 AND is_read = FALSE",
      [userId]
    );
    return result.rows[0].count;
  }

  static async getConversations(userId) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      `WITH LastMessages AS (
        SELECT
          CASE
            WHEN sender_id = $1 THEN recipient_id
            ELSE sender_id
          END AS other_user_id,
          m.content,
          m.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY
              CASE
                WHEN sender_id = $1 THEN recipient_id
                ELSE sender_id
              END
            ORDER BY created_at DESC
          ) AS rn
        FROM messages m
        WHERE sender_id = $1 OR recipient_id = $1
      )
      SELECT
        u.id,
        u.name,
        u.company,
        lm.content AS last_message,
        lm.created_at AS last_message_time,
        COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.recipient_id = $1 THEN m.id END) AS unread_count
      FROM users u
      INNER JOIN LastMessages lm ON u.id = lm.other_user_id AND lm.rn = 1
      LEFT JOIN messages m ON m.sender_id = u.id AND m.recipient_id = $1 AND m.is_read = FALSE
      WHERE u.id IN (
        SELECT DISTINCT
          CASE
            WHEN sender_id = $1 THEN recipient_id
            ELSE sender_id
          END
        FROM messages
        WHERE sender_id = $1 OR recipient_id = $1
      )
      GROUP BY u.id, u.name, u.company, lm.content, lm.created_at
      ORDER BY lm.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getConversationMessages(user1Id, user2Id) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      `SELECT m.*,
       u1.name AS sender_name,
       u2.name AS recipient_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.recipient_id = u2.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $3 AND m.recipient_id = $4)
       ORDER BY m.created_at ASC`,
      [user1Id, user2Id, user2Id, user1Id]
    );
    return result.rows;
  }

  static async getAvailableUsers(currentUserId, query) {
    await safeEnsureMessageSchema();

    let sql =
      "SELECT id, name, company, company AS businessName, email, role FROM users WHERE id != $1 AND status != 'suspended'";
    const params = [currentUserId];
    let paramIndex = 2;

    if (query) {
      sql += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR company ILIKE $${paramIndex + 2})`;
      const like = `%${query}%`;
      params.push(like, like, like);
    }

    sql += " ORDER BY name LIMIT 100";
    const result = await pool.query(sql, params);
    return result.rows;
  }

  static async getUserById(userId) {
    await safeEnsureMessageSchema();
    const result = await pool.query(
      "SELECT id, name, company, email, role, status FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports.MessageModel = MessageModel;
