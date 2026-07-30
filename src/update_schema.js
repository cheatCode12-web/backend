const { pool } = require('./config/db');
const { readFileSync } = require('fs');
const path = require('path');

async function updateSchema() {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'config', 'update_projects.sql');
        const sql = readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Successfully updated projects table schema');
        
        // Verify the columns exist
        const [columns] = await pool.query('DESCRIBE projects');
        console.log('\nProjects table columns:');
        columns.forEach(col => console.log(`- ${col.Field}`));
        
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        // Close the connection
        await pool.end();
    }
}

updateSchema();