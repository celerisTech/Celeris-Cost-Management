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
-- Table structure for table `ccms_unit_type`
--

DROP TABLE IF EXISTS `ccms_unit_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_unit_type` (
  `CM_Unit_ID` varchar(25) NOT NULL,
  `CM_Unit_Name` varchar(100) DEFAULT NULL,
  `CM_Description` text,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Unit_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_unit_type`
--

LOCK TABLES `ccms_unit_type` WRITE;
/*!40000 ALTER TABLE `ccms_unit_type` DISABLE KEYS */;
INSERT INTO `ccms_unit_type` VALUES ('UNT000001','KG','Kilograms','Prabakar.D','2025-11-11 06:37:50','Prabakar.D','2025-11-11 06:46:43'),('UNT000002','Meter','Meters','Prabakar.D','2025-11-11 06:41:10','Prabakar.D','2025-11-11 06:41:10'),('UNT000003','Bags','Bags','Prabakar.D','2025-11-11 06:43:29','Prabakar.D','2025-11-11 07:06:20'),('UNT000004','Ton','Ton','Prabakar.D','2025-11-11 06:45:39','Prabakar.D','2025-11-11 06:45:39'),('UNT000005','Pcs','Pieces','Prabakar.D','2025-11-11 07:09:37','Prabakar.D','2025-11-11 07:09:37');
/*!40000 ALTER TABLE `ccms_unit_type` ENABLE KEYS */;
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
