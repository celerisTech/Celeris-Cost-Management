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
-- Table structure for table `ccms_sales_amc`
--

DROP TABLE IF EXISTS `ccms_sales_amc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_amc` (
  `CM_AMC_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CM_Domain_Link` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CM_Start_Date` date DEFAULT NULL,
  `CM_Expiry_Date` date DEFAULT NULL,
  `CM_Amount` decimal(15,2) DEFAULT NULL,
  `CM_Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `CM_Created_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_AMC_Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Website',
  PRIMARY KEY (`CM_AMC_ID`),
  KEY `idx_amc_lead` (`CM_Lead_ID`),
  KEY `idx_amc_expiry` (`CM_Expiry_Date`),
  KEY `idx_amc_status` (`CM_Status`),
  KEY `idx_amc_deleted` (`CM_Is_Deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_amc`
--

LOCK TABLES `ccms_sales_amc` WRITE;
/*!40000 ALTER TABLE `ccms_sales_amc` DISABLE KEYS */;
INSERT INTO `ccms_sales_amc` VALUES (1,'274','Billing Application','2026-08-29','2027-08-29',3000.00,'Pending','Prabakar.D','2026-08-29 18:01:43','Prabakar.D','2026-08-29 18:01:55',1,'Product');
/*!40000 ALTER TABLE `ccms_sales_amc` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:57
