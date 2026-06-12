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
-- Table structure for table `ccms_permission_requests`
--

DROP TABLE IF EXISTS `ccms_permission_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_permission_requests` (
  `CM_Permission_ID` int NOT NULL AUTO_INCREMENT,
  `CM_User_ID` varchar(25) DEFAULT NULL,
  `CM_Date` date DEFAULT NULL,
  `CM_Start_Time` time DEFAULT NULL,
  `CM_End_Time` time DEFAULT NULL,
  `CM_Reason` text,
  `CM_Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `CM_Requested_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `CM_Approved_By` varchar(50) DEFAULT NULL,
  `CM_Approved_At` timestamp NULL DEFAULT NULL,
  `CM_Rejection_Reason` text,
  PRIMARY KEY (`CM_Permission_ID`),
  KEY `fk_permission_user` (`CM_User_ID`),
  CONSTRAINT `fk_permission_user` FOREIGN KEY (`CM_User_ID`) REFERENCES `ccms_users` (`CM_User_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_permission_requests`
--

LOCK TABLES `ccms_permission_requests` WRITE;
/*!40000 ALTER TABLE `ccms_permission_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `ccms_permission_requests` ENABLE KEYS */;
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
