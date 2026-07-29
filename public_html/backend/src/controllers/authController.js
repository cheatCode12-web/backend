const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { TokenService } = require("../services/tokenService");

// ✅ Helper functions to generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

// ✅ Register new user
module.exports.registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      type,
      businessName,
      phone,
      address,
      description 
    } = req.body;

    // Log incoming request for debugging
    console.log('[REGISTER] Incoming request:', { name, email, type, phone: phone ? '***' : undefined });

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Check if user exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine user role and status
    const role = type === 'retailer' ? 'retailer' : 'staff';
    const status = type === 'retailer' ? 'pending' : 'active';

    // Insert user with retailer fields if applicable
    const userFields = ['name', 'email', 'password', 'role', 'status'];
    const userValues = [name, email, hashedPassword, role, status];
    const placeholders = '?, ?, ?, ?, ?';

    if (type === 'retailer') {
      userFields.push('company', 'phone', 'address', 'description');
      userValues.push(businessName, phone, address, description);
      placeholders += ', ?, ?, ?, ?';
    }

    await pool.query(
      `INSERT INTO users (${userFields.join(', ')}) VALUES (${placeholders})`,
      userValues
    );

    const [userRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];

    console.log('[REGISTER] User created:', { id: user.id, name: user.name, email: user.email, role: user.role });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database (safe)
    try {
      await TokenService.updateRefreshToken(user.id, refreshToken);
    } catch (err) {
      console.error('[REGISTER] TokenService failed:', err.message || err);
    }

    const response = {
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    console.log('[REGISTER] ✅ Success - sending response for user:', user.id);

    res.status(201).json(response);
  } catch (error) {
    console.error("❌ Registration error:", error);
    console.error('[REGISTER] ERROR - environment vars:', {
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
      DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING'
    });
    res.status(500).json({
      message: "Server error",
      accessToken: null,
      refreshToken: null,
      user: null,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Login user
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log incoming request for debugging
    console.log('[LOGIN] Incoming request:', { email, password: password ? '***' : undefined });
    console.log('[LOGIN] Environment check:', {
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      JWT_REFRESH_SECRET_SET: !!process.env.JWT_REFRESH_SECRET,
      DB_HOST: process.env.DB_HOST
    });

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('[LOGIN] User found:', { id: user.id, name: user.name, email: user.email });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[LOGIN] Password mismatch for user:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('[LOGIN] Password verified, generating tokens...');
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database (safe)
    try {
      await TokenService.updateRefreshToken(user.id, refreshToken);
    } catch (err) {
      console.error('[LOGIN] TokenService failed:', err.message || err);
    }

    const response = {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      },
    };

    console.log('[LOGIN] ✅ Success - sending response:', {
      hasAccessToken: !!response.accessToken,
      hasRefreshToken: !!response.refreshToken,
      userId: response.user.id,
      userRole: response.user.role
    });

    res.json(response);
  } catch (error) {
    console.error("❌ Login error:", error.message);
    console.error("Stack:", error.stack);
    console.error('[LOGIN] ERROR - environment vars:', {
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
      DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
      DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING'
    });
    res.status(500).json({ 
      message: "Server error",
      accessToken: null,
      refreshToken: null,
      user: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      env: {
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
        DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING'
      }
    });
  }
};

// ✅ Get user profile (protected route)
module.exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[PROFILE] Fetching profile for user:', userId);
    
    const [rows] = await pool.query(
      "SELECT id, name, email, role, company, phone, address, description, status FROM users WHERE id = ?",
      [userId]
    );
    const user = rows[0];
    
    if (!user) {
      console.log('[PROFILE] User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('[PROFILE] ✅ Profile found:', { id: user.id, email: user.email, role: user.role });
    res.json(user);
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ✅ Update user profile (protected route)
module.exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, email, role, phone, company, address, description } = req.body;

    // Build dynamic update statement
    const fields = [];
    const values = [];
    if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
    if (typeof email !== 'undefined') { fields.push('email = ?'); values.push(email); }
    if (typeof role !== 'undefined') { fields.push('role = ?'); values.push(role); }
    if (typeof phone !== 'undefined') { fields.push('phone = ?'); values.push(phone); }
    if (typeof company !== 'undefined') { fields.push('company = ?'); values.push(company); }
    if (typeof address !== 'undefined') { fields.push('address = ?'); values.push(address); }
    if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update' });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, values);

    const [rows] = await pool.query('SELECT id, name, email, role, company, phone, address, description FROM users WHERE id = ?', [userId]);
    const updated = rows[0];

    res.json(updated);
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// ✅ Invalidate user's tokens
module.exports.invalidateToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.headers.authorization?.split(" ")[1];

    if (!currentToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Get token expiry by decoding (without verification)
    const decodedToken = jwt.decode(currentToken);
    if (!decodedToken?.exp) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    // Add current token to blacklist
    await TokenService.blacklist(
      currentToken,
      userId,
      new Date(decodedToken.exp * 1000)
    );

    // Invalidate all user tokens (including refresh tokens)
    await TokenService.invalidateAllUserTokens(userId);

    res.json({ message: "Tokens invalidated successfully" });
  } catch (error) {
    console.error("❌ Token invalidation error:", error);
    res.status(500).json({ message: "Failed to invalidate tokens" });
  }
};

// ✅ Refresh access token using refresh token
module.exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    console.log('[REFRESH] Refresh token request received');

    if (!refreshToken) {
      console.log('[REFRESH] No refresh token provided');
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log('[REFRESH] Token verified for user:', decoded.id);
    
    // Check if refresh token exists in database
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.id, refreshToken]
    );
    
    if (!rows[0]) {
      console.log('[REFRESH] Stored refresh token mismatch for user:', decoded.id);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    console.log('[REFRESH] Valid refresh token found, generating new access token');

    // Generate new access token
    const accessToken = generateAccessToken(decoded.id);
    
    const response = {
      accessToken,
      message: "Token refreshed successfully"
    };

    console.log('[REFRESH] ✅ New access token generated for user:', decoded.id);
    res.json(response);
  } catch (error) {
    console.error("❌ Token refresh error:", error.message);
    console.error('[REFRESH] Error details:', {
      JWT_REFRESH_SECRET_SET: !!process.env.JWT_REFRESH_SECRET,
      errorName: error.name
    });
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
