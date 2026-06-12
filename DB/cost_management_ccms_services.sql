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
-- Table structure for table `ccms_services`
--

DROP TABLE IF EXISTS `ccms_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_services` (
  `CM_Service_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Service_Code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Enquiry_Person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Customer_Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Mobile` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Service_Type` enum('Installation','Maintenance','Repair','Inspection','Upgrade','Others') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Change_Request` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Service_Incharge` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Support_Person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Service_Start_Date` date DEFAULT NULL,
  `CM_Service_End_Date` date DEFAULT NULL,
  `CM_Actual_Start_Date` datetime DEFAULT NULL,
  `CM_Actual_End_Date` datetime DEFAULT NULL,
  `CM_Status` enum('Pending','In Progress','Completed','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Service_Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Total_Cost` decimal(12,2) DEFAULT NULL,
  `CM_Image_URL` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Created_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Service_ID`),
  UNIQUE KEY `CM_Service_Code` (`CM_Service_Code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_services`
--

LOCK TABLES `ccms_services` WRITE;
/*!40000 ALTER TABLE `ccms_services` DISABLE KEYS */;
INSERT INTO `ccms_services` VALUES (1,'2026 - 01 ','Saravana ','Dr.vishnu prasad ','9942621152','Gobi',NULL,'Inspection','Inverter not working ','Afrose S','Afrose S','2026-05-11','2026-05-12',NULL,NULL,'Completed',NULL,0.00,NULL,'Mohan Kumar.L','2026-05-11 11:03:09',NULL,'2026-05-11 18:49:34'),(2,'2026 -02','Office','Muthu mahal Md home','9442369830','Gobi',NULL,'Repair','Inverter display not working','Mohan Kumar.L','Afrose S','2026-05-08','2026-05-12',NULL,NULL,'Completed',NULL,0.00,NULL,'Mohan Kumar.L','2026-05-11 12:34:08',NULL,'2026-05-22 11:30:31'),(3,'2026 - 03','Saravana ','Shanmugasundaram','9360301869','Poonjolai nagar','No 9 ,poonjolai agar,thirumalnagar extension, gobi ','Installation','Dcdb box change and inverter on ','Mohan Kumar.L','Afrose S','2026-05-13','2026-05-13',NULL,NULL,'Completed','New system DCDB box failure so change box and inverter on ',100.00,'/uploads/73442282-5e9d-4451-9a7a-b3d7fefa4d17.jpg','Mohan Kumar.L','2026-05-13 13:44:29',NULL,'2026-05-13 13:47:17'),(5,'SER-2026-001','Dheena','Service Details - K M Venkatashwaran(Muthu mahal Md home)','2514789325',NULL,NULL,'Repair','Display is very dull and inverter over heating issue so processing with growatt service person','Arun M','Bharani Kumar.C','2026-06-11','2026-06-19',NULL,NULL,'Pending','Display is very dull and inverter over heating issue so processing with growatt service personDisplay is very dull and inverter over heating issue so processing with growatt service person',0.00,NULL,'Bharani Kumar.C','2026-06-04 15:24:32',NULL,'2026-06-04 15:24:32');
/*!40000 ALTER TABLE `ccms_services` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:10
