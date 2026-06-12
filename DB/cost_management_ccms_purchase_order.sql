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
-- Table structure for table `ccms_purchase_order`
--

DROP TABLE IF EXISTS `ccms_purchase_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_purchase_order` (
  `CM_PO_ID` varchar(25) NOT NULL,
  `CM_PO_Number` varchar(50) NOT NULL,
  `CM_Project_ID` varchar(25) NOT NULL,
  `CM_Supplier_ID` varchar(25) NOT NULL,
  `CM_PO_Date` date NOT NULL,
  `CM_Delivery_Terms` varchar(100) DEFAULT NULL,
  `CM_Delivery_Location` varchar(100) DEFAULT NULL,
  `CM_Expected_Delivery_Date` date DEFAULT NULL,
  `CM_PO_Status` enum('Draft','Sent','Partial','Delivered','Cancelled') DEFAULT 'Draft',
  `CM_Total_Amount` decimal(35,2) DEFAULT '0.00',
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_PO_ID`),
  UNIQUE KEY `CM_PO_Number` (`CM_PO_Number`),
  KEY `FK_PO_Project` (`CM_Project_ID`),
  KEY `FK_PO_Supplier` (`CM_Supplier_ID`),
  CONSTRAINT `FK_PO_Project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`),
  CONSTRAINT `FK_PO_Supplier` FOREIGN KEY (`CM_Supplier_ID`) REFERENCES `ccms_suppliers` (`CM_Supplier_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_purchase_order`
--

LOCK TABLES `ccms_purchase_order` WRITE;
/*!40000 ALTER TABLE `ccms_purchase_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `ccms_purchase_order` ENABLE KEYS */;
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
