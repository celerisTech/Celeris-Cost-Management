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
-- Table structure for table `ccms_sales_project_conversion`
--

DROP TABLE IF EXISTS `ccms_sales_project_conversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_project_conversion` (
  `CM_Conversion_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` int NOT NULL,
  `CM_Project_ID` varchar(20) DEFAULT NULL,
  `CM_Converted_By` varchar(20) DEFAULT NULL,
  `CM_Converted_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Remarks` text,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Conversion_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_project_conversion`
--

LOCK TABLES `ccms_sales_project_conversion` WRITE;
/*!40000 ALTER TABLE `ccms_sales_project_conversion` DISABLE KEYS */;
INSERT INTO `ccms_sales_project_conversion` VALUES (1,4,'PRJ000040',NULL,'2026-05-08 15:48:27','yes',0,'2026-05-08 15:48:27');
/*!40000 ALTER TABLE `ccms_sales_project_conversion` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:28
