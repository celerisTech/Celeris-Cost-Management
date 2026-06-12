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
-- Table structure for table `ccms_project_product_updates`
--

DROP TABLE IF EXISTS `ccms_project_product_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_project_product_updates` (
  `CM_Update_ID` varchar(30) NOT NULL,
  `CM_Project_ID` varchar(25) NOT NULL,
  `CM_Milestone_ID` varchar(30) DEFAULT NULL,
  `CM_Working_Date` date DEFAULT NULL,
  `CM_Product_ID` varchar(50) NOT NULL,
  `CM_Original_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Used_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Remaining_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Report` text NOT NULL,
  `CM_Updated_By` varchar(50) DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Update_ID`),
  KEY `fk_project` (`CM_Project_ID`),
  KEY `fk_product` (`CM_Product_ID`),
  KEY `fk_product_updates_milestone` (`CM_Milestone_ID`),
  CONSTRAINT `fk_product` FOREIGN KEY (`CM_Product_ID`) REFERENCES `ccms_item_master` (`CM_Item_ID`),
  CONSTRAINT `fk_product_updates_milestone` FOREIGN KEY (`CM_Milestone_ID`) REFERENCES `ccms_milestone` (`CM_Milestone_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_project_product_updates`
--

LOCK TABLES `ccms_project_product_updates` WRITE;
/*!40000 ALTER TABLE `ccms_project_product_updates` DISABLE KEYS */;
INSERT INTO `ccms_project_product_updates` VALUES ('PPU000001','PRJ000003','MILE000004','2026-05-06','ITM000026',1.00,1.00,0.00,'Batch updated by Senkathir C on 06/05/2026, 14:41:10','Senkathir C','2026-05-06 14:41:10'),('PPU000002','PRJ000007','MILE000011','2026-05-25','ITM000068',35.00,20.00,15.00,'Batch updated by Afrose S on 5/25/2026, 1:47:07 PM','Afrose S','2026-05-25 13:47:08'),('PPU000003','PRJ000007','MILE000011','2026-05-25','ITM000061',20.00,20.00,0.00,'Batch updated by Afrose S on 5/25/2026, 1:48:07 PM','Afrose S','2026-05-25 13:48:08'),('PPU000004','PRJ000007','MILE000012','2026-05-25','ITM000115',1.00,1.00,0.00,'Batch updated by Afrose S on 5/25/2026, 1:48:25 PM','Afrose S','2026-05-25 13:48:26');
/*!40000 ALTER TABLE `ccms_project_product_updates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:09
