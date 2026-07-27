const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "bailord_dev",
});

async function setupDatabase() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'retailer') DEFAULT 'staff',
        status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'active',
        refresh_token VARCHAR(512),
        last_token_refresh TIMESTAMP NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table created");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS retailers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        performance INT DEFAULT 0,
        business_type VARCHAR(50),
        total_orders INT DEFAULT 0,
        total_sales DECIMAL(10,2) DEFAULT 0.00,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        joined_date DATE DEFAULT (CURRENT_DATE),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Retailers table created");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('ongoing', 'completed', 'delayed') DEFAULT 'ongoing',
        start_date DATE,
        end_date DATE,
        progress INT DEFAULT 0,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("Projects table created");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_retailers (
        project_id INT,
        retailer_id INT,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, retailer_id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (retailer_id) REFERENCES retailers(id)
      )
    `);
    console.log("Project-retailers table created");

    const adminPassword = await bcrypt.hash("password123", 10);
    const staffPassword = await bcrypt.hash("password123", 10);

    await conn.query(
      `
        INSERT INTO users (name, email, password, role, status) VALUES
        (?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?)
      `,
      [
        "Admin User",
        "admin@bailord.com",
        adminPassword,
        "admin",
        "active",
        "Staff User",
        "staff@bailord.com",
        staffPassword,
        "staff",
        "active",
      ]
    );

    await conn.query(`
      INSERT INTO retailers (
        name, contact_person, email, phone, status,
        business_type, total_orders, total_sales, average_rating, joined_date
      ) VALUES
      ('TechMart', 'John Smith', 'john@techmart.com', '555-0101', 'active',
       'Electronics', 150, 15000.00, 4.5, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)),
      ('FreshFoods', 'Mary Johnson', 'mary@freshfoods.com', '555-0102', 'active',
       'Grocery', 300, 25000.00, 4.8, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)),
      ('StyleHub', 'David Lee', 'david@stylehub.com', '555-0103', 'active',
       'Fashion', 200, 18000.00, 4.2, DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH))
    `);

    await conn.query(`
      INSERT INTO projects (
        name, description, status, start_date, end_date, progress, user_id
      ) VALUES
      ('Q1 Sales Campaign', 'Quarterly sales initiative', 'completed',
       DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH),
       100, 1),
      ('Summer Promotion', 'Summer season promotional campaign', 'ongoing',
       DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH),
       60, 1),
      ('Holiday Planning', 'Holiday season preparation', 'ongoing',
       DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH),
       40, 2)
    `);

    await conn.query(`
      INSERT INTO project_retailers (project_id, retailer_id)
      SELECT p.id, r.id
      FROM projects p
      CROSS JOIN retailers r
      WHERE p.id <= 3 AND r.id <= 3
      LIMIT 6
    `);

    console.log("Sample data inserted");
  } catch (error) {
    console.error("Setup database error:", error.message);
    throw error;
  } finally {
    conn.release();
    process.exit();
  }
}

setupDatabase();
