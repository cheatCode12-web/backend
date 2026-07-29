const { 
  getAllProjects, 
  addProject, 
  updateProject: updateProjectModel,
  deleteProject: deleteProjectModel,
  assignRetailersToProject,
  removeRetailerFromProject,
  getProjectRetailers
} = require("../models/projectModel");
// Update a project
module.exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, status, progress } = req.body;

    // Validate status if provided
    if (status && !['ongoing', 'completed', 'delayed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Validate progress if provided
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }

    const updatedProject = await updateProjectModel(id, {
      name,
      description,
      startDate,
      endDate,
      status,
      progress
    });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    console.error("❌ Error updating project:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: error.stack
    });
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      message: isDev ? `Server error: ${error.message}` : 'Server error updating project',
      details: isDev ? error.sqlMessage : undefined
    });
  }
};

// Delete a project
module.exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProjectModel(id);

    if (!result) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({ message: "Server error deleting project" });
  }
};

// Assign retailers to a project
module.exports.assignRetailers = async (req, res) => {
  try {
    const { id } = req.params;
    const { retailerIds } = req.body;

    if (!Array.isArray(retailerIds) || retailerIds.length === 0) {
      return res.status(400).json({ message: "Retailer IDs array is required" });
    }

    await assignRetailersToProject(id, retailerIds);
    res.status(200).json({ message: "Retailers assigned successfully" });
  } catch (error) {
    console.error("❌ Error assigning retailers:", error);
    res.status(500).json({ message: "Server error assigning retailers to project" });
  }
};

// Remove a retailer from a project
module.exports.removeRetailer = async (req, res) => {
  try {
    const { projectId, retailerId } = req.params;
    
    await removeRetailerFromProject(projectId, retailerId);
    res.status(200).json({ message: "Retailer removed from project successfully" });
  } catch (error) {
    console.error("❌ Error removing retailer:", error);
    res.status(500).json({ message: "Server error removing retailer from project" });
  }
};

// Get retailers assigned to a project
module.exports.getAssignedRetailers = async (req, res) => {
  try {
    const { id } = req.params;
    const retailers = await getProjectRetailers(id);
    res.status(200).json(retailers);
  } catch (error) {
    console.error("❌ Error fetching project retailers:", error);
    res.status(500).json({ message: "Server error fetching project retailers" });
  }
};

// Get all projects
module.exports.getProjects = async (req, res) => {
  try {
    const { search, status } = req.query;
    const searchTerm = typeof search === "string" ? search.trim().toLowerCase() : "";
    const projects = await getAllProjects();
    const filteredProjects = projects.filter((project) => {
      const matchesStatus = status ? project.status === status : true;
      const matchesSearch = searchTerm
        ? [project.name, project.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchTerm))
        : true;

      return matchesStatus && matchesSearch;
    });

    res.status(200).json(filteredProjects);
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ message: "Server error fetching projects" });
  }
};

// Create a new project
module.exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({ message: "Name, description, start date, and end date are required" });
    }

    // Enforce authentication (route should be protected, but double-check)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required to create a project" });
    }

    // Basic length/sanitization checks
    if (typeof name === 'string' && name.length > 255) {
      return res.status(400).json({ message: "Name must be 255 characters or fewer" });
    }
    if (typeof description === 'string' && description.length > 2000) {
      return res.status(400).json({ message: "Description must be 2000 characters or fewer" });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const newProject = await addProject(
      name,
      description,
      startDate,
      endDate,
      userId
    );
    
    res.status(201).json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("❌ Error creating project:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: error.stack
    });
    
    // Send more detailed error in development
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ 
      message: isDev ? `Server error: ${error.message}` : "Server error creating project",
      details: isDev ? error.sqlMessage : undefined
    });
  }
};
