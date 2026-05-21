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
-- Table structure for table `ccms_item_master`
--

DROP TABLE IF EXISTS `ccms_item_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_item_master` (
  `CM_Item_ID` varchar(25) NOT NULL,
  `CM_Item_Code` varchar(50) DEFAULT NULL,
  `CM_Item_Name` text,
  `CM_Item_Description` text,
  `CM_Category_ID` varchar(25) DEFAULT NULL,
  `CM_Subcategory_ID` varchar(25) DEFAULT NULL,
  `CM_Unit_Type` varchar(50) DEFAULT NULL,
  `CM_Stock_Level` int DEFAULT NULL,
  `CM_HSN_ASC_Code` varchar(50) DEFAULT NULL,
  `CM_Is_Status` enum('Active','Inactive') DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Item_ID`),
  KEY `fk_item_category` (`CM_Category_ID`),
  KEY `fk_item_subcategory` (`CM_Subcategory_ID`),
  KEY `fk_item_companies` (`CM_Company_ID`),
  KEY `fk_ccms_unit_type` (`CM_Unit_Type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_item_master`
--

LOCK TABLES `ccms_item_master` WRITE;
/*!40000 ALTER TABLE `ccms_item_master` DISABLE KEYS */;
INSERT INTO `ccms_item_master` VALUES ('ITM000001','01','600W TOPCon solar panels','600W TOPCon solar panels (DHOOP)','CAT000001','SUB000001','UNT000005',320,'85414011','Active','COM000001','Prabakar.D','2025-11-11 09:36:47',NULL,NULL),('ITM000002','03','Sungrow 10 kW Solar Inverter','Sungrow 10 kW Solar Inverter','CAT000002','SUB000004','UNT000005',5,'20','Active','COM000001','Prabakar.D','2025-11-12 04:16:03',NULL,NULL),('ITM000003','02','Cement','Cement','CAT000003','SUB000005','UNT000003',60,'2014','Active','COM000001','Prabakar.D','2025-11-12 04:45:47',NULL,NULL);
/*!40000 ALTER TABLE `ccms_item_master` ENABLE KEYS */;
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
