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
-- Table structure for table `ccms_sales_lead`
--

DROP TABLE IF EXISTS `ccms_sales_lead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_lead` (
  `CM_Lead_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Client_Name` varchar(150) NOT NULL,
  `CM_Company_Name` varchar(200) DEFAULT NULL,
  `CM_Phone` varchar(20) NOT NULL,
  `CM_Alt_Phone` varchar(20) DEFAULT NULL,
  `CM_Email` varchar(150) DEFAULT NULL,
  `CM_Address` text,
  `CM_City` varchar(100) DEFAULT NULL,
  `CM_Lead_Source` varchar(100) DEFAULT NULL,
  `CM_Product_Required` varchar(200) DEFAULT NULL,
  `CM_Project_Type` varchar(100) DEFAULT NULL,
  `CM_Expected_Budget` decimal(15,2) DEFAULT NULL,
  `CM_Sales_Executive_ID` varchar(20) DEFAULT NULL,
  `CM_Lead_Status` enum('New Lead','Visited','Demo Given','Proposal Sent','Negotiation','Converted','Rejected','On Hold') DEFAULT 'New Lead',
  `CM_Remarks` text,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_Created_By` varchar(20) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Lead_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_lead`
--

LOCK TABLES `ccms_sales_lead` WRITE;
/*!40000 ALTER TABLE `ccms_sales_lead` DISABLE KEYS */;
INSERT INTO `ccms_sales_lead` VALUES (1,'Saran Solar','Saran','9685741236',NULL,'saran@gmail.com','gobi','kullampalayam','Referral','ccms',NULL,40000.00,'USR000008','Visited','First time',0,NULL,'2026-05-08 15:02:58',NULL,'2026-05-08 15:04:20'),(2,'SRM','SRM','7894561236',NULL,NULL,NULL,NULL,'Referral','Billing',NULL,NULL,'USR000008','Visited',NULL,0,NULL,'2026-05-08 15:15:27',NULL,'2026-05-08 15:16:19'),(3,'Saranya','PHE','6379100400',NULL,'phe@gmail.com',NULL,'Kunnathor','Referral','Pay+',NULL,0.00,'USR000007','Demo Given',NULL,0,NULL,'2026-05-08 15:27:28',NULL,'2026-05-08 15:38:01'),(4,'Suresh','Yaksha System','1478523695',NULL,NULL,NULL,NULL,'Other','Track C',NULL,NULL,'USR000006','Demo Given',NULL,0,NULL,'2026-05-08 15:39:41',NULL,'2026-05-08 16:24:29'),(5,'Senthil Erode',NULL,'97888 32555',NULL,NULL,NULL,NULL,'Referral','Billing Application',NULL,NULL,'USR000008','Demo Given',NULL,0,NULL,'2026-05-08 16:58:25',NULL,'2026-05-08 17:18:08'),(6,'Senthil Bhavani','Sri Ramana Textiles','9443014614',NULL,NULL,NULL,NULL,'Referral','e-Commerce',NULL,NULL,'USR000008','Visited','Saravan Referral\n',0,NULL,'2026-05-08 17:38:37',NULL,'2026-05-09 10:46:50'),(7,'w',NULL,'741289632',NULL,NULL,NULL,NULL,'Direct',NULL,NULL,NULL,'USR000006','New Lead',NULL,1,NULL,'2026-05-12 10:13:09',NULL,'2026-05-12 11:35:32'),(8,'c',NULL,'4125369874',NULL,NULL,NULL,NULL,'Direct',NULL,NULL,NULL,'USR000012','New Lead',NULL,1,NULL,'2026-05-12 11:35:43',NULL,'2026-05-12 11:35:46');
/*!40000 ALTER TABLE `ccms_sales_lead` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:29
