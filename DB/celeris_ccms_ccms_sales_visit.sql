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
-- Table structure for table `ccms_sales_visit`
--

DROP TABLE IF EXISTS `ccms_sales_visit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_visit` (
  `CM_Visit_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` int NOT NULL,
  `CM_Sales_Executive_ID` varchar(20) DEFAULT NULL,
  `CM_Visit_Date` date NOT NULL,
  `CM_Purpose` varchar(300) DEFAULT NULL,
  `CM_Product_Discussed` varchar(300) DEFAULT NULL,
  `CM_Scope_Given` text,
  `CM_Demo_Given` enum('Yes','No') DEFAULT 'No',
  `CM_Proposal_Value` decimal(15,2) DEFAULT NULL,
  `CM_GST_Type` varchar(50) DEFAULT NULL,
  `CM_Visit_Count` int DEFAULT '1',
  `CM_Scope_Alteration` text,
  `CM_Value_Alteration` decimal(15,2) DEFAULT NULL,
  `CM_Further_Enhancement` text,
  `CM_Issues_Raised` text,
  `CM_Project_Handed_Over` enum('Yes','No') DEFAULT 'No',
  `CM_Trial_Version_Given` enum('Yes','No') DEFAULT 'No',
  `CM_Next_Followup_Date` date DEFAULT NULL,
  `CM_Visit_Status` enum('Follow-up Needed','Interested','Not Interested','Proposal Sent','Converted') DEFAULT 'Follow-up Needed',
  `CM_Remarks` text,
  `CM_Images` json DEFAULT NULL,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_Created_By` varchar(20) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Visit_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_visit`
--

LOCK TABLES `ccms_sales_visit` WRITE;
/*!40000 ALTER TABLE `ccms_sales_visit` DISABLE KEYS */;
INSERT INTO `ccms_sales_visit` VALUES (1,1,'USR000008','2026-05-08','Demo','Yes',NULL,'No',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-11','Proposal Sent',NULL,NULL,0,NULL,'2026-05-08 15:04:20',NULL,NULL),(2,1,'USR000007','2026-05-09','Error',NULL,NULL,'No',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No',NULL,'Interested',NULL,NULL,0,NULL,'2026-05-08 15:12:15',NULL,'2026-05-08 17:56:16'),(3,2,'USR000008','2026-05-08','Demo',NULL,NULL,'No',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-11','Interested',NULL,NULL,0,NULL,'2026-05-08 15:16:19',NULL,NULL),(4,3,'USR000001','2026-05-08','Proposal given',NULL,NULL,'No',150000.00,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-21','Interested',NULL,NULL,0,NULL,'2026-05-08 15:35:23',NULL,'2026-05-08 17:56:32'),(5,4,'USR000005','2026-05-01','Get the Details ',NULL,NULL,'No',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-04','Follow-up Needed',NULL,NULL,0,NULL,'2026-05-08 15:40:32',NULL,NULL),(6,5,'USR000002','2026-05-08','New lead ','CRM',NULL,'No',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-13','Follow-up Needed',NULL,NULL,0,NULL,'2026-05-08 17:16:10',NULL,NULL),(7,5,'USR000008','2026-05-13','D',NULL,NULL,'Yes',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-19','Not Interested','Need more time ',NULL,0,NULL,'2026-05-08 17:18:08',NULL,'2026-05-08 17:49:46'),(8,6,'USR000008','2026-04-29','Online Demo ',NULL,NULL,'Yes',NULL,'Exclusive',NULL,NULL,NULL,NULL,NULL,'No','No','2026-05-11','Follow-up Needed','E-Commerce Textiles Website Needed',NULL,0,NULL,'2026-05-08 17:40:16',NULL,NULL);
/*!40000 ALTER TABLE `ccms_sales_visit` ENABLE KEYS */;
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
