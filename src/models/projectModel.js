const { pool } = require("../config/db");

// Update a project
module.exports.updateProject = async (id, updates) => {
  try {
    const { name, description, startDate, endDate, status, progress } = updates;
    const values = [];
    const setClauses = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    
    if (description !== undefined) {
      setClauses.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    
    if (startDate !== undefined) {
      setClauses.push(`start_date = $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }
    
    if (endDate !== undefined) {
      setClauses.push(`end_date = $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }
    
    if (status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (progress !== undefined) {
      setClauses.push(`progress = $${paramIndex}`);
      values.push(progress);
      paramIndex++;
    }
    
    if (setClauses.length === 0) {
      return null;
    }
    
    values.push(id);
    const updateResult = await pool.query(
      `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    if (updateResult.rowCount === 0) {
      return null;
    }

    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error("❌ Database error updating project:", error);
    throw error;
  }
};

// Delete a project
module.exports.deleteProject = async (id) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First delete any project-retailer associations
      await client.query('DELETE FROM project_retailers WHERE project_id = $1', [id]);
      
      // Then delete the project itself
      const result = await client.query('DELETE FROM projects WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database error deleting project:", error);
    throw error;
  }
};

// Assign retailers to a project
module.exports.assignRetailersToProject = async (projectId, retailerIds) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Bulk insert with ON CONFLICT for duplicates
      const placeholders = retailerIds
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      
      const values = [projectId, ...retailerIds];
      
      await client.query(
        `INSERT INTO project_retailers (project_id, retailer_id) 
         VALUES ${placeholders}
         ON CONFLICT (project_id, retailer_id) DO UPDATE SET assigned_at = CURRENT_TIMESTAMP`,
        values
      );
      
      // Update the project's assigned_retailers count
      await client.query(
        `UPDATE projects SET assigned_retailers = 
         (SELECT COUNT(*) FROM project_retailers WHERE project_id = $1) 
         WHERE id = $1`,
        [projectId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database error assigning retailers:", error);
    throw error;
  }
};

// Remove a retailer from a project
module.exports.removeRetailerFromProject = async (projectId, retailerId) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Remove the assignment
      await client.query(
        'DELETE FROM project_retailers WHERE project_id = $1 AND retailer_id = $2',
        [projectId, retailerId]
      );
      
      // Update the project's assigned_retailers count
      await client.query(
        `UPDATE projects SET assigned_retailers = 
         (SELECT COUNT(*) FROM project_retailers WHERE project_id = $1) 
         WHERE id = $1`,
        [projectId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database error removing retailer:", error);
    throw error;
  }
};

// Get retailers assigned to a project
module.exports.getProjectRetailers = async (projectId) => {
  try {
    const result = await pool.query(
      `SELECT r.*, pr.assigned_at
       FROM retailers r
       INNER JOIN project_retailers pr ON r.id = pr.retailer_id
       WHERE pr.project_id = $1
       ORDER BY pr.assigned_at DESC`,
      [projectId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ Database error fetching project retailers:", error);
    throw error;
  }
};

// Fetch all projects
module.exports.getAllProjects = async () => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    return result.rows;
  } catch (error) {
    console.error("❌ Database error fetching projects:", error);
    throw error;
  }
};

// Add a new project
module.exports.addProject = async (name, description, startDate, endDate, userId) => {
  try {
    console.log('Creating project with:', { name, description, startDate, endDate, userId });
    
    const result = await pool.query(
      `INSERT INTO projects (name, description, start_date, end_date, user_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, startDate, endDate, userId, 'ongoing']
    );

    console.log('Project created successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Database error adding project:", {
      error: error.message,
      code: error.code,
      detail: error.detail,
      sql: error.sql
    });
    throw error;
  }
};
