-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: celeris_ccms
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `ccms_visit_status_type`
--

DROP TABLE IF EXISTS `ccms_visit_status_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_visit_status_type` (
  `Status_ID` int NOT NULL AUTO_INCREMENT,
  `Status_Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Color_Code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'blue',
  `Is_Active` tinyint(1) DEFAULT '1',
  `Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Status_ID`),
  UNIQUE KEY `Status_Name` (`Status_Name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_visit_status_type`
--

LOCK TABLES `ccms_visit_status_type` WRITE;
/*!40000 ALTER TABLE `ccms_visit_status_type` DISABLE KEYS */;
INSERT INTO `ccms_visit_status_type` VALUES (1,'Follow-up Needed','blue',1,'2026-06-23 16:49:33','2026-06-23 16:49:33'),(2,'Interested','emerald',1,'2026-06-23 16:49:33','2026-06-23 16:49:33'),(3,'Not Interested','red',1,'2026-06-23 16:49:33','2026-06-23 16:49:33'),(4,'Proposal Sent','amber',1,'2026-06-23 16:49:33','2026-06-23 16:49:33'),(5,'Converted','indigo',1,'2026-06-23 16:49:33','2026-06-23 16:49:33'),(6,'Customer will callback ','purple',1,'2026-06-23 16:49:33','2026-07-05 23:42:12'),(13,'Visited','pink',1,'2026-06-27 10:33:44','2026-06-27 10:33:44'),(14,'HMS','blue',1,'2026-06-27 13:25:41','2026-06-27 13:25:41'),(15,'Already Have','amber',1,'2026-07-01 16:38:27','2026-07-01 16:38:27'),(16,'On Going','blue',1,'2026-07-03 10:47:43','2026-07-03 10:47:43'),(17,'Negotiation','amber',1,'2026-07-11 11:15:12','2026-07-11 11:15:33'),(18,'Call','cyan',1,'2026-07-22 09:11:32','2026-07-22 09:11:32'),(19,'Completed','fuchsia',1,'2026-08-04 09:57:07','2026-08-04 09:57:07');
/*!40000 ALTER TABLE `ccms_visit_status_type` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:59
