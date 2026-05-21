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
-- Table structure for table `ccms_product_allocation_request_items`
--

DROP TABLE IF EXISTS `ccms_product_allocation_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_product_allocation_request_items` (
  `CM_Item_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Request_ID` varchar(20) NOT NULL,
  `CM_Product_ID` varchar(20) NOT NULL,
  `CM_Item_Master_ID` varchar(20) NOT NULL,
  `CM_Requested_Quantity` int NOT NULL,
  `CM_Available_Quantity` int NOT NULL,
  `CM_Shortage_Quantity` int DEFAULT '0',
  `CM_Unit_Type` varchar(20) DEFAULT NULL,
  `CM_Unit_Price` decimal(25,2) DEFAULT NULL,
  `CM_Status` enum('Pending','Approved','Rejected','Partially Approved') DEFAULT 'Pending',
  `CM_Approved_Quantity` int DEFAULT NULL,
  `CM_Notes` text,
  `CM_Pending_Quantity` int DEFAULT '0',
  PRIMARY KEY (`CM_Item_ID`),
  KEY `CM_Request_ID` (`CM_Request_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_product_allocation_request_items`
--

LOCK TABLES `ccms_product_allocation_request_items` WRITE;
/*!40000 ALTER TABLE `ccms_product_allocation_request_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `ccms_product_allocation_request_items` ENABLE KEYS */;
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
