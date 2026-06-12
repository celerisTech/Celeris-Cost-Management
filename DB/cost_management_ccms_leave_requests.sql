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
-- Table structure for table `ccms_leave_requests`
--

DROP TABLE IF EXISTS `ccms_leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_leave_requests` (
  `CM_Leave_ID` int NOT NULL AUTO_INCREMENT,
  `CM_User_ID` varchar(25) DEFAULT NULL,
  `CM_Leave_Type` enum('Full Day','Half Day') DEFAULT 'Full Day',
  `CM_Start_Date` date DEFAULT NULL,
  `CM_End_Date` date DEFAULT NULL,
  `CM_Reason` text,
  `CM_Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `CM_Requested_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `CM_Approved_By` varchar(50) DEFAULT NULL,
  `CM_Approved_At` timestamp NULL DEFAULT NULL,
  `CM_Rejection_Reason` text,
  PRIMARY KEY (`CM_Leave_ID`),
  KEY `fk_leave_user` (`CM_User_ID`),
  CONSTRAINT `fk_leave_user` FOREIGN KEY (`CM_User_ID`) REFERENCES `ccms_users` (`CM_User_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_leave_requests`
--

LOCK TABLES `ccms_leave_requests` WRITE;
/*!40000 ALTER TABLE `ccms_leave_requests` DISABLE KEYS */;
INSERT INTO `ccms_leave_requests` VALUES (4,'USR000011','Full Day','2026-05-30','2026-06-01','Kerala marriage , family function ','Approved','2026-05-19 05:03:03','USR000002','2026-05-24 16:07:57',NULL),(5,'USR000010','Full Day','2026-05-27','2026-05-28','Need leave for two days sir due to bakrid festival sir ','Approved','2026-05-19 05:08:10','USR000002','2026-05-24 16:07:51',NULL),(6,'USR000013','Half Day','2026-05-22','2026-05-22','My friend sister baby shower function ','Rejected','2026-05-19 10:37:21','USR000005','2026-05-23 04:21:32','mohan sir rejected the lev permission'),(7,'USR000013','Half Day','2026-05-29','2026-05-29','My mama home house warming function sir .so morning session leave sir ','Approved','2026-05-19 10:39:01','USR000002','2026-05-24 16:08:10',NULL),(8,'USR000003','Half Day','2026-05-20','2026-05-21','Good morning sir.\nToday evening need 2 hr permission. And Tomorrow need full day leave ( if needed). ','Approved','2026-05-20 04:38:21','USR000005','2026-05-22 09:05:37',NULL),(9,'USR000005','Full Day','2026-05-20','2026-05-20','Unexpected family thing sir (came office at 9.30 worked till 10.40)','Approved','2026-05-20 05:05:24','USR000002','2026-05-24 01:15:43',NULL),(10,'USR000015','Full Day','2026-05-25','2026-05-25','My sister baby shower function','Approved','2026-05-22 06:22:08','USR000002','2026-05-24 07:57:13',NULL),(12,'USR000005','Full Day','2026-05-25','2026-05-25','Good morning sir Severe caugh,fever and stomach pain sir.going for treatment ','Approved','2026-05-25 04:34:42','USR000008','2026-05-25 05:35:06',NULL),(13,'USR000002','Full Day','2026-05-28','2026-05-28','Going to Bhavangathi Amman Temple Kanyakumari and Marriage Function is there salem also need one day leave ','Approved','2026-05-25 05:57:34','USR000005','2026-05-27 04:58:11',NULL),(14,'USR000005','Full Day','2026-05-26','2026-05-26','Going hospital for treatment pls grand me one day lev and I will come office tomorrow sir','Approved','2026-05-26 02:56:42','USR000008','2026-05-26 11:58:40',NULL),(15,'USR000003','Full Day','2026-05-29','2026-05-29','Good evening sir.\nComing Friday possible for leave sir. Still now not confirmed. Based on time taking leave sir. Thank you sir.','Approved','2026-05-27 13:30:52','USR000012','2026-05-28 04:24:15',NULL);
/*!40000 ALTER TABLE `ccms_leave_requests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:21
