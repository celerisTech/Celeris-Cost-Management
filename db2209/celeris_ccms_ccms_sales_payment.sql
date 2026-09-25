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
-- Table structure for table `ccms_sales_payment`
--

DROP TABLE IF EXISTS `ccms_sales_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_payment` (
  `CM_Payment_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Lead_ID` int NOT NULL,
  `CM_Payment_Date` date NOT NULL,
  `CM_Payment_Type` enum('Advance','Partial Payment','Final Payment','Domain Payment') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `CM_Amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `CM_Payment_Mode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Reference_Number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Payment_Status` enum('Pending','Paid','Failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `CM_Receipt_URL` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Is_Deleted` tinyint(1) DEFAULT '0',
  `CM_Created_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `CM_AMC_ID` int DEFAULT NULL,
  PRIMARY KEY (`CM_Payment_ID`),
  KEY `idx_sales_payment_lead` (`CM_Lead_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_payment`
--

LOCK TABLES `ccms_sales_payment` WRITE;
/*!40000 ALTER TABLE `ccms_sales_payment` DISABLE KEYS */;
INSERT INTO `ccms_sales_payment` VALUES (1,3,'2026-05-12','Advance',10000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-05-12 12:08:46',NULL,'2026-05-12 12:10:51',NULL),(2,10,'2026-05-13','Advance',15000.00,'Online',NULL,'Paid',NULL,'Advance Payment Received',0,NULL,'2026-05-13 18:51:18',NULL,'2026-05-25 13:08:36',NULL),(3,11,'2026-05-04','Advance',15000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-05-25 11:44:09',NULL,'2026-05-25 11:55:28',NULL),(4,81,'2026-05-05','Advance',10000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 11:52:27',NULL,'2026-05-25 14:29:17',NULL),(5,76,'2026-05-04','Advance',15000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 11:56:54',NULL,'2026-05-25 13:01:27',NULL),(6,263,'2026-05-05','Final Payment',29500.00,'Bank Transfer',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 12:20:37',NULL,'2026-05-25 13:13:52',NULL),(7,269,'2026-05-08','Advance',20000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 13:04:02',NULL,NULL,NULL),(8,269,'2026-05-08','Advance',4300.00,'Online',NULL,'Pending',NULL,NULL,1,NULL,'2026-05-25 13:05:25',NULL,'2026-05-25 14:27:43',NULL),(9,81,'2026-05-11','Advance',4000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-05-25 13:08:09',NULL,'2026-05-25 14:28:01',NULL),(10,274,'2026-05-20','Advance',100000.00,'Bank Transfer',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 13:13:34',NULL,NULL,NULL),(11,81,'2026-05-25','Advance',10000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-05-25 14:25:23',NULL,'2026-05-25 17:32:39',NULL),(12,275,'2026-05-22','Advance',2500.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 14:26:43',NULL,NULL,NULL),(13,268,'2026-05-06','Advance',6000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-05-25 16:22:13',NULL,NULL,NULL),(14,269,'2026-05-08','Advance',20000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-05-29 08:44:59',NULL,'2026-05-29 09:41:06',NULL),(15,268,'2026-06-05','Final Payment',9000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-06-08 15:16:23',NULL,NULL,NULL),(16,79,'2026-06-06','Final Payment',22500.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-06-09 09:47:00',NULL,'2026-06-09 09:51:51',NULL),(17,269,'2026-06-06','Final Payment',22500.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-06-09 09:52:09',NULL,'2026-06-09 10:04:36',NULL),(18,12,'2026-06-09','Final Payment',20000.00,'Online',NULL,'Paid',NULL,NULL,1,NULL,'2026-06-09 10:04:16',NULL,'2026-06-09 10:04:27',NULL),(19,15,'2026-06-11','Final Payment',28700.00,'Bank Transfer',NULL,'Paid',NULL,NULL,0,NULL,'2026-06-12 17:14:58',NULL,'2026-06-12 18:31:55',NULL),(20,950,'2026-06-25','Final Payment',15000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-07-03 11:15:30',NULL,NULL,NULL),(21,79,'2026-07-21','Domain Payment',4300.00,'Cash',NULL,'Paid',NULL,'Domain Amount paid',0,'USR000015','2026-07-21 18:18:57',NULL,NULL,NULL),(22,1191,'2026-07-17','Advance',10000.00,'Cash',NULL,'Paid',NULL,'Amudha surabi Ecommerce + billing',0,'USR000015','2026-07-21 18:32:41',NULL,NULL,NULL),(23,1149,'2026-07-15','Advance',5000.00,'Cash',NULL,'Paid',NULL,'Billing 5000 paid of Rs.17700',0,'USR000015','2026-07-21 18:33:48',NULL,NULL,NULL),(24,76,'2026-07-15','Advance',15000.00,'Bank Transfer',NULL,'Paid',NULL,'Trust amount 15000 paid',0,'USR000015','2026-07-21 18:34:40',NULL,NULL,NULL),(25,832,'2026-07-24','Advance',5000.00,'Bank Transfer',NULL,'Paid',NULL,'Balance to pay Rs.30960. Website + billing',0,'USR000015','2026-07-24 11:07:06',NULL,NULL,NULL),(26,875,'2026-07-24','Final Payment',10000.00,'Bank Transfer',NULL,'Paid',NULL,'Website amount',0,'USR000015','2026-07-24 11:11:29',NULL,NULL,NULL),(27,875,'2026-07-22','Final Payment',4500.00,'Bank Transfer',NULL,'Paid',NULL,'Rental booking ',0,'USR000015','2026-07-24 11:12:21',NULL,NULL,NULL),(28,269,'2026-07-21','Domain Payment',4300.00,'Bank Transfer',NULL,'Paid',NULL,'Domain purchase amount paid',0,'USR000015','2026-07-24 11:13:24',NULL,NULL,NULL),(29,263,'2026-07-25','Partial Payment',177000.00,'Bank Transfer',NULL,'Paid',NULL,'Paid 1.77L with GST',0,'USR000015','2026-07-27 13:48:42',NULL,NULL,NULL),(30,1149,'2026-07-25','Partial Payment',7000.00,'Cash',NULL,'Paid',NULL,'Total Rs.17700. Balance to pay Rs.5770',0,'USR000015','2026-07-27 13:50:00',NULL,NULL,NULL),(31,875,'2026-07-12','Partial Payment',9000.00,'Bank Transfer',NULL,'Paid',NULL,'Balance to pay 4500. Total 22,500',0,'USR000015','2026-07-27 13:51:44',NULL,NULL,NULL),(32,832,'2026-07-29','Final Payment',5000.00,'Bank Transfer',NULL,'Paid',NULL,'Website full payment received',0,'USR000015','2026-08-06 12:08:45',NULL,NULL,NULL),(33,897,'2026-08-01','Advance',20000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-08-06 14:35:43',NULL,'2026-08-08 10:30:09',NULL),(34,1191,'2026-08-03','Partial Payment',10000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-08-08 10:21:56',NULL,NULL,NULL),(35,1191,'2026-08-06','Partial Payment',15000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-08-08 10:22:21',NULL,NULL,NULL),(36,1188,'2026-08-05','Advance',25000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-08-08 10:25:23',NULL,NULL,NULL),(37,81,'2026-08-07','Partial Payment',15000.00,'UPI',NULL,'Paid',NULL,NULL,0,'USR000008','2026-08-08 10:28:37',NULL,NULL,NULL),(38,1112,'2026-08-15','Advance',25000.00,'Online',NULL,'Paid',NULL,NULL,0,NULL,'2026-08-17 11:46:09',NULL,NULL,NULL),(39,1132,'2026-08-20','Partial Payment',25000.00,'Bank Transfer',NULL,'Paid',NULL,'25000 Paid',0,'USR000015','2026-08-20 23:56:28',NULL,NULL,NULL),(40,269,'2026-08-20','Partial Payment',10000.00,'Bank Transfer',NULL,'Paid',NULL,'10000 paid',0,'USR000015','2026-08-20 23:58:15',NULL,NULL,NULL);
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

-- Dump completed on 2026-09-22 16:07:50
