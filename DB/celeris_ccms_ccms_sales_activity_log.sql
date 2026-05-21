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
-- Table structure for table `ccms_sales_activity_log`
--

DROP TABLE IF EXISTS `ccms_sales_activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_activity_log` (
  `CM_Log_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` int DEFAULT NULL,
  `CM_Action` varchar(100) NOT NULL,
  `CM_Description` text,
  `CM_Performed_By` varchar(20) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Log_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_activity_log`
--

LOCK TABLES `ccms_sales_activity_log` WRITE;
/*!40000 ALTER TABLE `ccms_sales_activity_log` DISABLE KEYS */;
INSERT INTO `ccms_sales_activity_log` VALUES (1,1,'Lead Created','New lead created for Saran Solar',NULL,'2026-05-08 15:02:58'),(2,1,'Visit Logged','Visit #1 recorded',NULL,'2026-05-08 15:04:20'),(3,1,'Visit Logged','Visit #2 recorded',NULL,'2026-05-08 15:12:15'),(4,2,'Lead Created','New lead created for SRM',NULL,'2026-05-08 15:15:27'),(5,2,'Visit Logged','Visit #3 recorded',NULL,'2026-05-08 15:16:19'),(6,2,'Payment Added','Payment 1 of ₹10000 recorded',NULL,'2026-05-08 15:17:02'),(7,3,'Lead Created','New lead created for Saranya',NULL,'2026-05-08 15:27:28'),(8,3,'Visit Logged','Visit #4 recorded',NULL,'2026-05-08 15:35:23'),(9,3,'Visit Updated','Visit 4 updated',NULL,'2026-05-08 15:35:41'),(10,3,'Lead Updated','Lead details updated',NULL,'2026-05-08 15:38:01'),(11,4,'Lead Created','New lead created for Suresh',NULL,'2026-05-08 15:39:41'),(12,4,'Visit Logged','Visit #5 recorded',NULL,'2026-05-08 15:40:32'),(13,4,'Status Changed','Status changed from \"Visited\" to \"New Lead\"',NULL,'2026-05-08 15:45:28'),(14,4,'Lead Converted','Lead converted to Project PRJ000040',NULL,'2026-05-08 15:48:27'),(15,5,'Lead Created','New lead created for  Senthil Erode',NULL,'2026-05-08 16:58:25'),(16,5,'Visit Logged','Visit #6 recorded',NULL,'2026-05-08 17:16:10'),(17,5,'Visit Logged','Visit #7 recorded',NULL,'2026-05-08 17:18:08'),(18,6,'Lead Created','New lead created for Senthil Bhavani',NULL,'2026-05-08 17:38:37'),(19,6,'Visit Logged','Visit #8 recorded',NULL,'2026-05-08 17:40:16'),(20,6,'Payment Added','Payment 2 of ₹1000 recorded',NULL,'2026-05-08 17:43:41'),(21,5,'Visit Updated','Visit 7 updated',NULL,'2026-05-08 17:49:46'),(22,1,'Visit Updated','Visit 2 updated',NULL,'2026-05-08 17:56:03'),(23,1,'Visit Updated','Visit 2 updated',NULL,'2026-05-08 17:56:11'),(24,1,'Visit Updated','Visit 2 updated',NULL,'2026-05-08 17:56:16'),(25,3,'Visit Updated','Visit 4 updated',NULL,'2026-05-08 17:56:24'),(26,3,'Visit Updated','Visit 4 updated',NULL,'2026-05-08 17:56:32'),(27,6,'Lead Updated','Lead details updated',NULL,'2026-05-09 10:46:50'),(28,7,'Lead Created','New lead created for w',NULL,'2026-05-12 10:13:09'),(29,7,'Lead Deleted','Lead soft deleted',NULL,'2026-05-12 11:35:32'),(30,8,'Lead Created','New lead created for c',NULL,'2026-05-12 11:35:43'),(31,8,'Lead Deleted','Lead soft deleted',NULL,'2026-05-12 11:35:46');
/*!40000 ALTER TABLE `ccms_sales_activity_log` ENABLE KEYS */;
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
