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
-- Table structure for table `ccms_task_update`
--

DROP TABLE IF EXISTS `ccms_task_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_task_update` (
  `CM_Update_ID` varchar(25) NOT NULL,
  `CM_Task_ID` varchar(25) DEFAULT NULL,
  `CM_Project_ID` varchar(25) DEFAULT NULL,
  `CM_Engineer_ID` varchar(25) DEFAULT NULL,
  `CM_Update_Date` date DEFAULT NULL,
  `CM_Status` enum('Pending','In Progress','Completed','On Hold') DEFAULT NULL,
  `CM_Remarks` text,
  `CM_Work_Hours` decimal(5,2) DEFAULT NULL,
  `CM_Image_URL` text,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Update_ID`),
  KEY `fk_taskupdate_task` (`CM_Task_ID`),
  KEY `fk_taskupdate_project` (`CM_Project_ID`),
  KEY `fk_taskupdate_engineer` (`CM_Engineer_ID`),
  CONSTRAINT `fk_taskupdate_engineer` FOREIGN KEY (`CM_Engineer_ID`) REFERENCES `ccms_users` (`CM_User_ID`),
  CONSTRAINT `fk_taskupdate_project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`),
  CONSTRAINT `fk_taskupdate_task` FOREIGN KEY (`CM_Task_ID`) REFERENCES `ccms_task_master` (`CM_Task_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_task_update`
--

LOCK TABLES `ccms_task_update` WRITE;
/*!40000 ALTER TABLE `ccms_task_update` DISABLE KEYS */;
INSERT INTO `ccms_task_update` VALUES ('UPD000001','TSK000001','PRJ000001','USR000002','2026-01-11','In Progress','Start',9.00,NULL,'Saravanan  C','2026-01-23 12:17:16'),('UPD000002','TSK000006','PRJ000003','USR000004','2026-01-29','In Progress','VCB bed construction work going on ',8.00,'/uploads/1769684711050-1000050851.jpg','Senkathir C','2026-01-29 16:35:11'),('UPD000003','TSK000005','PRJ000002','USR000004','2026-01-29','Completed','',8.00,NULL,'Senkathir C','2026-01-29 17:06:37'),('UPD000004','TSK000009','PRJ000005','USR000003','2026-04-21','Completed','',0.00,NULL,'Viji S','2026-04-21 13:31:41'),('UPD000005','TSK000014','PRJ000002','USR000004','2026-05-12','Completed','',0.00,NULL,'Senkathir C','2026-05-12 11:20:08'),('UPD000006','TSK000013','PRJ000004','USR000004','2026-05-12','Completed','',0.00,NULL,'Senkathir C','2026-05-12 11:20:37'),('UPD000007','TSK000006','PRJ000003','USR000004','2026-05-12','Completed','',0.00,NULL,'Senkathir C','2026-05-12 11:21:00'),('UPD000008','TSK000015','PRJ000007','USR000005','2026-05-12','Completed','clamp not purchased ',0.00,NULL,'Rithani  T','2026-05-18 11:45:55'),('UPD000009','TSK000016','PRJ000007','USR000005','2026-04-30','Completed','Taken Forn BSV',0.00,NULL,'Rithani  T','2026-05-18 11:47:27'),('UPD000010','TSK000017','PRJ000007','USR000005','2026-05-11','Completed','',12.00,NULL,'Rithani  T','2026-05-18 11:49:24'),('UPD000011','TSK000018','PRJ000007','USR000005','2026-05-12','Completed','',7.00,NULL,'Rithani  T','2026-05-18 11:50:10'),('UPD000012','TSK000020','PRJ000007','USR000005','2026-05-18','Completed','',0.00,NULL,'Rithani  T','2026-05-18 15:30:10'),('UPD000013','TSK000026','PRJ000007','USR000005','2026-05-19','Completed','',0.00,NULL,'Rithani  T','2026-05-20 10:45:56'),('UPD000014','TSK000025','PRJ000007','USR000005','2026-05-19','Completed','',0.00,NULL,'Rithani  T','2026-05-20 10:46:11'),('UPD000015','TSK000030','PRJ000007','USR000005','2026-05-12','Completed','',0.00,NULL,'Rithani  T','2026-05-20 10:47:19'),('UPD000016','TSK000021','PRJ000007','USR000010','2026-05-18','Completed','Mini rail fixing work completed ',24.00,'/uploads/1779264641105-1000328692.jpg','Afrose S','2026-05-20 13:40:41'),('UPD000017','TSK000022','PRJ000007','USR000010','2026-05-20','Completed','Panel fixing work completed allignment checking work going on ',24.00,'/uploads/1779264975591-1000329896.jpg','Afrose S','2026-05-20 13:46:15'),('UPD000018','TSK000023','PRJ000007','USR000010','2026-05-20','In Progress','Today evening work going on ',0.00,NULL,'Afrose S','2026-05-20 13:47:07'),('UPD000019','TSK000028','PRJ000007','USR000005','2026-05-23','Completed','',0.00,NULL,'Rithani  T','2026-05-27 09:47:27'),('UPD000020','TSK000037','PRJ000007','USR000010','2026-05-28','Completed','',2.00,NULL,'Afrose S','2026-05-29 11:23:26'),('UPD000021','TSK000034','PRJ000007','USR000010','2026-05-26','Completed','',1.00,NULL,'Afrose S','2026-05-29 11:24:11'),('UPD000022','TSK000038','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:24:54'),('UPD000023','TSK000023','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:25:11'),('UPD000024','TSK000033','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:25:20'),('UPD000025','TSK000032','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:25:35'),('UPD000026','TSK000035','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:25:43'),('UPD000027','TSK000036','PRJ000007','USR000010','2026-05-29','In Progress','',0.00,NULL,'Afrose S','2026-05-29 11:25:48');
/*!40000 ALTER TABLE `ccms_task_update` ENABLE KEYS */;
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
