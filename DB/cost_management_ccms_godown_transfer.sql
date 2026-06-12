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
-- Table structure for table `ccms_godown_transfer`
--

DROP TABLE IF EXISTS `ccms_godown_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_godown_transfer` (
  `CM_Transfer_ID` varchar(25) NOT NULL,
  `CM_Product_ID` varchar(25) DEFAULT NULL,
  `CM_Item_ID` varchar(25) DEFAULT NULL,
  `CM_Source_Godown_ID` varchar(25) DEFAULT NULL,
  `CM_Destination_Godown_ID` varchar(25) DEFAULT NULL,
  `CM_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Transfer_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Notes` text,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Transfer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_godown_transfer`
--

LOCK TABLES `ccms_godown_transfer` WRITE;
/*!40000 ALTER TABLE `ccms_godown_transfer` DISABLE KEYS */;
INSERT INTO `ccms_godown_transfer` VALUES ('TRS000001','0','ITM000140','GOD000004','GOD000003',50.00,'2026-05-29 12:22:10','','Bharani Kumar.C','2026-05-29 12:22:10'),('TRS000002','0','ITM000192','GOD000005','GOD000004',40.00,'2026-06-01 05:27:50','','Bharani Kumar.C','2026-06-01 05:27:50');
/*!40000 ALTER TABLE `ccms_godown_transfer` ENABLE KEYS */;
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
