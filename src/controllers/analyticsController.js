const { pool } = require('../config/db');
const { catchAsync } = require('../utils/catchAsync');

module.exports.getDashboardStats = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get total retailers count and growth
    const [retailerStats] = await conn.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN joined_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_last_30_days,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM retailers
    `);

    // Get active projects count and completion rate
    const [projectStats] = await conn.query(
      "SELECT COUNT(*) as total, " +
      "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, " +
      "SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing, " +
      "SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as delayed_count, " +
      "AVG(progress) as avg_progress " +
      "FROM projects"
    );

    // Get performance metrics
    const [performanceStats] = await conn.query(`
      SELECT 
        AVG(total_orders) as avg_orders,
        AVG(total_sales) as avg_sales,
        AVG(average_rating) as avg_rating
      FROM retailers
      WHERE status = 'active'
    `);

    // Get monthly active retailers for the last 6 months
    const [monthlyRetailers] = await conn.query(`
      SELECT 
        DATE_FORMAT(date_month, '%b') as month,
        active_count,
        new_registrations
      FROM (
        SELECT 
          DATE_SUB(CURRENT_DATE, INTERVAL n MONTH) as date_month,
          (
            SELECT COUNT(*) 
            FROM retailers 
            WHERE status = 'active' 
            AND joined_date <= DATE_SUB(CURRENT_DATE, INTERVAL n MONTH)
          ) as active_count,
          (
            SELECT COUNT(*) 
            FROM retailers 
            WHERE joined_date BETWEEN 
              DATE_SUB(DATE_SUB(CURRENT_DATE, INTERVAL n MONTH), INTERVAL 1 MONTH)
              AND DATE_SUB(CURRENT_DATE, INTERVAL n MONTH)
          ) as new_registrations
        FROM (
          SELECT 0 as n UNION SELECT 1 UNION SELECT 2 
          UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        ) months
      ) monthly_data
      ORDER BY date_month;
    `);

    // Calculate month-over-month growth for retailers
    const previousMonthActive = monthlyRetailers[1]?.active_count || 0;
    const currentMonthActive = monthlyRetailers[0]?.active_count || 0;
    const retailerGrowth = previousMonthActive ? 
      ((currentMonthActive - previousMonthActive) / previousMonthActive) * 100 : 0;

    // Calculate project completion rate trend
    const completionRate = projectStats[0].total ? 
      (projectStats[0].completed / projectStats[0].total) * 100 : 0;

    // Calculate average performance score (0-100)
    const ratingScore = performanceStats[0].avg_rating ? (performanceStats[0].avg_rating / 5) * 20 : 0; // 20%
    const progressScore = (projectStats[0].avg_progress || 0) * 0.4; // 40%
    const ordersScore = performanceStats[0].avg_orders ? Math.min((performanceStats[0].avg_orders / 100) * 40, 40) : 0; // 40%
    const performanceScore = Math.round(ratingScore + progressScore + ordersScore);

    // Format the response
    res.json({
      metrics: {
        totalRetailers: {
          value: retailerStats[0].total,
          trend: retailerGrowth,
        },
        activeProjects: {
          value: projectStats[0].ongoing,
          trend: ((projectStats[0].ongoing - projectStats[0].delayed_count) / projectStats[0].total) * 100,
        },
        performanceScore: {
          value: performanceScore,
          trend: 5, // Calculate this based on historical data
        },
        activeUsers: {
          value: retailerStats[0].active_count,
          trend: (retailerStats[0].active_count / retailerStats[0].total) * 100,
        }
      },
      charts: {
        retailerPerformance: {
          labels: monthlyRetailers.map(r => r.month).reverse(),
          datasets: [
            {
              label: 'Active Retailers',
              data: monthlyRetailers.map(r => r.active_count).reverse(),
            },
            {
              label: 'New Registrations',
              data: monthlyRetailers.map(r => r.new_registrations).reverse(),
            }
          ]
        },
        projectDistribution: {
          labels: ['Completed', 'Ongoing', 'Delayed'],
          data: [
            projectStats[0].completed,
            projectStats[0].ongoing,
            projectStats[0].delayed_count
          ]
        },
        revenueGrowth: {
          labels: monthlyRetailers.map(r => r.month).reverse(),
          data: monthlyRetailers.map((r, i) => 
            Math.round(performanceStats[0].avg_sales * r.active_count * (1 + i * 0.1))
          ).reverse()
        }
      }
    });
  } finally {
    conn.release();
  }
});

module.exports.getRetailerPerformance = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get retailer performance metrics by business type
    const [performanceByType] = await conn.query(`
      SELECT 
        business_type,
        COUNT(*) as count,
        AVG(total_sales) as avg_sales,
        AVG(total_orders) as avg_orders,
        AVG(average_rating) as avg_rating
      FROM retailers
      WHERE status = 'active'
      GROUP BY business_type
    `);

    res.json({
      byBusinessType: performanceByType
    });
  } finally {
    conn.release();
  }
});

module.exports.getProjectStats = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    // Get project completion trends
    const [projectTrends] = await conn.query(`
      SELECT 
        DATE_FORMAT(start_date, '%Y-%m') as month,
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
        AVG(progress) as avg_progress
      FROM projects
      WHERE start_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(start_date, '%Y-%m')
      ORDER BY month
    `);

    res.json({
      trends: projectTrends
    });
  } finally {
    conn.release();
  }
});