const { pool } = require("../config/db"); // Import the PostgreSQL connection pool

// 🔹 Create a new user
module.exports.createUser = async (name, email, hashedPassword) => {
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
    [name, email, hashedPassword]
  );
  return result.rows[0].id; // Return the new user's ID
};

// 🔹 Find a user by email (for login)
module.exports.findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0]; // Return first match
};

// 🔹 Find a user by ID (for token verification)
module.exports.findUserById = async (id) => {
  const result = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [id]);
  return result.rows[0];
};

// 🔹 Get all users (optional)
module.exports.getAllUsers = async () => {
  const result = await pool.query("SELECT id, name, email, created_at FROM users");
  return result.rows;
};
