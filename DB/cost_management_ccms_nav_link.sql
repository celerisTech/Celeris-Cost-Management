-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cost_management
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
-- Table structure for table `ccms_nav_link`
--

DROP TABLE IF EXISTS `ccms_nav_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_nav_link` (
  `CM_Nav_Link_ID` varchar(25) NOT NULL,
  `CM_Name` varchar(100) DEFAULT NULL,
  `CM_Path` text,
  `CM_Section` varchar(100) DEFAULT NULL,
  `CM_Icon` varchar(50) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Nav_Link_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_nav_link`
--

LOCK TABLES `ccms_nav_link` WRITE;
/*!40000 ALTER TABLE `ccms_nav_link` DISABLE KEYS */;
INSERT INTO `ccms_nav_link` VALUES ('NAV000001','Dashboard','/dashboard','Dashboard',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000002','General Expenses','/expenses','Finance & Accounts',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000003','Projects','/projects','Project Management',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000004','Inventory','/warehouse','Purchase & Inventory',NULL,'Prabakar.D','2025-09-05 12:55:02','Prabakar.D',NULL),('NAV000005','Employees Attendance','/attendance','Human Resources',NULL,'Prabakar.D','2025-09-05 12:55:06','Prabakar.D',NULL),('NAV000006','Employees','/labors','Human Resources',NULL,'Prabakar.D','2025-09-05 12:55:09','Prabakar.D',NULL),('NAV000007','Vendors','/supplier','Purchase & Inventory',NULL,'Prabakar.D','2025-09-05 12:55:11','Prabakar.D',NULL),('NAV000008','Material Approval','/manager','Purchase & Inventory',NULL,'Prabakar.D','2025-09-05 12:55:13','Prabakar.D',NULL),('NAV000009','Purchase Management','/purchase-history','Purchase & Inventory',NULL,'Prabakar.D','2025-09-05 12:55:15','Prabakar.D',NULL),('NAV000010','Stock Transfer','/stock-management','Purchase & Inventory',NULL,'Prabakar.D','2025-09-05 12:55:18','Prabakar.D',NULL),('NAV000011','Alerts & Notifications','/notifications','System & Administration',NULL,'Prabakar.D','2025-09-05 12:55:20','Prabakar.D',NULL),('NAV000012','Team Management','/teams','System & Administration',NULL,'Prabakar.D','2025-09-05 12:55:23','Prabakar.D',NULL),('NAV000015','Access Control','/privileges','System & Administration',NULL,'Prabakar.D','2025-09-05 12:55:30','Prabakar.D',NULL),('NAV000016','Assigned Projects','/engineer/projects','Field Operations',NULL,'Prabakar.D','2025-09-05 12:55:35','Prabakar.D',NULL),('NAV000017','Project Expenses','/engineer/expensive-entry','Field Operations',NULL,'Prabakar.D','2025-09-05 12:55:35',NULL,NULL),('NAV000018','Services','/service-management','Project Management',NULL,'Bharani Kumar.C',NULL,NULL,NULL),('NAV000019','Day Book','/daybook','Finance & Accounts',NULL,'Bharani Kumar.C','2026-05-11 09:50:39','Bharani Kumar.C','2026-05-11 09:50:39'),('NAV000020','Leaves & Permissions','/leaves-permissions','Human Resources','','Bharani Kumar.C','2026-05-15 00:20:17',NULL,NULL);
/*!40000 ALTER TABLE `ccms_nav_link` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:08
