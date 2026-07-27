-- Insert sample retailers with analytics data
INSERT INTO retailers (
    name, 
    contact_person, 
    email, 
    phone, 
    status, 
    total_orders, 
    total_sales, 
    average_rating, 
    business_type, 
    joined_date
) VALUES 
('TechMart', 'John Smith', 'john@techmart.com', '555-0101', 'active', 150, 15000.00, 4.5, 'Electronics', DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)),
('FreshFoods', 'Mary Johnson', 'mary@freshfoods.com', '555-0102', 'active', 300, 25000.00, 4.8, 'Grocery', DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)),
('StyleHub', 'David Lee', 'david@stylehub.com', '555-0103', 'active', 200, 18000.00, 4.2, 'Fashion', DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH)),
('HomeDecor', 'Sarah Wilson', 'sarah@homedecor.com', '555-0104', 'active', 100, 12000.00, 4.6, 'Home', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)),
('SportZone', 'Mike Brown', 'mike@sportzone.com', '555-0105', 'active', 175, 16000.00, 4.4, 'Sports', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH));

-- Insert sample projects with varying statuses and progress
INSERT INTO projects (
    name,
    description,
    status,
    start_date,
    end_date,
    progress,
    user_id
) VALUES 
('Q1 Sales Campaign', 'Quarterly sales initiative', 'completed', DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 100, 1),
('Summer Promotion', 'Summer season promotional campaign', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 60, 1),
('Holiday Planning', 'Holiday season preparation', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 2 MONTH), 40, 1),
('Inventory Optimization', 'Stock management improvement project', 'delayed', DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 30, 1),
('Customer Loyalty Program', 'Loyalty rewards system implementation', 'ongoing', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH), 20, 1);

-- Link projects with retailers
INSERT INTO project_retailers (project_id, retailer_id)
SELECT p.id, r.id
FROM projects p
CROSS JOIN retailers r
WHERE p.id <= 5 AND r.id <= 5
LIMIT 10;