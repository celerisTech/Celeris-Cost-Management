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
INSERT INTO `ccms_nav_link` VALUES ('NAV000001','Dashboard','/dashboard','Overview',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000002','Expenses','/expenses','Overview',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000003','Projects','/projects','Overview',NULL,'Prabakar.D','2025-08-29 13:28:56','Prabakar.D','2025-08-29 13:28:56'),('NAV000004','Warehouse','/warehouse','Overview',NULL,'Prabakar.D','2025-09-05 12:55:02','Prabakar.D',NULL),('NAV000005','Employees Attendance','/attendance','Operations',NULL,'Prabakar.D','2025-09-05 12:55:06','Prabakar.D',NULL),('NAV000006','Employees','/labors','Operations',NULL,'Prabakar.D','2025-09-05 12:55:09','Prabakar.D',NULL),('NAV000007','Vendors','/supplier','Operations',NULL,'Prabakar.D','2025-09-05 12:55:11','Prabakar.D',NULL),('NAV000008','Product Approval','/manager','Operations',NULL,'Prabakar.D','2025-09-05 12:55:13','Prabakar.D',NULL),('NAV000009','Purchases','/purchase-history','Overview',NULL,'Prabakar.D','2025-09-05 12:55:15','Prabakar.D',NULL),('NAV000010','Stock Transfer','/stock-management','Operations',NULL,'Prabakar.D','2025-09-05 12:55:18','Prabakar.D',NULL),('NAV000011','Notifications','/notifications','Operations',NULL,'Prabakar.D','2025-09-05 12:55:20','Prabakar.D',NULL),('NAV000012','Teams & Members','/teams','Administration',NULL,'Prabakar.D','2025-09-05 12:55:23','Prabakar.D',NULL),('NAV000013','Settings','/settings','Administration',NULL,'Prabakar.D','2025-09-05 12:55:25','Prabakar.D',NULL),('NAV000014','Create Godown','/creategodown','Administration',NULL,'Prabakar.D','2025-09-05 12:55:27','Prabakar.D',NULL),('NAV000015','Privileges','/privileges','Administration',NULL,'Prabakar.D','2025-09-05 12:55:30','Prabakar.D',NULL),('NAV000016','Assigned Projects','/engineer/projects','Overview',NULL,'Prabakar.D','2025-09-05 12:55:35','Prabakar.D',NULL),('NAV000017','Engineering Project Expenses','/engineer/expensive-entry','Overview',NULL,'Prabakar.D','2025-09-05 12:55:35',NULL,NULL),('NAV000018','Sales Dashboard','/dashboard/crm','Sales',NULL,NULL,NULL,NULL,NULL),('NAV000019','Sales Leads','/dashboard/crm/leads','Sales',NULL,NULL,NULL,NULL,NULL),('NAV000020','Visit Tracking','/dashboard/crm/visits','Sales',NULL,NULL,NULL,NULL,NULL),('NAV000021','Sales Payments','/dashboard/crm/payments','Sales',NULL,NULL,NULL,NULL,NULL),('NAV000022','Sales Reports','/dashboard/crm/reports','Sales',NULL,NULL,NULL,NULL,NULL);
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

-- Dump completed on 2026-05-21  9:56:29
