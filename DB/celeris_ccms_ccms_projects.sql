-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: celeris_ccms
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ccms_projects`
--

DROP TABLE IF EXISTS `ccms_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_projects` (
  `CM_Project_ID` varchar(25) NOT NULL,
  `CM_Project_Code` varchar(50) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Customer_ID` varchar(25) DEFAULT NULL,
  `CM_Project_Type` enum('Web Development','Mobile Application','Web Application','Others') DEFAULT NULL,
  `CM_Project_Name` varchar(150) DEFAULT NULL,
  `CM_Description` text,
  `CM_Project_Location` varchar(150) DEFAULT NULL,
  `CM_Latitude` decimal(10,8) DEFAULT NULL,
  `CM_Longitude` decimal(11,8) DEFAULT NULL,
  `CM_Radius_Meters` int DEFAULT '150',
  `CM_Project_Customer` varchar(50) DEFAULT NULL,
  `CM_Project_Customer_Phone` varchar(20) DEFAULT NULL,
  `CM_Alternative_Phone` varchar(20) DEFAULT NULL,
  `CM_Customer_Address` text,
  `CM_Estimated_Cost` decimal(35,2) DEFAULT NULL,
  `CM_Actual_Cost` decimal(35,2) DEFAULT NULL,
  `CM_Status` varchar(50) DEFAULT NULL,
  `CM_Planned_Start_Date` date DEFAULT NULL,
  `CM_Planned_End_Date` date DEFAULT NULL,
  `CM_Project_Leader_ID` varchar(100) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Project_ID`),
  KEY `fk_project_company` (`CM_Company_ID`),
  KEY `fk_ccms_projects_customer` (`CM_Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_projects`
--

LOCK TABLES `ccms_projects` WRITE;
/*!40000 ALTER TABLE `ccms_projects` DISABLE KEYS */;
INSERT INTO `ccms_projects` VALUES ('PRJ000001','CS-2526-004','COM000001','CUS000001','Others','Preethi Dental Hospital Booking','Patient Handling, Booking of Appointments','Sathyamangalam',11.45820685,77.43495584,150,NULL,NULL,NULL,NULL,35000.00,NULL,'Active','2025-11-01','2025-11-21','USR000002','Prabakar.D','2025-12-02 19:13:07',NULL,'2025-12-06 15:49:37'),('PRJ000002','PRJ-002','COM000001','CUS000002','Web Development','Issue Tracking System',NULL,'Gobi',NULL,NULL,150,NULL,NULL,NULL,NULL,75000.00,NULL,'Active','2025-11-01','2025-12-31','USR000003','Prabakar.D','2025-12-04 18:27:47','Prabakar.D','2025-12-06 15:50:06'),('PRJ000003','2025-05','COM000001','CUS000003','Web Application','Cost Center Manangement System','Cost Center Manangement System  for Saran Solar','Gobichettipalaym',11.45809118,77.43488073,150,NULL,NULL,NULL,NULL,297000.00,NULL,'Active','2025-09-01','2026-05-31','USR000002','Prabakar.D','2025-12-06 10:03:43',NULL,'2026-04-28 13:04:23'),('PRJ000004','2025-03','COM000001','CUS000004','Web Development','Gobi Dental Center Booking App',NULL,'Gobichettipalaym',11.45819633,77.43483782,150,NULL,NULL,NULL,NULL,25000.00,NULL,'Active','2025-10-01','2025-11-30','USR000007','Prabakar.D','2025-12-06 10:22:49',NULL,'2025-12-06 15:50:31'),('PRJ000005','2025-04','COM000001','CUS000005','Web Development','Daya Jewellery',NULL,'Gobichettipalaym',11.45811221,77.43488073,150,NULL,NULL,NULL,NULL,100000.00,NULL,'Active','2025-11-01','2025-12-31','USR000004','Prabakar.D','2025-12-06 10:28:37',NULL,'2025-12-24 18:34:55'),('PRJ000006','2025-06','COM000001','CUS000006','Web Application','Raaj Solar Portfolio',NULL,'Kavindapadi',11.45809118,77.43485928,150,NULL,NULL,NULL,NULL,7500.00,NULL,'Active','2025-12-03','2025-12-04','USR000005','Prabakar.D','2025-12-06 10:34:47',NULL,'2025-12-08 17:54:08'),('PRJ000007','2025-07','COM000001','CUS000007','Others','Dr. Pradeep - HMS',NULL,'Gobichettipalaym',11.45809118,77.43489146,150,NULL,NULL,NULL,NULL,30000.00,NULL,'Active','2025-12-01','2026-04-30','USR000004','Prabakar.D','2025-12-06 10:52:04',NULL,'2026-04-21 10:06:21'),('PRJ000009',NULL,'COM000001','CUS000009','Others','Billing Desktop Application',NULL,NULL,11.45824891,77.43490219,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2025-12-01','2026-05-31','USR000004','Prabakar.D','2025-12-10 10:00:53',NULL,'2026-05-07 12:40:20'),('PRJ000010','PRJ-10','COM000001','CUS000010','Others','Surya Glass House Website','Surya Glass House Web Development','Gobi',11.45819633,77.43481440,150,NULL,NULL,NULL,NULL,10000.00,NULL,'Active','2025-12-01','2025-12-31','USR000007','Prabakar.D','2025-12-22 11:23:36',NULL,'2025-12-24 18:33:46'),('PRJ000011',NULL,'COM000001','CUS000008','Web Development','NRI Services Website Development','The NRI Services Platform is a comprehensive digital solution designed to provide Non-Resident Indians (NRIs) with seamless access to essential services related to investments, property management, taxation, documentation, and financial advisory. The platform aims to bridge the gap between NRIs and service providers in India by offering a secure, transparent, and user-friendly web-based system.',NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,9000.00,NULL,'Active','2025-12-08','2026-01-10','USR000008','Prabakar.D','2025-12-24 15:37:57',NULL,'2025-12-24 18:36:50'),('PRJ000012',NULL,'COM000001','CUS000011','Others','Payroll Management Desktop version',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2025-12-22','2026-03-31','USR000003','Prabakar.D','2025-12-24 18:38:19',NULL,'2026-03-06 12:32:29'),('PRJ000014',NULL,'COM000001','CUS000013','Others','Sales Followups','Sales Follow-ups, Daily Calls, Demos to be logged here',NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-01-02','2026-12-31','USR000007','Prabakar.D','2026-01-02 11:57:12',NULL,'2026-05-07 13:11:51'),('PRJ000015',NULL,'COM000001','CUS000014','Web Development','lcid3242e',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2025-04-01','2028-06-01','USR000004','Prabakar.D','2026-01-02 18:05:46',NULL,'2026-01-07 17:45:28'),('PRJ000016','PRJ-0005','COM000001','CUS000015','Web Application','E-Commerce',NULL,NULL,11.45779676,77.43492365,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2025-10-01','2026-01-31','USR000006','Prabakar.D','2026-01-08 11:07:26','Prabakar.D','2026-01-08 11:07:28'),('PRJ000017',NULL,'COM000001','CUS000016','Others','Poster Creation',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-01-08','2026-12-31','USR000008','Prabakar.D','2026-01-08 11:36:33','Prabakar.D','2026-01-08 11:37:33'),('PRJ000018',NULL,'COM000001','CUS000017','Web Development','Gaming Schedule Website',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,10000.00,NULL,'Active','2026-02-01','2026-04-30','USR000005','Prabakar.D','2026-01-08 18:07:14',NULL,'2026-03-03 16:34:01'),('PRJ000019','2025-08','COM000001','CUS000018','Web Application','Travels Web Application',NULL,'Gobichettipalaym',11.45781779,77.43500948,150,NULL,NULL,NULL,NULL,42356.00,NULL,'Active','2026-01-22','2026-03-31','USR000003','Prabakar.D','2026-01-22 18:04:15','Prabakar.D','2026-01-22 18:05:00'),('PRJ000020','2026-12','COM000001','CUS000013','Mobile Application','Tally Integration',NULL,'Gobichettipalaym',11.45793346,77.43496656,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-02-01','2026-02-28','USR000003','Prabakar.D','2026-02-07 12:33:44',NULL,'2026-03-03 16:34:51'),('PRJ000021','2026-16','COM000001','CUS000019','Web Development','Nadusal E-commerce',NULL,'Kasipalayam',11.45775470,77.43507385,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-02-01','2026-03-31','USR000006','Prabakar.D','2026-03-07 09:47:39',NULL,'2026-03-07 09:49:13'),('PRJ000022','2026-17','COM000001','CUS000013','Web Development','U4 Constructions',NULL,'Gobichettipalaym',11.45760749,77.43507385,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-03-01','2026-03-31','USR000010','Prabakar.D','2026-03-12 09:37:35','Prabakar.D','2026-03-12 09:37:42'),('PRJ000023','2026-18','COM000001','CUS000008','Web Development','Chit Fund Mobile App',NULL,'Gobichettipalaym',11.45769161,77.43494511,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-03-25','2026-04-30','USR000006','Prabakar.D','2026-03-27 09:33:38','Prabakar.D','2026-03-27 09:34:27'),('PRJ000024','2026-19','COM000001','CUS000013','Web Development','Rentail Management System[rento]',NULL,'Gobichettipalaym',11.45718689,77.43490219,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-03-25','2026-04-30','USR000003','Prabakar.D','2026-03-27 09:45:58','Prabakar.D','2026-03-27 09:46:07'),('PRJ000025',NULL,'COM000001','CUS000020','Mobile Application','Pay + Mobile App',NULL,'Gobichettipalaym',11.45764955,77.43494511,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-04-01','2026-04-30','USR000005','Prabakar.D','2026-04-16 11:32:07','Prabakar.D','2026-04-16 11:32:13'),('PRJ000026',NULL,'COM000001','CUS000021','Web Development','Avvai Nurshing College',NULL,'Gobichettipalaym',11.45769161,77.43481636,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-04-01','2026-04-30','USR000008','Prabakar.D','2026-04-16 11:37:11',NULL,'2026-05-06 15:55:08'),('PRJ000027','2026-05','COM000001','CUS000022','Web Development','U4 Architecture',NULL,'Gobichettipalaym',11.45783882,77.43488073,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-03-01','2026-04-29','USR000008','Prabakar.D','2026-04-20 17:08:48','Prabakar.D','2026-04-20 17:08:52'),('PRJ000028',NULL,'COM000001','CUS000023','Web Development','Digi Gold - Sri Paariyur Amman Jewellery',NULL,'Gobichettipalaym',11.45748131,77.43490219,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-03-30','2026-04-15','USR000004','Prabakar.D','2026-04-20 17:19:00','Prabakar.D','2026-04-20 17:19:04'),('PRJ000029',NULL,'COM000001','CUS000013','Web Development','Customer Relationship Management',NULL,'Gobichettipalaym',11.45756543,77.43507385,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-04-16','2026-04-30','USR000004','Prabakar.D','2026-04-20 17:24:21','Prabakar.D','2026-04-20 17:24:28'),('PRJ000030',NULL,'COM000001','CUS000024','Web Development','Lions Eye Hospital Website',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-04-01','2026-04-30','USR000003','Prabakar.D','2026-04-21 12:27:54','Prabakar.D','2026-04-21 12:28:04'),('PRJ000031',NULL,'COM000001','CUS000025','Web Development','Poster Creation',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active',NULL,NULL,'USR000003','Prabakar.D','2026-04-21 12:54:21','Prabakar.D','2026-04-21 12:54:47'),('PRJ000032',NULL,'COM000001','CUS000026','Web Development','Module Creation',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active',NULL,NULL,'USR000003','Prabakar.D','2026-04-21 13:14:21','Prabakar.D','2026-04-21 13:14:29'),('PRJ000033',NULL,'COM000001','CUS000027','Web Development','Celeris Solutions Project',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active',NULL,NULL,'USR000003','Prabakar.D','2026-04-21 13:35:45','Prabakar.D','2026-04-21 13:35:53'),('PRJ000034',NULL,'COM000001','CUS000028','Others','Thirumoolar Gurupeedam App',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-05-05','2026-06-05','USR000003','Prabakar.D','2026-05-06 12:50:41','Prabakar.D','2026-05-06 12:50:41'),('PRJ000035','WWBR','COM000001','CUS000029','Web Application','World Wonders Book Of Records',NULL,'Gobichettipalaym',11.45739719,77.43485928,150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2026-05-05','2026-05-30','USR000002','Prabakar.D','2026-05-06 15:52:53','Prabakar.D','2026-05-06 15:53:10'),('PRJ000036',NULL,'COM000001','CUS000030','Web Development','Kalai Comfort System',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-04-29','2026-05-10','USR000003','Prabakar.D','2026-05-06 18:20:05','Prabakar.D','2026-05-06 18:20:05'),('PRJ000037',NULL,'COM000001','CUS000031','Mobile Application','Jobs And Services',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active',NULL,NULL,'USR000003','Prabakar.D','2026-05-07 11:07:27','Prabakar.D','2026-05-07 11:07:27'),('PRJ000038',NULL,'COM000001','CUS000032','Web Development','Sri Om Shakthi Transport',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active',NULL,NULL,'USR000003','Prabakar.D','2026-05-07 11:54:48','Prabakar.D','2026-05-07 11:54:48'),('PRJ000039',NULL,'COM000001','CUS000033','Mobile Application','Booking App',NULL,NULL,NULL,NULL,150,NULL,NULL,NULL,NULL,NULL,NULL,'Active','2026-04-28','2026-05-02','USR000003','Prabakar.D','2026-05-07 12:12:16','Prabakar.D','2026-05-07 12:12:16');
/*!40000 ALTER TABLE `ccms_projects` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:28
