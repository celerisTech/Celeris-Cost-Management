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
-- Table structure for table `ccms_project_names`
--

DROP TABLE IF EXISTS `ccms_project_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_project_names` (
  `CM_Project_Name_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Project_Name` varchar(255) NOT NULL,
  `CM_Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Project_Name_ID`),
  UNIQUE KEY `CM_Project_Name` (`CM_Project_Name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_project_names`
--

LOCK TABLES `ccms_project_names` WRITE;
/*!40000 ALTER TABLE `ccms_project_names` DISABLE KEYS */;
INSERT INTO `ccms_project_names` VALUES (1,'Electronics Service Application','2026-09-11 10:17:54'),(2,'Hospital Management System','2026-09-11 10:17:54'),(3,'Lab Management Application','2026-09-11 10:17:54'),(4,'Billing & Inventory Software','2026-09-11 10:17:54'),(5,'Clinic Management System','2026-09-11 10:17:54'),(6,'Custom Web Application','2026-09-11 10:17:54'),(7,'Mobile Application (Android & iOS)','2026-09-11 10:17:54'),(8,'E-Commerce Platform','2026-09-11 10:17:54'),(9,'ERP & CRM Portal','2026-09-11 10:17:54'),(10,'digital','2026-09-11 10:18:15'),(11,'njj','2026-09-11 10:18:45'),(13,'ki','2026-09-11 10:18:58'),(14,'murali','2026-09-11 10:19:00'),(15,'ss','2026-09-11 10:19:14'),(17,'billing','2026-09-11 10:26:02'),(22,'gowri','2026-09-11 10:58:52'),(23,'vid','2026-09-17 09:12:12'),(24,'Digi Gold Web Application','2026-09-17 12:20:47');
/*!40000 ALTER TABLE `ccms_project_names` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:55
