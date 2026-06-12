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
INSERT INTO `ccms_unit_type` VALUES ('UNT000001','Pcs','Pisces','Prabakar.D','2025-12-18 10:16:59','Prabakar.D','2025-12-18 10:16:59'),('UNT000002','Set','Set','Prabakar.D','2025-12-18 10:24:02','Prabakar.D','2025-12-18 10:24:02'),('UNT000003','Transport','Transport','Prabakar.D','2025-12-18 10:30:14','Prabakar.D','2025-12-18 10:30:14'),('UNT000004','Nos','Nos','Bharani Kumar.C','2026-01-23 11:46:27','Bharani Kumar.C','2026-01-23 11:46:27'),('UNT000005','Kgs',NULL,'Bharani Kumar.C','2026-01-23 11:51:29','Bharani Kumar.C','2026-01-23 11:51:29'),('UNT000006','Units',NULL,'Bharani Kumar.C','2026-01-27 11:29:10','Bharani Kumar.C','2026-01-27 11:29:10'),('UNT000007','Meter','Meter','Bharani Kumar.C','2026-01-27 11:33:25','Bharani Kumar.C','2026-01-27 11:33:25'),('UNT000008','Litter','Litter','Bharani Kumar.C','2026-01-27 11:38:00','Bharani Kumar.C','2026-01-27 11:38:00'),('UNT000009','Litter','Litter','Manohari V','2026-05-21 11:50:04',NULL,NULL),('UNT000010','Mtrs','','Manohari V','2026-05-22 12:43:36',NULL,NULL),('UNT000011','Meters','Meters','USR000001','2026-05-22 14:48:30',NULL,NULL),('UNT000012','Kg','Kg','USR000001','2026-05-22 14:48:31',NULL,NULL),('UNT000013','Lugs','Lugs','USR000001','2026-05-22 14:48:33',NULL,NULL),('UNT000014','Len','Len','USR000001','2026-05-22 14:48:35',NULL,NULL),('UNT000015','Pockets','Pockets','USR000001','2026-05-22 14:48:39',NULL,NULL),('UNT000016','Kw','Kw','USR000001','2026-05-22 14:48:39',NULL,NULL),('UNT000017','Length','Length','USR000001','2026-05-22 14:48:40',NULL,NULL),('UNT000019','Per','Per','Manohari V','2026-05-25 12:39:29',NULL,NULL);
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

-- Dump completed on 2026-06-11 18:57:15
