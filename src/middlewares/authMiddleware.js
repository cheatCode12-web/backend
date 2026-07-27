const jwt = require("jsonwebtoken");

const { TokenService } = require("../services/tokenService");

module.exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    console.log('[AUTH_MIDDLEWARE] Token verification:', {
      hasToken: !!token,
      endpoint: req.path
    });

    if (!token) {
      console.log('[AUTH_MIDDLEWARE] No token provided for protected route:', req.path);
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenService.isBlacklisted(token);
    if (isBlacklisted) {
      console.log('[AUTH_MIDDLEWARE] Token is blacklisted');
      return res.status(401).json({ 
        message: "Token has been revoked",
        code: "TOKEN_REVOKED"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[AUTH_MIDDLEWARE] ✅ Token verified for user:', decoded.id);
      
      // Check token expiration with buffer time (1 minute)
      const bufferTime = 60; // 1 minute in seconds
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Only check expiration for non-refresh-token requests
      if (!req.originalUrl.includes('/auth/refresh')) {
        if (decoded.exp - currentTime < bufferTime) {
          console.log('[AUTH_MIDDLEWARE] Token expiring soon for user:', decoded.id);
          return res.status(401).json({ 
            message: "Token near expiration",
            code: "TOKEN_EXPIRING"
          });
        }
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('[AUTH_MIDDLEWARE] Token expired');
        return res.status(401).json({ 
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      console.error('[AUTH_MIDDLEWARE] Token verification failed:', error.message);
      throw error;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
