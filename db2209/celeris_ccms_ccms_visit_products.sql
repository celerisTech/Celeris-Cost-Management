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
-- Table structure for table `ccms_visit_products`
--

DROP TABLE IF EXISTS `ccms_visit_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_visit_products` (
  `Product_ID` int NOT NULL AUTO_INCREMENT,
  `Product_Name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Color_Code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'blue',
  `Is_Active` tinyint(1) DEFAULT '1',
  `Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Product_ID`),
  UNIQUE KEY `Product_Name` (`Product_Name`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_visit_products`
--

LOCK TABLES `ccms_visit_products` WRITE;
/*!40000 ALTER TABLE `ccms_visit_products` DISABLE KEYS */;
INSERT INTO `ccms_visit_products` VALUES (1,'Billing Application','indigo',1,'2026-06-23 16:52:17','2026-06-23 16:52:17'),(2,'Dental','emerald',1,'2026-06-23 16:52:17','2026-06-23 16:52:17'),(3,'CCMS','blue',1,'2026-06-23 16:52:17','2026-06-23 16:52:17'),(4,'Pay+','purple',1,'2026-06-23 16:52:17','2026-06-23 16:52:17'),(5,'Chitfund App','teal',1,'2026-06-25 12:22:02','2026-06-25 12:22:27'),(6,'Digigold','amber',1,'2026-06-25 13:00:12','2026-06-25 13:00:12'),(7,'Website','indigo',1,'2026-06-25 15:15:53','2026-06-25 15:15:53'),(8,'FMCG Order','amber',1,'2026-06-26 11:39:59','2026-06-26 11:39:59'),(9,'HMS','blue',1,'2026-06-27 13:20:33','2026-06-27 13:20:33'),(10,'KOT','teal',1,'2026-07-01 11:42:37','2026-07-01 11:42:37'),(11,'DIGITAL MARKETING','blue',1,'2026-07-01 11:49:15','2026-07-01 11:49:15'),(12,'E - Commerce','purple',1,'2026-07-01 13:18:12','2026-07-01 13:18:12'),(13,'CMS','blue',1,'2026-07-02 22:00:57','2026-07-02 22:00:57'),(14,'Celeris Estimator App','red',1,'2026-07-04 11:22:12','2026-07-04 11:22:12'),(15,'Business Partner','amber',1,'2026-07-05 23:31:22','2026-07-05 23:31:22'),(17,'Voice2Text App','blue',1,'2026-07-10 14:18:41','2026-07-10 14:19:51'),(18,'All products','blue',1,'2026-07-13 20:17:04','2026-07-13 20:17:04'),(19,'Product Management ','amber',1,'2026-07-14 10:58:45','2026-07-14 10:58:45'),(20,'Rental Management','blue',1,'2026-07-14 18:56:30','2026-07-14 18:56:30'),(21,'Spinning Mill Modules','blue',1,'2026-07-14 19:08:19','2026-07-14 19:08:19'),(22,'Production Modules','blue',1,'2026-07-27 14:50:26','2026-07-27 14:50:26'),(23,'Pawn broking','blue',1,'2026-08-11 18:50:43','2026-08-11 18:50:43'),(24,'CRM','blue',1,'2026-09-01 14:35:48','2026-09-01 14:35:48'),(25,'Franchise','blue',1,'2026-09-01 14:37:59','2026-09-01 14:37:59'),(26,'Rental Application','blue',1,'2026-09-01 18:11:02','2026-09-01 18:11:02'),(27,'track -c','blue',1,'2026-09-03 15:52:48','2026-09-03 15:52:48'),(28,'Digital Marketting','blue',1,'2026-09-03 16:13:11','2026-09-03 16:13:11');
/*!40000 ALTER TABLE `ccms_visit_products` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:53
