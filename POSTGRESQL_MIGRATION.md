# MySQL to PostgreSQL Migration Guide

## ✅ Migration Status: COMPLETE

This document outlines the completed migration from MySQL to PostgreSQL for the Bailord Backend application.

---

## What Was Changed

### 1. **Database Driver** (package.json)
- **Removed:** `mysql2` v3.15.3
- **Added:** `pg` v8.11.3
- Run `npm install` to update dependencies

### 2. **Database Configuration** (src/config/db.js)
- Changed from MySQL connection pool to PostgreSQL pool
- Updated default port: `3306` → `5432`
- Updated connection parameters to use PostgreSQL `Pool` API
- Connection pooling settings adjusted for PostgreSQL

### 3. **Query Syntax Updates** (All Model Files)

#### Files Updated:
- `src/models/userModel.js` - User authentication & queries
- `src/models/projectModel.js` - Project CRUD with transactions
- `src/models/messageModel.js` - Messaging system
- `src/models/retailerQueries.js` - Retailer query templates
- `src/services/tokenService.js` - Token management

#### Key Syntax Changes:
| MySQL | PostgreSQL | Example |
|-------|-----------|---------|
| `?` placeholders | `$1, $2, ...` | `SELECT * FROM users WHERE id = $1` |
| `.insertId` | `.rows[0].id` with `RETURNING` | `INSERT ... RETURNING id` |
| `[rows]` destructuring | `.rows` array | `result.rows[0]` instead of `rows[0]` |
| `affectedRows` | `rowCount` | `result.rowCount > 0` |
| `pool.execute()` | `pool.query()` | Same method name, same syntax |
| `START TRANSACTION` | `BEGIN` | PostgreSQL transaction syntax |
| `UUID()` | `gen_random_uuid()` | Automatic in column default |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT ... DO UPDATE` | PostgreSQL upsert |
| `LIKE` | `ILIKE` | Case-insensitive search (PostgreSQL) |

### 4. **Database Schema** (src/config/schema-postgres.sql)

#### New/Updated Elements:
- **ENUM Types:** `user_role`, `user_status`, `project_status`, `retailer_status`, `retailer_business_type`
- **Users Table:** Added `refresh_token`, `last_token_refresh`, `company`, `status` columns
- **Projects Table:** Added `assigned_retailers` counter
- **Retailers Table:** Completely redesigned with UUID primary key, detailed fields, metrics
- **Indexes:** Optimized for performance queries
- **Cascading Deletes:** `ON DELETE CASCADE` for referential integrity

### 5. **Database Initialization** (src/db/db-init.js)
- Updated to use PostgreSQL `pg` library
- Reads schema from `schema-postgres.sql`
- Creates admin user with default credentials
- Uses `ON CONFLICT` for upsert

### 6. **Render Configuration** (render.yaml)
- Added `PORT` environment variable: `3000`
- Changed `DB_PORT` from `3306` to `5432`
- Environment variables now properly scoped as `secret`

---

## 🚀 Deployment Steps

### For Render Deployment:

1. **Create Render PostgreSQL Database**
   - Go to [render.com](https://render.com)
   - Create a new "PostgreSQL" database
   - Note the connection details:
     - `DB_HOST` (external hostname)
     - `DB_USER` (default: postgres)
     - `DB_PASSWORD` (generated password)
     - `DB_NAME` (database name)

2. **Create Render Web Service**
   - Select "New" → "Web Service"
   - Connect your GitHub repository (backend folder)
   - Use buildCommand: `npm ci`
   - Use startCommand: `npm start`
   - Set environment variables from PostgreSQL credentials:

   | Key | Value | Source |
   |-----|-------|--------|
   | `NODE_ENV` | `production` | Set to production |
   | `PORT` | `3000` | Set to 3000 |
   | `DB_HOST` | PostgreSQL hostname | From Render DB |
   | `DB_PORT` | `5432` | PostgreSQL default |
   | `DB_USER` | PostgreSQL username | From Render DB |
   | `DB_PASSWORD` | PostgreSQL password | From Render DB |
   | `DB_NAME` | Database name | From Render DB |
   | `JWT_SECRET` | [Generate random string] | Create a secure key |
   | `JWT_REFRESH_SECRET` | [Generate random string] | Create a secure key |
   | `FRONTEND_URL` | Your Netlify URL | Your frontend domain |

3. **Initialize Database Schema**
   - After web service deploys, run the initialization script:
   ```bash
   # Via Render dashboard: create a one-off job
   node src/db/db-init.js
   ```
   - Or manually execute schema file in PostgreSQL console

4. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Migrate from MySQL to PostgreSQL"
   git push origin main
   ```

---

## 🧪 Local Testing

### Prerequisites:
- PostgreSQL installed locally
- Node.js 18.20.8 or compatible

### Setup:
```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file with local PostgreSQL credentials
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=bailord_dev
JWT_SECRET=test-secret-123
JWT_REFRESH_SECRET=test-refresh-456
NODE_ENV=development
EOF

# 3. Initialize database
node src/db/db-init.js

# 4. Start server
npm start
```

The server should now be accessible at `http://localhost:5000` (or port from .env)

---

## ⚠️ Breaking Changes & Considerations

1. **Identifier Syntax**
   - PostgreSQL uses `user_id` consistently (snake_case)
   - Ensure all references match schema (check controllers)

2. **Default Values**
   - `CURRENT_TIMESTAMP` works in both, but PostgreSQL uses `CURRENT_TIMESTAMP` not `NOW()`

3. **JSON Handling**
   - If you use JSON columns later, PostgreSQL has native `JSONB` type (better than MySQL JSON)

4. **UUID vs INT**
   - Retailers now use UUID primary keys
   - Legacy systems with INT IDs in retailers may need data migration

5. **Case Sensitivity**
   - PostgreSQL identifiers are case-sensitive (quoted) vs MySQL (not)
   - All identifiers in schema are lowercase for consistency

---

## 📋 Files Modified

- ✅ `backend/package.json`
- ✅ `backend/render.yaml`
- ✅ `backend/src/config/db.js`
- ✅ `backend/src/config/schema-postgres.sql`
- ✅ `backend/src/db/db-init.js`
- ✅ `backend/src/models/userModel.js`
- ✅ `backend/src/models/projectModel.js`
- ✅ `backend/src/models/messageModel.js`
- ✅ `backend/src/models/retailerQueries.js`
- ✅ `backend/src/services/tokenService.js`

---

## 🔄 Rollback (If Needed)

If you need to revert to MySQL:
1. Revert `package.json` to use `mysql2`
2. Revert db.js config to MySQL
3. Restore model files from git history
4. Use MySQL schema file instead of PostgreSQL

---

## 📞 Support

If you encounter issues:
1. Check PostgreSQL error logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure database schema was initialized with `db-init.js`
4. Check that JWT secrets are not empty

For detailed PostgreSQL documentation: https://www.postgresql.org/docs/
