const mysql = require('mysql2/promise');
require('dotenv').config();

dotenv.config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        console.log('Running add_progress_column migration...');
        
        // Add progress column to projects table
        await connection.query(`
            ALTER TABLE projects
            ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0
        `);
        
        console.log('✅ Migration completed successfully');
        
        // Verify the column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM projects LIKE 'progress'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Verified: progress column exists in projects table');
        } else {
            console.log('❌ Warning: progress column was not found after migration');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runMigration();