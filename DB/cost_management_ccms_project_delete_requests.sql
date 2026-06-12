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
-- Table structure for table `ccms_project_delete_requests`
--

DROP TABLE IF EXISTS `ccms_project_delete_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_project_delete_requests` (
  `CM_DELETE_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Project_ID` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Requested_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Requested_Role` enum('Owner','Manager') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Status` enum('Pending','Approved','Rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Approved_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Approved_At` datetime DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_DELETE_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_project_delete_requests`
--

LOCK TABLES `ccms_project_delete_requests` WRITE;
/*!40000 ALTER TABLE `ccms_project_delete_requests` DISABLE KEYS */;
INSERT INTO `ccms_project_delete_requests` VALUES (1,'PRJ000007','USR000001','Owner','DD','Approved','USR000001','2026-05-02 14:38:09','2026-05-02 14:38:08'),(2,'PRJ000006','USR000005','Manager','entered for testing','Rejected','USR000012','2026-05-18 11:32:13','2026-05-02 17:44:37'),(3,'PRJ000006','USR000012','Owner','test','Approved','USR000012','2026-05-18 11:32:39','2026-05-18 11:32:39'),(4,'PRJ000008','USR000001','Owner','Testing','Approved','USR000001','2026-05-22 12:09:37','2026-05-22 12:09:36'),(5,'PRJ000010','USR000001','Owner','d','Approved','USR000001','2026-06-01 15:07:51','2026-06-01 15:07:50'),(6,'PRJ000009','USR000001','Owner','d','Approved','USR000001','2026-06-01 15:07:56','2026-06-01 15:07:56'),(7,'PRJ000008','USR000001','Owner','d','Approved','USR000001','2026-06-01 15:08:02','2026-06-01 15:08:01');
/*!40000 ALTER TABLE `ccms_project_delete_requests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:19
