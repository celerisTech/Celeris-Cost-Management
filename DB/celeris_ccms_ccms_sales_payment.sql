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
-- Table structure for table `ccms_sales_payment`
--

DROP TABLE IF EXISTS `ccms_sales_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_payment` (
  `CM_Payment_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` int NOT NULL,
  `CM_Payment_Date` date NOT NULL,
  `CM_Payment_Type` enum('Advance','Partial Payment','Final Payment') DEFAULT 'Advance',
  `CM_Amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `CM_Payment_Mode` varchar(50) DEFAULT NULL,
  `CM_Reference_Number` varchar(100) DEFAULT NULL,
  `CM_Payment_Status` enum('Pending','Paid','Failed') DEFAULT 'Pending',
  `CM_Receipt_URL` varchar(500) DEFAULT NULL,
  `CM_Remarks` text,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_Created_By` varchar(20) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Payment_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_payment`
--

LOCK TABLES `ccms_sales_payment` WRITE;
/*!40000 ALTER TABLE `ccms_sales_payment` DISABLE KEYS */;
INSERT INTO `ccms_sales_payment` VALUES (1,2,'2026-05-08','Advance',10000.00,'Cash',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-08 15:17:02',NULL,NULL),(2,6,'2026-05-01','Advance',1000.00,'Online','9940356707','Paid',NULL,'Balane - 4000',0,NULL,'2026-05-08 17:43:41',NULL,NULL);
/*!40000 ALTER TABLE `ccms_sales_payment` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:26
