const { pool } = require("../config/db");

// Update a project
module.exports.updateProject = async (id, updates) => {
  try {
    const { name, description, startDate, endDate, status, progress } = updates;
    const values = [];
    const setClauses = [];
    
    if (name !== undefined) {
      setClauses.push('name = ?');
      values.push(name);
    }
    
    if (description !== undefined) {
      setClauses.push('description = ?');
      values.push(description);
    }
    
    if (startDate !== undefined) {
      setClauses.push('start_date = ?');
      values.push(startDate);
    }
    
    if (endDate !== undefined) {
      setClauses.push('end_date = ?');
      values.push(endDate);
    }
    
    if (status !== undefined) {
      setClauses.push('status = ?');
      values.push(status);
    }
    
    if (progress !== undefined) {
      setClauses.push('progress = ?');
      values.push(progress);
    }
    
    if (setClauses.length === 0) {
      return null;
    }
    
    values.push(id);
    const [result] = await pool.query(
      `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return null;
    }

    const [updatedProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    
    return updatedProject[0];
  } catch (error) {
    console.error("❌ Database error updating project:", error);
    throw error;
  }
};

// Delete a project
module.exports.deleteProject = async (id) => {
  try {
    // First delete any project-retailer associations
    await pool.query('DELETE FROM project_retailers WHERE project_id = ?', [id]);
    
    // Then delete the project itself
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ Database error deleting project:", error);
    throw error;
  }
};

// Assign retailers to a project
module.exports.assignRetailersToProject = async (projectId, retailerIds) => {
  try {
    // Start a transaction
    await pool.query('START TRANSACTION');
    
    // Prepare the values for bulk insert
    const values = retailerIds.map(retailerId => [projectId, retailerId]);
    
    // Bulk insert the assignments
    await pool.query(
      'INSERT INTO project_retailers (project_id, retailer_id) VALUES ? ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
      [values]
    );
    
    // Update the project's assigned_retailers count
    await pool.query(
      'UPDATE projects p SET assigned_retailers = (SELECT COUNT(*) FROM project_retailers WHERE project_id = ?) WHERE id = ?',
      [projectId, projectId]
    );
    
    // Commit the transaction
    await pool.query('COMMIT');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error("❌ Database error assigning retailers:", error);
    throw error;
  }
};

// Remove a retailer from a project
module.exports.removeRetailerFromProject = async (projectId, retailerId) => {
  try {
    // Start a transaction
    await pool.query('START TRANSACTION');
    
    // Remove the assignment
    await pool.query(
      'DELETE FROM project_retailers WHERE project_id = ? AND retailer_id = ?',
      [projectId, retailerId]
    );
    
    // Update the project's assigned_retailers count
    await pool.query(
      'UPDATE projects p SET assigned_retailers = (SELECT COUNT(*) FROM project_retailers WHERE project_id = ?) WHERE id = ?',
      [projectId, projectId]
    );
    
    // Commit the transaction
    await pool.query('COMMIT');
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error("❌ Database error removing retailer:", error);
    throw error;
  }
};

// Get retailers assigned to a project
module.exports.getProjectRetailers = async (projectId) => {
  try {
    const [retailers] = await pool.query(
      `SELECT r.*, pr.assigned_at
       FROM retailers r
       INNER JOIN project_retailers pr ON r.id = pr.retailer_id
       WHERE pr.project_id = ?
       ORDER BY pr.assigned_at DESC`,
      [projectId]
    );
    return retailers;
  } catch (error) {
    console.error("❌ Database error fetching project retailers:", error);
    throw error;
  }
};

// Fetch all projects
module.exports.getAllProjects = async () => {
  try {
    const [rows] = await pool.query("SELECT * FROM projects");
    return rows;
  } catch (error) {
    console.error("❌ Database error fetching projects:", error);
    throw error;
  }
};

// Add a new project
module.exports.addProject = async (name, description, startDate, endDate, userId) => {
  try {
    console.log('Creating project with:', { name, description, startDate, endDate, userId });
    
    // Debug: Check table structure
    const [columns] = await pool.query('DESCRIBE projects');
    console.log('Table columns:', columns.map(c => c.Field));
    
    // Debug: Check if user exists
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    console.log('Found user?', users.length > 0, 'User ID:', userId);
    
    const [result] = await pool.query(
      "INSERT INTO projects (name, description, start_date, end_date, user_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, startDate, endDate, userId, 'ongoing']
    );

    console.log('Project created successfully (insert):', result);

    // Fetch the inserted row to return a canonical representation
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    if (rows && rows.length > 0) {
      return rows[0];
    }

    // Fallback: return a constructed object if select didn't return anything
    return {
      id: result.insertId,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      user_id: userId,
      status: 'ongoing',
      progress: 0,
      assigned_retailers: 0
    };
  } catch (error) {
    console.error("❌ Database error adding project:", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    // Re-throw so callers (controllers) can handle the error and send proper responses
    throw error;
  }
};
