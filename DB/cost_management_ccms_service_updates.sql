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
-- Table structure for table `ccms_service_updates`
--

DROP TABLE IF EXISTS `ccms_service_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_service_updates` (
  `CM_Update_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Service_ID` int DEFAULT NULL,
  `CM_Update_Date` date DEFAULT NULL,
  `CM_Update_Type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Update_Status` enum('Pending','In Progress','Completed','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Work_Hours` decimal(5,2) DEFAULT NULL,
  `CM_Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Image_URL` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Created_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Update_ID`),
  KEY `CM_Service_ID` (`CM_Service_ID`),
  CONSTRAINT `ccms_service_updates_ibfk_1` FOREIGN KEY (`CM_Service_ID`) REFERENCES `ccms_services` (`CM_Service_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_service_updates`
--

LOCK TABLES `ccms_service_updates` WRITE;
/*!40000 ALTER TABLE `ccms_service_updates` DISABLE KEYS */;
INSERT INTO `ccms_service_updates` VALUES (1,1,'2026-05-11','Status Update','Completed',1.00,'Fuse changed now it is working sir wifi connection is too low ','/uploads/716ac975-6e49-4f1f-b72b-65f7653cc681.jpg','Afrose S','2026-05-11 18:49:33'),(2,1,'2026-05-12','Status Update','Completed',1.00,'Wifi has been connected ','/uploads/26e7252a-3701-4bbc-a3fc-799d11b5e55e.jpg','Afrose S','2026-05-12 11:47:33'),(3,2,'2026-05-12','Status Update','In Progress',1.00,'Display is very dull and inverter over heating issue so processing with growatt service person ','/uploads/423f42c0-f18f-49ae-a189-04836d5e0980.jpg','Afrose S','2026-05-12 22:12:42'),(4,2,'2026-05-13','Status Update','In Progress',1.00,'Due to the fan failure over heating issue and display very dull sir taken to the service sir ','/uploads/40fe50cb-ec19-4262-9f30-576886b949f6.jpeg','Afrose S','2026-05-13 12:10:03'),(5,3,'2026-05-13','Status Update','Completed',1.00,'DCDB replaced and inverter on ','/uploads/d71aac27-5fb6-4b39-b35d-d7435b0edb7b.jpeg','Afrose S','2026-05-13 13:47:17'),(6,2,'2026-05-22','Status Update','Completed',1.00,'3 kw inverter display and fan has been replaced sir now all normal sir ','/uploads/7c61e6ad-bbf2-4c04-93d9-275c04684a02.jpeg','Afrose S','2026-05-22 11:30:18');
/*!40000 ALTER TABLE `ccms_service_updates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:13
