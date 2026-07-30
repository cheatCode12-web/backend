const { pool } = require('./config/db');

async function fixProjectsTable() {
    try {
        console.log('Checking projects table...');
        
        // 1. Check if table exists
        const [tables] = await pool.query('SHOW TABLES LIKE "projects"');
        if (tables.length === 0) {
            console.log('Creating projects table...');
            await pool.query(`
                CREATE TABLE projects (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    user_id INT,
                    start_date DATE,
                    end_date DATE,
                    status ENUM('ongoing', 'completed', 'delayed') DEFAULT 'ongoing',
                    progress INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);
        } else {
            console.log('Projects table exists, checking columns...');
            
            // 2. Add missing columns if they don't exist
            const alterCommands = [
                'ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INT AFTER description',
                'ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE AFTER user_id',
                'ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE AFTER start_date',
                'ALTER TABLE projects ADD COLUMN IF NOT EXISTS status ENUM("ongoing", "completed", "delayed") DEFAULT "ongoing" AFTER end_date',
                'ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 AFTER status'
            ];
            
            for (const sql of alterCommands) {
                try {
                    await pool.query(sql);
                    console.log('✅ Executed:', sql);
                } catch (e) {
                    console.error('❌ Failed:', sql, e);
                }
            }
            
            // 3. Add foreign key if it doesn't exist
            try {
                await pool.query(`
                    ALTER TABLE projects
                    ADD CONSTRAINT fk_project_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                `);
                console.log('✅ Added foreign key constraint');
            } catch (e) {
                if (!e.message.includes('Duplicate')) {
                    console.error('❌ Failed to add foreign key:', e);
                }
            }
        }

        // 4. Verify structure
        const [columns] = await pool.query('DESCRIBE projects');
        console.log('\nFinal table structure:');
        columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await pool.end();
    }
}

console.log('Starting database update...');
fixProjectsTable();