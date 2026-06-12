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
-- Table structure for table `ccms_notification_replies`
--

DROP TABLE IF EXISTS `ccms_notification_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_notification_replies` (
  `CM_Reply_ID` varchar(25) NOT NULL,
  `CM_Notification_ID` varchar(25) NOT NULL,
  `CM_Sender_ID` varchar(25) NOT NULL,
  `CM_Message` text NOT NULL,
  `CM_Is_Read` tinyint(1) DEFAULT '0',
  `CM_Image` varchar(250) DEFAULT NULL,
  `CM_Reply_Date` datetime NOT NULL,
  PRIMARY KEY (`CM_Reply_ID`),
  KEY `CM_Notification_ID` (`CM_Notification_ID`),
  CONSTRAINT `ccms_notification_replies_ibfk_1` FOREIGN KEY (`CM_Notification_ID`) REFERENCES `ccms_notifications` (`CM_Notification_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_notification_replies`
--

LOCK TABLES `ccms_notification_replies` WRITE;
/*!40000 ALTER TABLE `ccms_notification_replies` DISABLE KEYS */;
INSERT INTO `ccms_notification_replies` VALUES ('RPY000001','NOT000001','USR000005','tvm project added pls enter the attendance and product',1,NULL,'2026-02-23 16:22:16'),('RPY000002','NOT000010','USR000010','Ok mam',1,NULL,'2026-04-21 13:22:24'),('RPY000003','NOT000016','USR000003','Ok',1,NULL,'2026-04-21 13:32:10'),('RPY000004','NOT000011','USR000008','ok ma\r\n\r\n\r\n',1,NULL,'2026-04-21 16:19:14'),('RPY000005','NOT000015','USR000007','300sq cable Glant need 42 nos total .\r\nUrgent 14nos mathizalagan team  ',1,NULL,'2026-04-21 18:56:26'),('RPY000006','NOT000015','USR000007','6 sq DC cable hose  need \r\nSMB fixing Bolt nut  need \r\n300 sq cable lugs need 48 nos \r\nSMB canopy sheet need 21 nos \r\n\r\n\r\n',1,NULL,'2026-04-21 19:00:06'),('RPY000007','NOT000016','USR000003','How to delete temporary employees name list ',1,NULL,'2026-05-02 17:36:22'),('RPY000008','NOT000016','USR000005','we can inactivate them',1,NULL,'2026-05-02 17:42:47'),('RPY000009','NOT000016','USR000005','good morning sir',1,NULL,'2026-05-04 10:04:56'),('RPY000010','NOT000016','USR000005','you have requested for product is that for real or testing',1,NULL,'2026-05-04 10:05:44'),('RPY000011','NOT000023','USR000002','Pls punch the app',0,NULL,'2026-05-06 07:41:21'),('RPY000012','NOT000013','USR000002','Ok',1,NULL,'2026-05-06 07:41:38'),('RPY000013','NOT000022','USR000005','ok sir',0,NULL,'2026-05-06 09:43:02'),('RPY000014','NOT000027','USR000005','ok sir',0,NULL,'2026-05-07 10:20:22'),('RPY000015','NOT000016','USR000003','Testing',1,NULL,'2026-05-07 11:52:03'),('RPY000016','NOT000016','USR000003','All work completed.',1,NULL,'2026-05-07 11:52:11'),('RPY000017','NOT000037','USR000005','ok sir',1,NULL,'2026-05-12 10:38:43'),('RPY000018','NOT000030','USR000005','please grand me leave for one day (13/05/2025) wedsday dur to family function sir',0,NULL,'2026-05-12 10:39:35'),('RPY000019','NOT000029','USR000005','please grand me leave for one day (13/05/2025) wedsday dur to family function sir',1,NULL,'2026-05-12 10:39:56'),('RPY000020','NOT000046','USR000002','Noted inform grp also ',0,NULL,'2026-05-13 09:43:46'),('RPY000021','NOT000041','USR000002','When u need the leave pls chenge the request date to hear',1,NULL,'2026-05-13 09:44:30'),('RPY000022','NOT000037','USR000003','MATERIAL REQUIREMENTS  TESTING ONLY',1,NULL,'2026-05-13 11:37:47'),('RPY000023','NOT000035','USR000003','Good afternoon sir.',0,NULL,'2026-05-13 13:30:07'),('RPY000024','NOT000035','USR000003','Good afternoon sir.',0,NULL,'2026-05-13 13:30:07'),('RPY000025','NOT000035','USR000003','Good afternoon sir. Today evening need 1 .5 hrs permission sir. Due to some urgent work at home sir. Thank you sir.',0,NULL,'2026-05-13 13:30:54');
/*!40000 ALTER TABLE `ccms_notification_replies` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:14
