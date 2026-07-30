const { pool } = require('../config/db');
const { catchAsync } = require('../utils/catchAsync');

module.exports.globalSearch = catchAsync(async (req, res) => {
  const { q: query } = req.query;
  
  if (!query || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  const searchQuery = `%${query}%`;

  // Search in retailers
  const retailersPromise = pool.query(`
    SELECT 
      id,
      'retailer' as type,
      name,
      business_name,
      business_type,
      status,
      city,
      last_updated
    FROM retailers 
    WHERE 
      name LIKE ? OR
      business_name LIKE ? OR
      email LIKE ? OR
      city LIKE ?
    LIMIT 5
  `, [searchQuery, searchQuery, searchQuery, searchQuery]);

  // Search in projects
  const projectsPromise = pool.query(`
    SELECT 
      id,
      'project' as type,
      name,
      description,
      status,
      progress,
      start_date,
      end_date
    FROM projects 
    WHERE 
      name LIKE ? OR
      description LIKE ?
    LIMIT 5
  `, [searchQuery, searchQuery]);

  // Search in messages and conversations
  const messagesPromise = pool.query(`
    SELECT 
      m.id,
      'message' as type,
      m.content as subject,
      m.created_at as timestamp,
      CONCAT(u1.name, ' → ', u2.name) as title,
      m.sender_id,
      m.recipient_id
    FROM messages m
    JOIN users u1 ON m.sender_id = u1.id
    JOIN users u2 ON m.recipient_id = u2.id
    WHERE 
      m.content LIKE ?
    ORDER BY m.created_at DESC
    LIMIT 5
  `, [searchQuery]);

  // Execute all queries in parallel
  const [
    [retailers], 
    [projects], 
    [messages]
  ] = await Promise.all([
    retailersPromise,
    projectsPromise,
    messagesPromise
  ]);

  // Transform retailer results
  const transformedRetailers = retailers.map(retailer => ({
    id: retailer.id,
    type: 'retailer',
    title: retailer.business_name,
    subtitle: `${retailer.business_type} • ${retailer.city}`,
    timestamp: retailer.last_updated,
    url: `/retailers/${retailer.id}`,
    status: retailer.status
  }));

  // Transform project results
  const transformedProjects = projects.map(project => ({
    id: project.id,
    type: 'project',
    title: project.name,
    subtitle: `${project.status} • ${project.progress}% complete`,
    timestamp: project.start_date,
    url: `/projects/${project.id}`,
    status: project.status,
    dueDate: project.end_date
  }));

  // Transform message results
  const transformedMessages = messages.map(message => ({
    id: message.id,
    type: 'message',
    title: message.title,
    subtitle: message.subject.length > 100 
      ? message.subject.substring(0, 100) + '...' 
      : message.subject,
    timestamp: message.timestamp,
    url: `/messages/${message.sender_id}-${message.recipient_id}`,
  }));

  // Combine all results
  const results = [
    ...transformedRetailers,
    ...transformedProjects,
    ...transformedMessages
  ];

  res.json({ results });
});