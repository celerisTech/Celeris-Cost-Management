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
-- Table structure for table `ccms_milestone`
--

DROP TABLE IF EXISTS `ccms_milestone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_milestone` (
  `CM_Milestone_ID` varchar(25) NOT NULL,
  `CM_Project_ID` varchar(25) DEFAULT NULL,
  `CM_Milestone_Name` varchar(150) DEFAULT NULL,
  `CM_Description` text,
  `CM_Planned_Start_Date` date DEFAULT NULL,
  `CM_Planned_End_Date` date DEFAULT NULL,
  `CM_Status` enum('Not Started','In Progress','Completed','On Hold','Cancelled') DEFAULT NULL,
  `CM_Percentage_Weightage` decimal(5,2) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Milestone_ID`),
  KEY `fk_milestone_project` (`CM_Project_ID`),
  CONSTRAINT `fk_milestone_project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_milestone`
--

LOCK TABLES `ccms_milestone` WRITE;
/*!40000 ALTER TABLE `ccms_milestone` DISABLE KEYS */;
INSERT INTO `ccms_milestone` VALUES ('MILE000001','PRJ000001','1 Half ',NULL,'2025-10-08','2026-01-15','Not Started',0.00,'Bharani Kumar.C','2025-12-23 16:34:58','Bharani Kumar.C','2025-12-23 16:34:58'),('MILE000002','PRJ000001','2 nd half',NULL,'2026-01-16','2026-02-23','Not Started',0.00,'Bharani Kumar.C','2025-12-23 16:34:58','Bharani Kumar.C','2025-12-23 16:34:58'),('MILE000003','PRJ000002','First Stage',NULL,'2025-08-18','2026-05-15','Not Started',0.00,'Bharani Kumar.C','2026-01-13 17:02:28','Unknown User','2026-04-29 10:51:34'),('MILE000004','PRJ000003','First Half',NULL,'2026-01-01','2026-05-31','Not Started',0.00,'Bharani Kumar.C','2026-01-21 16:56:10','Unknown User','2026-04-24 16:09:25'),('MILE000005','PRJ000004','First Stage',NULL,'2025-08-18','2026-01-01','Not Started',0.00,'Bharani Kumar.C','2026-01-21 17:24:54','Unknown User','2026-01-23 15:52:26'),('MILE000006','PRJ000004','Final Stage ',NULL,'2026-04-02','2026-05-15','Not Started',0.00,'Bharani Kumar.C','2026-01-21 17:24:54','Unknown User','2026-04-29 10:49:00'),('MILE000007','PRJ000005','Ending Work',NULL,'2026-02-01','2026-03-01','Not Started',0.00,'Bharani Kumar.C','2026-02-17 17:27:55','Bharani Kumar.C','2026-02-17 17:27:55'),('MILE000010','PRJ000007','Procurement','\n','2026-04-27','2026-05-15','Not Started',0.00,'Sri Nikhil','2026-05-05 15:19:40','Sri Nikhil','2026-05-05 15:31:08'),('MILE000011','PRJ000007','Roof-Installation',NULL,'2026-05-08','2026-05-22','Not Started',0.00,'Sri Nikhil','2026-05-05 16:37:12','Sri Nikhil','2026-05-05 16:37:12'),('MILE000012','PRJ000007','Inverter, Components Installation',NULL,'2026-05-21','2026-05-28','Not Started',0.00,'Sri Nikhil','2026-05-05 16:39:58','Sri Nikhil','2026-05-05 16:39:58'),('MILE000013','PRJ000007','Commissioning',NULL,'2026-05-31','2026-06-05','Not Started',0.00,'Sri Nikhil','2026-05-05 16:40:43','Sri Nikhil','2026-05-05 16:40:43');
/*!40000 ALTER TABLE `ccms_milestone` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:16
