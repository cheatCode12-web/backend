const mysql = require('mysql2/promise');

async function insertSampleData() {
  let conn;
  try {
    conn = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'bailord_dev' });

    // Insert retailers (columns match your current schema)
    await conn.query(
      "INSERT INTO retailers (name, email, phone, street_address, city, state, zip_code, country, business_name, business_type, registration_number, status, joined_date, bank_name, account_number, account_name, total_sales, total_orders, average_rating) VALUES " +
      "('TechMart', 'john@techmart.com', '555-0101', '12 Tech St', 'Lagos', 'Lagos', '100001', 'Nigeria', 'TechMart Ltd', 'Electronics', 'REG-1001', 'active', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 6 MONTH), 'First Bank', '0123456789', 'TechMart Ltd', 15000.00, 150, 4.5)," +
      "('FreshFoods', 'mary@freshfoods.com', '555-0102', '34 Market Rd', 'Ikeja', 'Lagos', '100002', 'Nigeria', 'FreshFoods Ltd', 'Grocery', 'REG-1002', 'active', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MONTH), 'GTBank', '9876543210', 'FreshFoods Ltd', 25000.00, 300, 4.8)," +
      "('StyleHub', 'david@stylehub.com', '555-0103', '56 Fashion Ave', 'Victoria Island', 'Lagos', '100003', 'Nigeria', 'StyleHub Ltd', 'Fashion', 'REG-1003', 'active', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 MONTH), 'Access Bank', '1231231234', 'StyleHub Ltd', 18000.00, 200, 4.2)," +
      "('HomeDecor', 'sarah@homedecor.com', '555-0104', '78 Home St', 'Lekki', 'Lagos', '100004', 'Nigeria', 'HomeDecor Ltd', 'Other', 'REG-1004', 'active', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 MONTH), 'Zenith Bank', '5556667778', 'HomeDecor Ltd', 12000.00, 100, 4.6)," +
      "('SportZone', 'mike@sportzone.com', '555-0105', '90 Sport Ln', 'Surulere', 'Lagos', '100005', 'Nigeria', 'SportZone Ltd', 'Other', 'REG-1005', 'active', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 MONTH), 'UBA', '4443332221', 'SportZone Ltd', 16000.00, 175, 4.4)"
    );

    // Insert projects
    await conn.query(
      "INSERT INTO projects (name, description, status, start_date, end_date, progress, user_id) VALUES " +
      "('Q1 Sales Campaign', 'Quarterly sales initiative', 'completed', DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 100, 1)," +
      "('Summer Promotion', 'Summer season promotional campaign', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 60, 1)," +
      "('Holiday Planning', 'Holiday season preparation', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH), 40, 1)," +
      "('Inventory Optimization', 'Stock management improvement project', 'delayed', DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 30, 1)," +
      "('Customer Loyalty Program', 'Loyalty rewards system implementation', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH), 20, 1)"
    );

    // Link some projects with retailers
    await conn.query(
      "INSERT INTO project_retailers (project_id, retailer_id) " +
      "SELECT p.id, r.id FROM projects p CROSS JOIN retailers r WHERE p.id <= 5 AND r.id <= 5 LIMIT 10"
    );

    const [retailersCount] = await conn.query('SELECT COUNT(*) as c FROM retailers');
    const [projectsCount] = await conn.query('SELECT COUNT(*) as c FROM projects');
    const [linksCount] = await conn.query('SELECT COUNT(*) as c FROM project_retailers');

    console.log('✅ Sample data inserted');
    console.log('Retailers:', retailersCount[0].c);
    console.log('Projects:', projectsCount[0].c);
    console.log('Project-Retailer links:', linksCount[0].c);

    await conn.end();
  } catch (err) {
    console.error('❌ Error inserting sample data:', err.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

insertSampleData();
