-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Oct 01, 2025 at 01:29 AM
-- Server version: 8.0.42
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `roommate`
--

-- --------------------------------------------------------

--
-- Table structure for table `Accounts`
--

CREATE TABLE `Accounts` (
  `Accounts_id` int NOT NULL,
  `student_id` int NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `age` int NOT NULL,
  `phone` int NOT NULL,
  `gender` enum('ชาย','หญิง') NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `year` enum('ปี1','ปี2','ปี3','ปี4') DEFAULT NULL,
  `nickname` varchar(100) NOT NULL,
  `status` enum('มีห้องแล้ว','ยังไม่มีห้อง') DEFAULT NULL,
  `Register_id` int NOT NULL,
  `Post_detail_id` int DEFAULT NULL,
  `Majors_id` int NOT NULL,
  `Faculty_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Accounts`
--

INSERT INTO `Accounts` (`Accounts_id`, `student_id`, `first_name`, `last_name`, `age`, `phone`, `gender`, `image`, `year`, `nickname`, `status`, `Register_id`, `Post_detail_id`, `Majors_id`, `Faculty_id`) VALUES
(4, 65160266, 'วัชรากร', 'อังโชคชัชวาล', 22, 813775439, 'ชาย', 'https://res.cloudinary.com/dfcfrsyx3/image/upload/v1758977819/Student-images/Student-1758977817556.jpg', 'ปี4', 'บิว', 'ยังไม่มีห้อง', 1, NULL, 23, 3),
(5, 65160268, 'ภูวิน', 'อังนะ', 22, 842637888, 'ชาย', 'https://res.cloudinary.com/dfcfrsyx3/image/upload/v1758978573/Student-images/Student-1758978571620.jpg', 'ปี4', 'ยง', 'ยังไม่มีห้อง', 2, NULL, 78, 14),
(6, 65160247, 'นายทศภาค', 'จันทร์โชตะ', 22, 623742446, 'ชาย', 'https://res.cloudinary.com/dfcfrsyx3/image/upload/v1759271293/Student-images/Student-1759271292007.png', 'ปี4', 'แบงค์', 'ยังไม่มีห้อง', 5, NULL, 23, 3);

-- --------------------------------------------------------

--
-- Table structure for table `Accounts_has_Match`
--

CREATE TABLE `Accounts_has_Match` (
  `requester_id` int NOT NULL,
  `receiver_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `Accounts_has_Personality`
--

CREATE TABLE `Accounts_has_Personality` (
  `Accounts_id` int NOT NULL,
  `Personality_id` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Accounts_has_Personality`
--

INSERT INTO `Accounts_has_Personality` (`Accounts_id`, `Personality_id`) VALUES
(5, 2),
(4, 5),
(6, 5);

-- --------------------------------------------------------

--
-- Table structure for table `ChatRooms`
--

CREATE TABLE `ChatRooms` (
  `chat_id` int NOT NULL,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `ChatRooms`
--

INSERT INTO `ChatRooms` (`chat_id`, `user1_id`, `user2_id`, `created_at`, `updated_at`) VALUES
(1, 4, 5, '2025-10-01 00:46:47', '2025-10-01 00:46:47');

-- --------------------------------------------------------

--
-- Table structure for table `Faculty`
--

CREATE TABLE `Faculty` (
  `Faculty_id` int NOT NULL,
  `faculty_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Faculty`
--

INSERT INTO `Faculty` (`Faculty_id`, `faculty_name`) VALUES
(1, 'คณะศึกษาศาสตร์'),
(2, 'คณะวิทยาศาสตร์'),
(3, 'คณะวิทยาการสารสนเทศ'),
(4, 'คณะวิศวกรรมศาสตร์'),
(5, 'คณะโลจิสติกส์'),
(6, 'คณะบริหารธุรกิจและการจัดการ'),
(7, 'คณะศิลปกรรมศาสตร์'),
(8, 'คณะมนุษยศาสตร์และสังคมศาสตร์'),
(9, 'คณะเภสัชศาสตร์'),
(10, 'คณะพยาบาลศาสตร์'),
(11, 'คณะแพทยศาสตร์'),
(12, 'คณะสหเวชศาสตร์'),
(13, 'คณะสาธารณสุขศาสตร์'),
(14, 'คณะวิทยาศาสตร์การกีฬา'),
(15, 'คณะดนตรีและการแสดง'),
(16, 'คณะภูมิสารสนเทศศาสตร์'),
(17, 'วิทยาลัยนานาชาติ');

-- --------------------------------------------------------

--
-- Table structure for table `Majors`
--

CREATE TABLE `Majors` (
  `Majors_id` int NOT NULL,
  `majors_name` varchar(255) DEFAULT NULL,
  `Faculty_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Majors`
--

INSERT INTO `Majors` (`Majors_id`, `majors_name`, `Faculty_id`) VALUES
(1, 'ฟิสิกส์ศึกษา', 1),
(2, 'เทคโนโลยีดิจิทัลเพื่อการศึกษาและคอมพิวเตอร์ศึกษา', 1),
(3, 'สังคมศึกษา', 1),
(4, 'ศิลปศึกษา', 1),
(5, 'พลศึกษา', 1),
(6, 'การประถมศึกษา จิตวิทยาและแนะแนว', 1),
(7, 'การศึกษาปฐมวัย', 1),
(8, 'ชีววิทยา (ศึกษา)', 1),
(9, 'คณิตศาสตร์ (ศึกษา)', 1),
(10, 'เคมี (ศึกษา)', 1),
(11, 'คณิตศาสตร์', 2),
(12, 'เคมี', 2),
(13, 'จุลชีววิทยา', 2),
(14, 'ชีวเคมี', 2),
(15, 'ชีววิทยา', 2),
(16, 'เทคโนโลยีชีวภาพ', 2),
(17, 'ฟิสิกส์', 2),
(18, 'วิทยาศาสตร์และเทคโนโลยีการอาหาร', 2),
(19, 'สถิติ', 2),
(20, 'วิทยาศาสตร์ข้อมูลและการวิเคราะห์', 2),
(21, 'วิทยาศาสตร์เชิงสร้างสรรค์และนวัตกรรม', 2),
(22, 'วิทยาการคอมพิวเตอร์', 3),
(23, 'เทคโนโลยีสารสนเทศเพื่ออุตสาหกรรมดิจิทัล', 3),
(24, 'วิศวกรรมซอฟต์แวร์', 3),
(25, 'ปัญญาประดิษฐ์ประยุกต์และระบบอัจฉริยะ', 3),
(26, 'วิศวกรรมเคมี', 4),
(27, 'วิศวกรรมอุตสาหการ', 4),
(28, 'วิศวกรรมไฟฟ้า', 4),
(29, 'วิศวกรรมโยธา', 4),
(30, 'วิศวกรรมเครื่องกล', 4),
(31, 'การขนส่งและการสื่อสาร', 5),
(32, 'การขนส่งทางทะเล', 5),
(33, 'การจัดการการขนส่ง', 5),
(34, 'ธุรกิจระหว่างประเทศ', 5),
(35, 'การเงิน', 6),
(36, 'การจัดการทรัพยากรบุคคล', 6),
(37, 'การตลาด', 6),
(38, 'ธุรกิจระหว่างประเทศ', 6),
(39, 'การจัดการธุรกิจและนวัตกรรม', 6),
(40, 'ศิลปะเซรามิก', 7),
(41, 'ศิลปะภาพพิมพ์', 7),
(42, 'ศิลปะการสื่อสาร', 7),
(43, 'จิตรกรรมและการวาดเส้น', 7),
(44, 'การออกแบบอุตสาหกรรม', 7),
(45, 'ดนตรี', 7),
(46, 'ศิลปะการแสดง', 7),
(47, 'การแสดง', 8),
(48, 'เกาหลี', 8),
(49, 'บริการสังคมและชุมชน', 8),
(50, 'นิเทศศาสตร์', 8),
(51, 'ภาพยนตร์', 8),
(52, 'ศาสนา', 8),
(53, 'ประชาสัมพันธ์และการโฆษณา', 8),
(54, 'ภาษาจีน', 8),
(55, 'ศึกษาการพัฒนา', 8),
(56, 'สื่อสารมวลชน', 8),
(57, 'ภาษาฝรั่งเศส', 8),
(58, 'วารสารศาสตร์', 8),
(59, 'ภูมิศาสตร์', 8),
(60, 'วิทยาการสารสนเทศ', 8),
(61, 'ศึกษาการสื่อสาร', 8),
(62, 'ปรัชญา', 8),
(63, 'ประวัติศาสตร์', 8),
(64, 'จิตวิทยา', 8),
(65, 'ภาษาอังกฤษ', 8),
(66, 'เศรษฐศาสตร์', 8),
(67, 'เภสัชกรรม', 9),
(68, 'วิทยาศาสตร์ความงาม', 9),
(69, 'พยาบาลศาสตร์', 10),
(70, 'แพทยศาสตร์ (MD)', 11),
(71, 'วิทยาการคอมพิวเตอร์', 3),
(72, 'เทคโนโลยีสารสนเทศเพื่ออุตสาหกรรมดิจิทัล', 3),
(73, 'วิศวกรรมซอฟต์แวร์', 3),
(74, 'ปัญญาประดิษฐ์ประยุกต์และระบบอัจฉริยะ', 3),
(75, 'วิศวกรรมเคมี', 4),
(76, 'วิศวกรรมอุตสาหการ', 4),
(77, 'วิศวกรรมไฟฟ้า', 4),
(78, 'วิศวกรรมโยธา', 4),
(79, 'วิศวกรรมเครื่องกล', 4),
(80, 'การขนส่งและการสื่อสาร', 5),
(81, 'การขนส่งทางทะเล', 5),
(82, 'การจัดการการขนส่ง', 5),
(83, 'ธุรกิจระหว่างประเทศ', 5),
(84, 'การเงิน', 6),
(85, 'การจัดการทรัพยากรบุคคล', 6),
(86, 'การตลาด', 6),
(87, 'ธุรกิจระหว่างประเทศ', 6),
(88, 'การจัดการธุรกิจและนวัตกรรม', 6),
(89, 'ศิลปะเซรามิก', 7),
(90, 'ศิลปะภาพพิมพ์', 7),
(91, 'ศิลปะการสื่อสาร', 7),
(92, 'จิตรกรรมและการวาดเส้น', 7),
(93, 'การออกแบบอุตสาหกรรม', 7),
(94, 'ดนตรี', 7),
(95, 'ศิลปะการแสดง', 7),
(96, 'การแสดง', 8),
(97, 'เกาหลี', 8),
(98, 'บริการสังคมและชุมชน', 8),
(99, 'นิเทศศาสตร์', 8),
(100, 'ภาพยนตร์', 8),
(101, 'ศาสนา', 8),
(102, 'ประชาสัมพันธ์และการโฆษณา', 8),
(103, 'ภาษาจีน', 8),
(104, 'ศึกษาการพัฒนา', 8),
(105, 'สื่อสารมวลชน', 8),
(106, 'ภาษาฝรั่งเศส', 8),
(107, 'วารสารศาสตร์', 8),
(108, 'ภูมิศาสตร์', 8),
(109, 'วิทยาการสารสนเทศ', 8),
(110, 'ศึกษาการสื่อสาร', 8),
(111, 'ปรัชญา', 8),
(112, 'ประวัติศาสตร์', 8),
(113, 'จิตวิทยา', 8),
(114, 'ภาษาอังกฤษ', 8),
(115, 'เศรษฐศาสตร์', 8),
(116, 'เภสัชกรรม', 9),
(117, 'วิทยาศาสตร์ความงาม', 9),
(118, 'พยาบาลศาสตร์', 10),
(119, 'แพทยศาสตร์ (MD)', 11),
(120, 'ชีวการแพทย์', 12),
(121, 'เทคโนโลยีทางการแพทย์', 12),
(122, 'กายภาพบำบัด', 12),
(123, 'สาธารณสุข', 13),
(124, 'อาชีวอนามัยและสิ่งแวดล้อม', 13),
(125, 'การบริหารสาธารณสุข', 13),
(126, 'การศึกษาด้านสุขภาพ', 13),
(127, 'วิทยาศาสตร์การออกกำลังกายและกีฬา', 14),
(128, 'สื่อสารมวลชนทางการกีฬา', 14),
(129, 'การจัดการและการสอนกีฬา', 14),
(130, 'สาขาวิชาดนตรี', 15),
(131, 'สาขาวิชาศิลปะการแสดง', 15),
(132, 'สาขาวิชาการจัดการผลิตสื่อและวัฒนธรรมสร้างสรรค์', 15),
(133, 'ภูมิศาสตร์', 16),
(134, 'วิทยาการคอมพิวเตอร์ (ภาครวมภูมิสารสนเทศ)', 16),
(135, 'การจัดการธุรกิจระหว่างประเทศ', 17),
(136, 'การตลาดดิจิทัลและสร้างสรรค์', 17),
(137, 'การเงิน', 17),
(138, 'การจัดการธุรกิจโรงแรมและการท่องเที่ยวและไมซ์', 17),
(139, 'การจัดการโลจิสติกส์อัจฉริยะและห่วงโซ่อุปทาน', 17),
(140, 'การสื่อสารธุรกิจระดับโลกและสื่อสมัยใหม่', 17);

-- --------------------------------------------------------

--
-- Table structure for table `Matches`
--

CREATE TABLE `Matches` (
  `match_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `target_id` int NOT NULL,
  `status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `Matches`
--

INSERT INTO `Matches` (`match_id`, `requester_id`, `target_id`, `status`, `created_at`, `updated_at`) VALUES
(8, 5, 4, 'confirmed', '2025-10-01 01:10:48', '2025-10-01 01:10:55');

-- --------------------------------------------------------

--
-- Table structure for table `Messages`
--

CREATE TABLE `Messages` (
  `message_id` int NOT NULL,
  `chat_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `message_text` text NOT NULL,
  `message_type` enum('text','image','file') DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Messages`
--

INSERT INTO `Messages` (`message_id`, `chat_id`, `sender_id`, `message_text`, `message_type`, `is_read`, `created_at`) VALUES
(1, 1, 4, 'Hello! This is a test message.', 'text', 1, '2025-10-01 00:46:54');

-- --------------------------------------------------------

--
-- Table structure for table `Permission`
--

CREATE TABLE `Permission` (
  `permission_id` int NOT NULL,
  `Permission_name` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `Personality`
--

CREATE TABLE `Personality` (
  `Personality_id` int UNSIGNED NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Personality`
--

INSERT INTO `Personality` (`Personality_id`, `description`) VALUES
(1, 'ชอบอ่านหนังสือ'),
(2, 'ชอบเล่นกีฬา'),
(3, 'ชอบดูหนัง'),
(4, 'ชอบฟังเพลง'),
(5, 'ชอบเล่นเกม'),
(6, 'ชอบออกกำลังกาย'),
(7, 'นอนเร็วก่อน4ทุ่ม'),
(8, 'นอนดึกหลังเที่ยงคืน'),
(9, 'ชอบความสะอาด'),
(10, 'ชอบพูดคุยกับเพื่อนๆ');

-- --------------------------------------------------------

--
-- Table structure for table `Post`
--

CREATE TABLE `Post` (
  `Post_id` int NOT NULL,
  `status` enum('มีห้องแล้ว','ยังไม่มีห้อง') DEFAULT NULL,
  `create_by` timestamp NULL DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT NULL,
  `Room_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `Post_detail`
--

CREATE TABLE `Post_detail` (
  `id` int NOT NULL,
  `status` enum('ยืนยัน','ยกเลิก') DEFAULT NULL,
  `Post_Post_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `Register`
--

CREATE TABLE `Register` (
  `Register_id` int NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `regis_date` timestamp NULL DEFAULT NULL,
  `role_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `Register`
--

INSERT INTO `Register` (`Register_id`, `email`, `password`, `regis_date`, `role_id`) VALUES
(1, '65160266@go.buu.ac.th', '$2b$10$elmo8M3gFWsKHHTr93qzee4EYEyUqsbZh7FD5XAF7zR3XkqHThPDG', '2025-09-27 12:38:38', NULL),
(2, '65160268@go.buu.ac.th', '$2b$10$1nOK4kjhxeXDkqjoVDfFmeyhXUZVsjZeQKj6aN5uzLvQUrtCYFfo6', '2025-09-27 13:08:46', NULL),
(3, '65160248@go.buu.ac.th', '$2b$10$Q/HZGpmW9C6OozaY1c2NnObr.RpkM3EiP7Pm35Ebrl6IjJ.lHTOdm', '2025-09-30 22:24:27', NULL),
(4, '65160267@go.buu.ac.th', '$2b$10$iIlaBOQwTOVW/.ICJMvZoeTWb4j3DbM7jhWjnsgecMYaXy8Lbrgam', '2025-09-30 22:24:49', NULL),
(5, '65160247@go.buu.ac.th', '$2b$10$iOBuIpuHIWuKDPjbPv12/eOxY0vuCZ3gwX01sUifEWEY2.IqeZ9sW', '2025-09-30 22:25:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Room`
--

CREATE TABLE `Room` (
  `Room_id` int NOT NULL,
  `room_name` varchar(255) DEFAULT NULL,
  `room_description` text,
  `image_room` varchar(255) DEFAULT NULL,
  `create_date` timestamp NULL DEFAULT NULL,
  `create_by` timestamp NULL DEFAULT NULL,
  `update_date` timestamp NULL DEFAULT NULL,
  `update_by` timestamp NULL DEFAULT NULL,
  `Max_quantity` int DEFAULT NULL,
  `quantity` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `Room_has_Accounts`
--

CREATE TABLE `Room_has_Accounts` (
  `Room_id` int NOT NULL,
  `Accounts_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `User_role`
--

CREATE TABLE `User_role` (
  `role_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `User_role_has_Permission`
--

CREATE TABLE `User_role_has_Permission` (
  `role_id` int NOT NULL,
  `Permission_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Accounts`
--
ALTER TABLE `Accounts`
  ADD PRIMARY KEY (`Accounts_id`),
  ADD KEY `fk_Accounts_Register1_idx` (`Register_id`),
  ADD KEY `fk_Accounts_Post_detail1_idx` (`Post_detail_id`),
  ADD KEY `fk_Accounts_Majors1_idx` (`Majors_id`),
  ADD KEY `fk_Accounts_Faculty1_idx` (`Faculty_id`);

--
-- Indexes for table `Accounts_has_Match`
--
ALTER TABLE `Accounts_has_Match`
  ADD PRIMARY KEY (`requester_id`,`receiver_id`),
  ADD KEY `fk_Accounts_has_Match_Match1_idx` (`receiver_id`),
  ADD KEY `fk_Accounts_has_Match_Accounts1_idx` (`requester_id`);

--
-- Indexes for table `Accounts_has_Personality`
--
ALTER TABLE `Accounts_has_Personality`
  ADD PRIMARY KEY (`Accounts_id`,`Personality_id`),
  ADD KEY `fk_Accounts_has_Personality_Personality1_idx` (`Personality_id`),
  ADD KEY `fk_Accounts_has_Personality_Accounts1_idx` (`Accounts_id`);

--
-- Indexes for table `ChatRooms`
--
ALTER TABLE `ChatRooms`
  ADD PRIMARY KEY (`chat_id`),
  ADD UNIQUE KEY `unique_chat_room` (`user1_id`,`user2_id`),
  ADD KEY `user2_id` (`user2_id`),
  ADD KEY `idx_chat_rooms_users` (`user1_id`,`user2_id`);

--
-- Indexes for table `Faculty`
--
ALTER TABLE `Faculty`
  ADD PRIMARY KEY (`Faculty_id`);

--
-- Indexes for table `Majors`
--
ALTER TABLE `Majors`
  ADD PRIMARY KEY (`Majors_id`),
  ADD KEY `fk_Majors_Faculty1_idx` (`Faculty_id`);

--
-- Indexes for table `Matches`
--
ALTER TABLE `Matches`
  ADD PRIMARY KEY (`match_id`),
  ADD UNIQUE KEY `unique_match` (`requester_id`,`target_id`),
  ADD KEY `idx_matches_requester` (`requester_id`),
  ADD KEY `idx_matches_target` (`target_id`),
  ADD KEY `idx_matches_status` (`status`),
  ADD KEY `idx_matches_created_at` (`created_at`);

--
-- Indexes for table `Messages`
--
ALTER TABLE `Messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_messages_chat_id` (`chat_id`),
  ADD KEY `idx_messages_sender` (`sender_id`),
  ADD KEY `idx_messages_created_at` (`created_at`),
  ADD KEY `idx_messages_is_read` (`is_read`);

--
-- Indexes for table `Permission`
--
ALTER TABLE `Permission`
  ADD PRIMARY KEY (`permission_id`);

--
-- Indexes for table `Personality`
--
ALTER TABLE `Personality`
  ADD PRIMARY KEY (`Personality_id`);

--
-- Indexes for table `Post`
--
ALTER TABLE `Post`
  ADD PRIMARY KEY (`Post_id`),
  ADD KEY `fk_Post_Room1_idx` (`Room_id`);

--
-- Indexes for table `Post_detail`
--
ALTER TABLE `Post_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_Post_detail_Post1_idx` (`Post_Post_id`);

--
-- Indexes for table `Register`
--
ALTER TABLE `Register`
  ADD PRIMARY KEY (`Register_id`),
  ADD KEY `fk_Register_user_role1_idx` (`role_id`);

--
-- Indexes for table `Room`
--
ALTER TABLE `Room`
  ADD PRIMARY KEY (`Room_id`);

--
-- Indexes for table `Room_has_Accounts`
--
ALTER TABLE `Room_has_Accounts`
  ADD PRIMARY KEY (`Room_id`,`Accounts_id`),
  ADD KEY `fk_Room_has_Accounts_Accounts1_idx` (`Accounts_id`),
  ADD KEY `fk_Room_has_Accounts_Room1_idx` (`Room_id`);

--
-- Indexes for table `User_role`
--
ALTER TABLE `User_role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `User_role_has_Permission`
--
ALTER TABLE `User_role_has_Permission`
  ADD PRIMARY KEY (`role_id`,`Permission_id`),
  ADD KEY `fk_User_role_has_Permission_Permission1_idx` (`Permission_id`),
  ADD KEY `fk_User_role_has_Permission_User_role1_idx` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Accounts`
--
ALTER TABLE `Accounts`
  MODIFY `Accounts_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ChatRooms`
--
ALTER TABLE `ChatRooms`
  MODIFY `chat_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Faculty`
--
ALTER TABLE `Faculty`
  MODIFY `Faculty_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `Majors`
--
ALTER TABLE `Majors`
  MODIFY `Majors_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=141;

--
-- AUTO_INCREMENT for table `Matches`
--
ALTER TABLE `Matches`
  MODIFY `match_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Messages`
--
ALTER TABLE `Messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Personality`
--
ALTER TABLE `Personality`
  MODIFY `Personality_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `Post`
--
ALTER TABLE `Post`
  MODIFY `Post_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Post_detail`
--
ALTER TABLE `Post_detail`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Register`
--
ALTER TABLE `Register`
  MODIFY `Register_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `Room`
--
ALTER TABLE `Room`
  MODIFY `Room_id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Accounts`
--
ALTER TABLE `Accounts`
  ADD CONSTRAINT `Accounts_ibfk_1` FOREIGN KEY (`Majors_id`) REFERENCES `Majors` (`Majors_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `Accounts_ibfk_2` FOREIGN KEY (`Faculty_id`) REFERENCES `Faculty` (`Faculty_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_Accounts_Post_detail1` FOREIGN KEY (`Post_detail_id`) REFERENCES `Post_detail` (`id`),
  ADD CONSTRAINT `fk_Accounts_Register1` FOREIGN KEY (`Register_id`) REFERENCES `Register` (`Register_id`);

--
-- Constraints for table `Accounts_has_Match`
--
ALTER TABLE `Accounts_has_Match`
  ADD CONSTRAINT `fk_Accounts_has_Match_Accounts1` FOREIGN KEY (`requester_id`) REFERENCES `Accounts` (`Accounts_id`);

--
-- Constraints for table `Accounts_has_Personality`
--
ALTER TABLE `Accounts_has_Personality`
  ADD CONSTRAINT `fk_Accounts_has_Personality_Accounts1` FOREIGN KEY (`Accounts_id`) REFERENCES `Accounts` (`Accounts_id`),
  ADD CONSTRAINT `fk_Accounts_has_Personality_Personality1` FOREIGN KEY (`Personality_id`) REFERENCES `Personality` (`Personality_id`);

--
-- Constraints for table `ChatRooms`
--
ALTER TABLE `ChatRooms`
  ADD CONSTRAINT `ChatRooms_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `Accounts` (`Accounts_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ChatRooms_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `Accounts` (`Accounts_id`) ON DELETE CASCADE;

--
-- Constraints for table `Matches`
--
ALTER TABLE `Matches`
  ADD CONSTRAINT `Matches_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `Accounts` (`Accounts_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Matches_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `Accounts` (`Accounts_id`) ON DELETE CASCADE;

--
-- Constraints for table `Messages`
--
ALTER TABLE `Messages`
  ADD CONSTRAINT `Messages_ibfk_1` FOREIGN KEY (`chat_id`) REFERENCES `ChatRooms` (`chat_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `Accounts` (`Accounts_id`) ON DELETE CASCADE;

--
-- Constraints for table `Post`
--
ALTER TABLE `Post`
  ADD CONSTRAINT `fk_Post_Room1` FOREIGN KEY (`Room_id`) REFERENCES `Room` (`Room_id`);

--
-- Constraints for table `Post_detail`
--
ALTER TABLE `Post_detail`
  ADD CONSTRAINT `fk_Post_detail_Post1` FOREIGN KEY (`Post_Post_id`) REFERENCES `Post` (`Post_id`);

--
-- Constraints for table `Register`
--
ALTER TABLE `Register`
  ADD CONSTRAINT `fk_Register_user_role1` FOREIGN KEY (`role_id`) REFERENCES `User_role` (`role_id`);

--
-- Constraints for table `Room_has_Accounts`
--
ALTER TABLE `Room_has_Accounts`
  ADD CONSTRAINT `fk_Room_has_Accounts_Accounts1` FOREIGN KEY (`Accounts_id`) REFERENCES `Accounts` (`Accounts_id`),
  ADD CONSTRAINT `fk_Room_has_Accounts_Room1` FOREIGN KEY (`Room_id`) REFERENCES `Room` (`Room_id`);

--
-- Constraints for table `User_role_has_Permission`
--
ALTER TABLE `User_role_has_Permission`
  ADD CONSTRAINT `fk_User_role_has_Permission_Permission1` FOREIGN KEY (`Permission_id`) REFERENCES `Permission` (`permission_id`),
  ADD CONSTRAINT `fk_User_role_has_Permission_User_role1` FOREIGN KEY (`role_id`) REFERENCES `User_role` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
