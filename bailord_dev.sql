-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 03, 2025 at 10:18 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bailord_dev`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `recipient_id`, `content`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'Hello! This is a test message.', 0, '2025-10-30 13:47:33', '2025-10-30 13:47:33'),
(2, 4, 1, 'Test message sent at 2025-10-30 14:48:28', 0, '2025-10-30 13:48:29', '2025-10-30 13:48:29'),
(3, 1, 2, 'hi', 0, '2025-11-01 12:29:48', '2025-11-01 12:29:48'),
(4, 2, 1, 'hyd', 0, '2025-11-01 12:30:15', '2025-11-01 12:30:15'),
(5, 1, 2, 'hey', 0, '2025-11-01 21:35:04', '2025-11-01 21:35:04'),
(6, 2, 1, 'what\'s up ? this is all a test', 0, '2025-11-01 21:35:38', '2025-11-01 21:35:38'),
(7, 1, 2, 'hey this i our second messGWE', 0, '2025-11-04 10:36:30', '2025-11-04 10:36:30'),
(8, 3, 1, 'Hey this is a new conversation initiated by me', 0, '2025-11-04 10:43:48', '2025-11-04 10:43:48'),
(9, 4, 1, 'hi', 0, '2025-11-04 14:30:28', '2025-11-04 14:30:28');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('ongoing','completed','delayed') DEFAULT 'ongoing',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `progress` int(11) DEFAULT 0,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `status`, `start_date`, `end_date`, `progress`, `user_id`, `created_at`) VALUES
(1, 'Q1 Sales Campaign', 'Quarterly sales initiative', 'completed', '2025-05-01', '2025-07-01', 100, 1, '2025-11-01 07:32:26'),
(2, 'Summer Promotion', 'Summer season promotional campaign', 'ongoing', '2025-08-01', '2025-12-01', 60, 1, '2025-11-01 07:32:26'),
(3, 'Holiday Planning', 'Holiday season preparation', 'ongoing', '2025-09-01', '2026-01-01', 40, 1, '2025-11-01 07:32:26'),
(4, 'Inventory Optimization', 'Stock management improvement project', 'delayed', '2025-07-01', '2025-10-01', 30, 1, '2025-11-01 07:32:26'),
(5, 'Customer Loyalty Program', 'Loyalty rewards system implementation', 'ongoing', '2025-10-01', '2026-02-01', 20, 1, '2025-11-01 07:32:26');

-- --------------------------------------------------------

--
-- Table structure for table `project_retailers`
--

CREATE TABLE `project_retailers` (
  `project_id` int(11) NOT NULL,
  `retailer_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_retailers`
--

INSERT INTO `project_retailers` (`project_id`, `retailer_id`, `assigned_at`) VALUES
(1, 1, '2025-11-01 07:32:26'),
(1, 2, '2025-11-01 07:32:26'),
(2, 1, '2025-11-01 07:32:26'),
(2, 2, '2025-11-01 07:32:26'),
(3, 1, '2025-11-01 07:32:26'),
(3, 2, '2025-11-01 07:32:26'),
(4, 1, '2025-11-01 07:32:26'),
(4, 2, '2025-11-01 07:32:26'),
(5, 1, '2025-11-01 07:32:26'),
(5, 2, '2025-11-01 07:32:26');

-- --------------------------------------------------------

--
-- Table structure for table `retailers`
--

CREATE TABLE `retailers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `street_address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `zip_code` varchar(20) NOT NULL,
  `country` varchar(100) DEFAULT 'Nigeria',
  `business_name` varchar(255) NOT NULL,
  `business_type` enum('Grocery','Electronics','Fashion','Food & Beverage','Health & Beauty','Other') NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `joined_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `total_sales` decimal(15,2) DEFAULT 0.00,
  `total_orders` int(11) DEFAULT 0,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `retailers`
--

INSERT INTO `retailers` (`id`, `name`, `email`, `phone`, `street_address`, `city`, `state`, `zip_code`, `country`, `business_name`, `business_type`, `registration_number`, `status`, `joined_date`, `last_updated`, `bank_name`, `account_number`, `account_name`, `total_sales`, `total_orders`, `average_rating`, `created_at`, `updated_at`) VALUES
(1, 'TechMart', 'john@techmart.com', '555-0101', '12 Tech St', 'Lagos', 'Lagos', '100001', 'Nigeria', 'TechMart Ltd', 'Electronics', 'REG-1001', 'active', '2025-05-01 07:32:26', '2025-11-01 07:32:26', 'First Bank', '0123456789', 'TechMart Ltd', 15000.00, 150, 4.50, '2025-11-01 07:32:26', '2025-11-01 07:32:26'),
(2, 'FreshFoods', 'mary@freshfoods.com', '555-0102', '34 Market Rd', 'Ikeja', 'Lagos', '100002', 'Nigeria', 'FreshFoods Ltd', 'Grocery', 'REG-1002', 'active', '2025-06-01 07:32:26', '2025-11-01 07:32:26', 'GTBank', '9876543210', 'FreshFoods Ltd', 25000.00, 300, 4.80, '2025-11-01 07:32:26', '2025-11-01 07:32:26'),
(3, 'StyleHub', 'david@stylehub.com', '555-0103', '56 Fashion Ave', 'Victoria Island', 'Lagos', '100003', 'Nigeria', 'StyleHub Ltd', 'Fashion', 'REG-1003', 'active', '2025-07-01 07:32:26', '2025-11-01 07:32:26', 'Access Bank', '1231231234', 'StyleHub Ltd', 18000.00, 200, 4.20, '2025-11-01 07:32:26', '2025-11-01 07:32:26'),
(4, 'HomeDecor', 'sarah@homedecor.com', '555-0104', '78 Home St', 'Lekki', 'Lagos', '100004', 'Nigeria', 'HomeDecor Ltd', 'Other', 'REG-1004', 'active', '2025-08-01 07:32:26', '2025-11-01 07:32:26', 'Zenith Bank', '5556667778', 'HomeDecor Ltd', 12000.00, 100, 4.60, '2025-11-01 07:32:26', '2025-11-01 07:32:26'),
(5, 'SportZone', 'mike@sportzone.com', '555-0105', '90 Sport Ln', 'Surulere', 'Lagos', '100005', 'Nigeria', 'SportZone Ltd', 'Other', 'REG-1005', 'active', '2025-09-01 07:32:26', '2025-11-01 07:32:26', 'UBA', '4443332221', 'SportZone Ltd', 16000.00, 175, 4.40, '2025-11-01 07:32:26', '2025-11-01 07:32:26');

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `token_blacklist`
--

CREATE TABLE `token_blacklist` (
  `id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `token_blacklist`
--

INSERT INTO `token_blacklist` (`id`, `token`, `expires_at`, `created_at`, `user_id`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYxOTk4NzA2LCJleHAiOjE3NjIwMDIzMDZ9.8XMQzaSkbX76_w178IXok84Yw9eX9z_Kis6efXbzpIs', '2025-11-01 13:05:06', '2025-11-01 12:05:12', 1),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYxOTk4NzE1LCJleHAiOjE3NjIwMDIzMTV9.C9db59jXPkGAVmqnUxiZnqFBjXPdwCFDQ7pLJtxIROg', '2025-11-01 13:05:15', '2025-11-01 12:05:35', 1),
(3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYyMDAzMTM3LCJleHAiOjE3NjIwMDY3Mzd9.kwsTEdy4oYznBRhxenFkYfZWSIw6OVQtKslRjTbe6FU', '2025-11-01 14:18:57', '2025-11-01 13:19:08', 2),
(4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYyMDI1ODEzLCJleHAiOjE3NjIwMjk0MTN9.S79dNKmf_w5HKitz82KWz0eUcfMpXt9pQCeCb2BBym0', '2025-11-01 20:36:53', '2025-11-01 19:36:53', 2),
(5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMDI2MjQ0LCJleHAiOjE3NjIwMjk4NDR9.tPL62GOQzqhpfPfTOLYHxPDxJ90Pu5W2vo8h-HxoEN8', '2025-11-01 20:44:04', '2025-11-01 19:46:40', 1),
(6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMDI2NDAyLCJleHAiOjE3NjIwMzAwMDJ9.uAjDWMqQobBhVY2ZSDYHb9KFJHWCjQ2BuhgXMXXOJYg', '2025-11-01 20:46:42', '2025-11-01 19:49:35', 1),
(7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMjUyNTQ1LCJleHAiOjE3NjIyNTYxNDV9.utX90_p3MwzDJnYBBYZbv01hE2Z78FVc8v9Y8uNOYzk', '2025-11-04 11:35:45', '2025-11-04 10:37:56', 1),
(8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzYyMjY2MTkzLCJleHAiOjE3NjIyNjk3OTN9.DyTYhJUonSTKNWaIhACq30maXy3F_idSB7QOOoGTRWg', '2025-11-04 15:23:13', '2025-11-04 14:23:13', 3),
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzYyMjY2Mjg0LCJleHAiOjE3NjIyNjk4ODR9.TsqNsycYSURFoFctYkklbzEmF6YMZQOcBzdChVWG5V0', '2025-11-04 15:24:44', '2025-11-04 14:30:57', 4);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff','retailer') NOT NULL DEFAULT 'staff',
  `status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
  `refresh_token` varchar(512) DEFAULT NULL,
  `last_token_refresh` timestamp NULL DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `refresh_token`, `last_token_refresh`, `company`, `phone`, `address`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@bailord.com', '$2b$10$KkpHwSYdzJ/QSWvyA2gzF.qyMuom0W6xq4bZUxEzg2difUzvxzGjq', 'admin', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMjY2NjYzLCJleHAiOjE3NjQ4NTg2NjN9.uzG3ggcUj9eSSqUIMy1iW-FhNqLCTwlDV_je-bRqoyU', '2025-11-04 14:31:03', NULL, NULL, NULL, NULL, '2025-11-01 11:53:47', '2025-11-04 14:31:03'),
(2, 'Test Staff', 'staff@bailord.com', '$2b$10$HRz/Ecweaksoly7.VtHgguwV0i4.r41T1QsE.Ox/vOQPKN26ZQ9CG', 'staff', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYyMDI1ODE1LCJleHAiOjE3NjQ2MTc4MTV9.0HLyKDiZOVYN9UC0h4JZBHlVXX-zZFGOS4dAMVF4XX4', '2025-11-01 19:36:55', NULL, NULL, NULL, NULL, '2025-11-01 12:13:11', '2025-11-01 19:36:55'),
(3, 'Angelo', 'agelo@gmail.com', '$2b$10$RyRUj2Shdx57noGFCwuURu9blVB1XaNwu2Z5hhu17VR/2655ImiwO', 'staff', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-04 10:39:01', '2025-11-04 14:23:13'),
(4, 'Dinah Bewaji', 'dinah@gmail.com', '$2b$10$/v1QOXd0KZhFK4mQPvKLMOa8E2HZcTjF575EFZ6BrSJ6a0SxyrfBK', 'staff', 'active', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-04 14:24:44', '2025-11-04 14:30:57'),
(5, 'Michel Akerele', 'thecheat233@gmail.com', '$2b$10$7fTAqta2M8WFZlMKCymUaeJHYtlo4Xae68lNX44hAIWEycr27kbZy', 'staff', 'active', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzYyODY0MjY5LCJleHAiOjE3NjU0NTYyNjl9.i90qSestBdK3TQQEkyI2YKlzZTXUschaP4cQ60lcjWg', '2025-11-11 12:31:09', NULL, NULL, NULL, NULL, '2025-11-11 12:31:09', '2025-11-11 12:31:09');

-- --------------------------------------------------------

--
-- Table structure for table `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(1024) NOT NULL,
  `device` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `revoked` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `project_retailers`
--
ALTER TABLE `project_retailers`
  ADD PRIMARY KEY (`project_id`,`retailer_id`);

--
-- Indexes for table `retailers`
--
ALTER TABLE `retailers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `registration_number` (`registration_number`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_business_type` (`business_type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `token_blacklist`
--
ALTER TABLE `token_blacklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `retailers`
--
ALTER TABLE `retailers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `token_blacklist`
--
ALTER TABLE `token_blacklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `token_blacklist`
--
ALTER TABLE `token_blacklist`
  ADD CONSTRAINT `token_blacklist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD CONSTRAINT `user_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
