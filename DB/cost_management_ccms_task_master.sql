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
-- Table structure for table `ccms_task_master`
--

DROP TABLE IF EXISTS `ccms_task_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_task_master` (
  `CM_Task_ID` varchar(25) NOT NULL,
  `CM_Task_Name` varchar(250) DEFAULT NULL,
  `CM_Milestone_ID` varchar(25) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Project_ID` varchar(25) DEFAULT NULL,
  `CM_Engineer_ID` varchar(25) DEFAULT NULL,
  `CM_Assign_Date` date DEFAULT NULL,
  `CM_Due_Date` date DEFAULT NULL,
  `CM_Is_Active` enum('Active','Inactive') DEFAULT NULL,
  `CM_Image_URL` text,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  `CM_Is_Seen` enum('Yes','No') DEFAULT 'No',
  PRIMARY KEY (`CM_Task_ID`),
  KEY `fk_task_company` (`CM_Company_ID`),
  KEY `fk_task_project` (`CM_Project_ID`),
  KEY `fk_task_engineer` (`CM_Engineer_ID`),
  KEY `fk_task_milestone` (`CM_Milestone_ID`),
  CONSTRAINT `fk_task_company` FOREIGN KEY (`CM_Company_ID`) REFERENCES `ccms_companies` (`CM_Company_ID`),
  CONSTRAINT `fk_task_engineer` FOREIGN KEY (`CM_Engineer_ID`) REFERENCES `ccms_users` (`CM_User_ID`),
  CONSTRAINT `fk_task_milestone` FOREIGN KEY (`CM_Milestone_ID`) REFERENCES `ccms_milestone` (`CM_Milestone_ID`),
  CONSTRAINT `fk_task_project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_task_master`
--

LOCK TABLES `ccms_task_master` WRITE;
/*!40000 ALTER TABLE `ccms_task_master` DISABLE KEYS */;
INSERT INTO `ccms_task_master` VALUES ('TSK000001','Civil Works','MILE000001','COM000001','PRJ000001','USR000002','2025-10-08','2026-01-15','Active',NULL,'Bharani Kumar.C','2025-12-23 16:36:44',NULL,'2026-01-12 12:10:18','No'),('TSK000002','MMS work','MILE000001','COM000001','PRJ000001','USR000002','2025-10-08','2026-01-15','Active',NULL,'Bharani Kumar.C','2025-12-23 16:36:45','Bharani Kumar.C','2025-12-23 16:36:45','No'),('TSK000003','panel fitting','MILE000002','COM000001','PRJ000001','USR000002','2026-01-16','2026-02-23','Active',NULL,'Bharani Kumar.C','2025-12-23 16:36:53','Bharani Kumar.C','2025-12-23 16:36:53','No'),('TSK000004','commissioning work','MILE000002','COM000001','PRJ000001','USR000006','2026-01-16','2026-02-23','Active',NULL,'Bharani Kumar.C','2025-12-23 16:36:56',NULL,'2026-01-29 16:41:33','No'),('TSK000005','Civil Work ','MILE000003','COM000001','PRJ000002','USR000004','2025-08-18','2025-12-31','Active',NULL,'Unknown User','2026-01-21 16:56:05','Unknown User','2026-01-21 16:56:05','Yes'),('TSK000006','Civil Work','MILE000004','COM000001','PRJ000003','USR000004','2026-01-01','2026-02-15','Active',NULL,'Bharani Kumar.C','2026-01-21 16:56:50','Senkathir C','2026-05-12 11:22:35','Yes'),('TSK000007','All Works','MILE000005','COM000001','PRJ000004','USR000002','2025-08-18','2026-01-01','Active',NULL,'Bharani Kumar.C','2026-01-21 17:25:59',NULL,'2026-01-22 12:37:38','Yes'),('TSK000008','Commissioning Work','MILE000006','COM000001','PRJ000004','USR000002','2026-01-02','2026-02-01','Active',NULL,'Bharani Kumar.C','2026-01-21 17:25:59',NULL,'2026-01-22 12:38:10','Yes'),('TSK000009','All Work','MILE000007','COM000001','PRJ000005','USR000003','2026-02-01','2026-03-01','Active',NULL,'Bharani Kumar.C','2026-02-17 17:28:14','Bharani Kumar.C','2026-02-17 17:28:14','Yes'),('TSK000010','Designing','MILE000004','COM000001','PRJ000003','USR000009','2026-01-01','2026-02-15','Active',NULL,'Unknown User','2026-03-09 10:31:14','Unknown User','2026-03-09 10:31:14','No'),('TSK000011','Site Supervisor','MILE000004','COM000001','PRJ000003','USR000007','2026-01-01','2026-05-31','Active',NULL,'Unknown User','2026-04-24 16:10:19',NULL,'2026-04-24 16:18:43','Yes'),('TSK000013','Civil Works','MILE000006','COM000001','PRJ000004','USR000004','2026-04-02','2026-05-15','Inactive',NULL,'Unknown User','2026-04-29 10:50:25','Senkathir C','2026-05-12 11:18:04','Yes'),('TSK000014','Civil Works','MILE000003','COM000001','PRJ000002','USR000004','2025-08-18','2026-05-15','Active',NULL,'Unknown User','2026-04-29 10:51:49','Unknown User','2026-04-29 10:51:49','Yes'),('TSK000015','Procurement- Mounting Structure','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-05','Active',NULL,'Sri Nikhil','2026-05-05 15:28:12','Sri Nikhil','2026-05-05 15:31:16','Yes'),('TSK000016','Procurement- Solar Panels','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-04-30','Active',NULL,'Sri Nikhil','2026-05-05 15:34:43','Rithani  T','2026-05-12 13:31:53','Yes'),('TSK000017','Procurement- Walkway And Guard Rail','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-15','Active',NULL,'Sri Nikhil','2026-05-05 15:35:54','Sri Nikhil','2026-05-05 15:35:54','Yes'),('TSK000018','Procurement- Ac Cables','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-15','Active',NULL,'Sri Nikhil','2026-05-05 15:36:41','Sri Nikhil','2026-05-18 11:51:55','Yes'),('TSK000019','Commissioning Work','MILE000006','COM000001','PRJ000004','USR000013','2026-05-07','2026-05-14','Active',NULL,'Rithani  T','2026-05-07 13:02:10','Rithani  T','2026-05-07 13:02:10','Yes'),('TSK000020','Procurement- Dc Cables','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-04-30','Active',NULL,'Sri Nikhil','2026-05-18 11:53:04','Rithani  T','2026-05-18 15:30:47','Yes'),('TSK000021','Mini Rail Fixing','MILE000011','COM000001','PRJ000007','USR000010','2026-05-13','2026-05-16','Active',NULL,'Sri Nikhil','2026-05-18 11:57:54','Sri Nikhil','2026-05-18 11:57:54','Yes'),('TSK000022','Solar Panel fixing','MILE000011','COM000001','PRJ000007','USR000010','2026-05-13','2026-05-20','Active',NULL,'Sri Nikhil','2026-05-18 12:00:28','Sri Nikhil','2026-05-18 12:00:28','Yes'),('TSK000023','String Connection','MILE000011','COM000001','PRJ000007','USR000010','2026-05-17','2026-05-20','Active',NULL,'Sri Nikhil','2026-05-18 12:02:59','Sri Nikhil','2026-05-18 12:02:59','Yes'),('TSK000025','Pipe Materials Purchase','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-07','Active',NULL,'Rithani  T','2026-05-19 10:14:56','Rithani  T','2026-05-19 10:14:56','Yes'),('TSK000026','DCDB Box','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-15','Active',NULL,'Rithani  T','2026-05-19 10:17:46','Rithani  T','2026-05-19 10:17:46','Yes'),('TSK000028','ACDB BOX ','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-15','Active',NULL,'Rithani  T','2026-05-19 10:18:27','Rithani  T','2026-05-19 10:18:27','Yes'),('TSK000029','pipe line work','MILE000006','COM000001','PRJ000004','USR000015','2026-05-20','2026-06-05','Active',NULL,'Rithani  T','2026-05-20 10:44:34','Rithani  T','2026-05-20 10:44:34','No'),('TSK000030','Inverter Purchase','MILE000010','COM000001','PRJ000007','USR000005','2026-04-27','2026-05-15','Active',NULL,'Rithani  T','2026-05-20 10:46:57','Rithani  T','2026-05-20 10:46:57','Yes'),('TSK000031','material purchase','MILE000003','COM000001','PRJ000002','USR000016','2025-08-18','2026-05-15','Active',NULL,'Rithani  T','2026-05-20 13:43:42','Rithani  T','2026-05-20 13:43:42','Yes'),('TSK000032','Walk Way Fixing','MILE000011','COM000001','PRJ000007','USR000010','2026-05-15','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 09:42:22','Rithani  T','2026-05-29 09:42:22','Yes'),('TSK000033','Hand Rail Fixing','MILE000011','COM000001','PRJ000007','USR000010','2026-05-08','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 09:43:24','Rithani  T','2026-05-29 09:43:24','Yes'),('TSK000034','Cable Tray Fixing Work','MILE000012','COM000001','PRJ000007','USR000010','2026-05-21','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 09:54:28','Rithani  T','2026-05-29 09:54:28','Yes'),('TSK000035','Earth Strip Laying Work','MILE000011','COM000001','PRJ000007','USR000010','2026-05-20','2026-05-29','Active',NULL,'Rithani  T','2026-05-29 09:55:20','Rithani  T','2026-05-29 09:55:20','Yes'),('TSK000036','Lightning Arrester Fixing','MILE000011','COM000001','PRJ000007','USR000010','2026-05-26','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 10:01:32','Rithani  T','2026-05-29 10:01:32','Yes'),('TSK000037','String Cable Laying Under Ground','MILE000012','COM000001','PRJ000007','USR000010','2026-05-21','2026-05-29','Active',NULL,'Rithani  T','2026-05-29 10:02:19','Rithani  T','2026-05-29 10:02:19','Yes'),('TSK000038','Cable Termination','MILE000012','COM000001','PRJ000007','USR000010','2026-05-25','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 10:03:22','Rithani  T','2026-05-29 10:03:22','Yes'),('TSK000039','Net Metering','MILE000013','COM000001','PRJ000007','USR000010','2026-05-29','2026-05-31','Active',NULL,'Rithani  T','2026-05-29 10:16:28','Rithani  T','2026-05-29 10:16:28','Yes'),('TSK000040','Civil Works','MILE000001','COM000001','PRJ000001','USR000004','2025-10-08','2026-01-15','Active',NULL,'Rithani  T','2026-05-29 13:47:57','Rithani  T','2026-05-29 13:47:57','No');
/*!40000 ALTER TABLE `ccms_task_master` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:16
