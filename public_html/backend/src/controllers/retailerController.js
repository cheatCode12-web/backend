const { pool } = require('../config/db');
const { catchAsync } = require('../utils/catchAsync');
const {
  CREATE_RETAILERS_TABLE,
  INSERT_RETAILER,
  GET_RETAILERS,
  GET_RETAILER,
  UPDATE_RETAILER,
  DELETE_RETAILER,
  UPDATE_RETAILER_METRICS,
  COUNT_RETAILERS
} = require('../models/retailerQueries');

// Ensure retailers table exists


// Create a new retailer
module.exports.createRetailer = catchAsync(async (req, res) => {
  const {
    name, email, phone, 
    address: { street, city, state, zipCode, country },
    businessName, businessType, registrationNumber,
    bankDetails: { bankName, accountNumber, accountName }
  } = req.body;

  const conn = await pool.getConnection();
  
  try {
    const [result] = await conn.query(INSERT_RETAILER, [
      name, email, phone, street, city, state, zipCode, 
      country || 'Nigeria', businessName, businessType, 
      registrationNumber, bankName, accountNumber, accountName
    ]);

    const [newRetailers] = await conn.query(GET_RETAILER, [result.insertId]);
    const retailer = newRetailers[0];

    // Format the retailer data
    const formattedRetailer = {
      id: retailer.id,
      name: retailer.name,
      email: retailer.email,
      phone: retailer.phone,
      address: {
        street: retailer.street_address,
        city: retailer.city,
        state: retailer.state,
        zipCode: retailer.zip_code,
        country: retailer.country
      },
      businessName: retailer.business_name,
      businessType: retailer.business_type,
      registrationNumber: retailer.registration_number,
      status: retailer.status,
      joinedDate: retailer.joined_date,
      bankDetails: {
        bankName: retailer.bank_name,
        accountNumber: retailer.account_number,
        accountName: retailer.account_name
      },
      metrics: {
        totalSales: retailer.total_sales,
        totalOrders: retailer.total_orders,
        averageRating: retailer.average_rating
      },
      createdAt: retailer.created_at,
      updatedAt: retailer.updated_at
    };

    res.status(201).json({
      status: 'success',
      data: {
        retailer: formattedRetailer
      }
    });
  } finally {
    conn.release();
  }
});

// Get all retailers with pagination and filters
module.exports.getAllRetailers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { businessType, status, city, search } = req.query;
  const searchTerm = typeof search === 'string' && search.trim() ? `%${search.trim()}%` : null;
  const conn = await pool.getConnection();
  
  try {
    // Get total count for pagination
    const [countResult] = await conn.query(COUNT_RETAILERS, [
      businessType, businessType,
      status, status,
      city, city,
      searchTerm, searchTerm, searchTerm, searchTerm
    ]);
    
    const total = countResult[0].total;

    // Get retailers with filters and pagination
    const [retailers] = await conn.query(GET_RETAILERS, [
      businessType, businessType,
      status, status,
      city, city,
      searchTerm, searchTerm, searchTerm, searchTerm,
      limit, offset
    ]);

    // Ensure retailers is an array and transform data structure
    const formattedRetailers = retailers.map(retailer => ({
      id: retailer.id,
      name: retailer.name,
      email: retailer.email,
      phone: retailer.phone,
      address: {
        street: retailer.street_address,
        city: retailer.city,
        state: retailer.state,
        zipCode: retailer.zip_code,
        country: retailer.country
      },
      businessName: retailer.business_name,
      businessType: retailer.business_type,
      registrationNumber: retailer.registration_number,
      status: retailer.status,
      joinedDate: retailer.joined_date,
      bankDetails: {
        bankName: retailer.bank_name,
        accountNumber: retailer.account_number,
        accountName: retailer.account_name
      },
      metrics: {
        totalSales: retailer.total_sales,
        totalOrders: retailer.total_orders,
        averageRating: retailer.average_rating
      },
      createdAt: retailer.created_at,
      updatedAt: retailer.updated_at
    }));

    res.json({
      status: 'success',
      results: formattedRetailers.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: {
        retailers: formattedRetailers
      }
    });
  } finally {
    conn.release();
  }
});

// Get single retailer profile
module.exports.getRetailerProfile = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const [retailers] = await conn.query(GET_RETAILER, [req.params.id]);
    
    if (!retailers.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        retailer: retailers[0]
      }
    });
  } finally {
    conn.release();
  }
});

// Update retailer profile
module.exports.updateRetailer = catchAsync(async (req, res) => {
  const {
    name, phone, 
    address: { street, city, state, zipCode, country },
    businessName, businessType, registrationNumber,
    bankDetails: { bankName, accountNumber, accountName }
  } = req.body;

  const conn = await pool.getConnection();
  
  try {
    const [result] = await conn.query(UPDATE_RETAILER, [
      name, phone, street, city, state, zipCode, 
      country || 'Nigeria', businessName, businessType, 
      registrationNumber, bankName, accountNumber, accountName,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    const [updatedRetailer] = await conn.query(GET_RETAILER, [req.params.id]);

    res.json({
      status: 'success',
      data: {
        retailer: updatedRetailer[0]
      }
    });
  } finally {
    conn.release();
  }
});

// Delete retailer
module.exports.deleteRetailer = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();
  
  try {
    const [result] = await conn.query(DELETE_RETAILER, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    res.json({
      status: 'success',
      data: null
    });
  } finally {
    conn.release();
  }
});

// Update retailer metrics
module.exports.updateRetailerMetrics = catchAsync(async (req, res) => {
  const { totalSales, totalOrders, averageRating } = req.body;
  const conn = await pool.getConnection();
  
  try {
    const [result] = await conn.query(UPDATE_RETAILER_METRICS, [
      totalSales, totalOrders, averageRating, req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    const [updatedRetailer] = await conn.query(GET_RETAILER, [req.params.id]);

    res.json({
      status: 'success',
      data: {
        retailer: updatedRetailer[0]
      }
    });
  } finally {
    conn.release();
  }
});
