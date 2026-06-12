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
-- Table structure for table `ccms_projects`
--

DROP TABLE IF EXISTS `ccms_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_projects` (
  `CM_Project_ID` varchar(25) NOT NULL,
  `CM_Project_Code` varchar(50) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Customer_ID` varchar(25) DEFAULT NULL,
  `CM_Project_Type` enum('Kilo Watts','Mega Watts','Others') DEFAULT NULL,
  `CM_Watts` varchar(25) DEFAULT NULL,
  `CM_Project_Name` varchar(150) DEFAULT NULL,
  `CM_Description` text,
  `CM_Project_Location` varchar(150) DEFAULT NULL,
  `CM_Radius_Meters` int DEFAULT '150',
  `CM_Project_Customer` varchar(50) DEFAULT NULL,
  `CM_Project_Customer_Phone` varchar(20) DEFAULT NULL,
  `CM_Alternative_Phone` varchar(20) DEFAULT NULL,
  `CM_Customer_Address` text,
  `CM_Estimated_Cost` decimal(35,2) DEFAULT NULL,
  `CM_Actual_Cost` decimal(35,2) DEFAULT NULL,
  `CM_Status` varchar(50) DEFAULT NULL,
  `CM_Planned_Start_Date` date DEFAULT NULL,
  `CM_Planned_End_Date` date DEFAULT NULL,
  `CM_Project_Leader_ID` varchar(100) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  `CM_Latitude` decimal(10,8) DEFAULT NULL,
  `CM_Longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`CM_Project_ID`),
  KEY `fk_project_company` (`CM_Company_ID`),
  KEY `fk_ccms_projects_customer` (`CM_Customer_ID`),
  CONSTRAINT `fk_project_company` FOREIGN KEY (`CM_Company_ID`) REFERENCES `ccms_companies` (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_projects`
--

LOCK TABLES `ccms_projects` WRITE;
/*!40000 ALTER TABLE `ccms_projects` DISABLE KEYS */;
INSERT INTO `ccms_projects` VALUES ('PRJ000001','Siruvalur 5 Mw','COM000001','CUS000001','Mega Watts',NULL,'Allwin Pipes',NULL,'Siruvallur',250,NULL,NULL,NULL,NULL,43053900.00,NULL,'Active','2025-10-08','2026-02-23','USR000006','Bharani Kumar.C','2025-12-23 16:08:33',NULL,'2026-05-02 17:56:55',11.35914600,77.44734500),('PRJ000002','AVR 1','COM000001','CUS000002','Mega Watts',NULL,'AVR Mills 1MW','AVR Mills Private Limited Mega Watts Project in Bhavanisaagar.','Bhavanisaagar',306,NULL,NULL,NULL,NULL,63800000.00,NULL,'Active','2025-08-18','2026-02-03','USR000013','Bharani Kumar.C','2026-01-13 16:55:17',NULL,'2026-05-28 11:56:34',11.49894300,77.15561200),('PRJ000003','BSV','COM000001','CUS000003','Mega Watts',NULL,'Bannari Solar Valley',NULL,'Rajan Nagar',500,NULL,NULL,NULL,NULL,288000000.00,NULL,'Active','2026-01-01',NULL,'USR000013','Bharani Kumar.C','2026-01-21 16:49:24',NULL,'2026-05-28 11:53:28',11.53213870,77.14629654),('PRJ000004','Rithik Site ','COM000001','CUS000004','Mega Watts','50 MW','Rithik Sizing Mills',NULL,'Bhavanisaagar',150,NULL,NULL,NULL,NULL,117802367.00,NULL,'Active','2025-08-18','2026-02-15','USR000013','Bharani Kumar.C','2026-01-21 17:18:06',NULL,'2026-06-01 15:16:16',11.53261175,77.14578144),('PRJ000005',NULL,'COM000001','CUS000005','Mega Watts',NULL,'Venmalar',NULL,'Tandarai, Kilpennathur',150,NULL,NULL,NULL,NULL,0.00,NULL,'Active','2025-12-01','2026-03-01','USR000003','Bharani Kumar.C','2026-02-17 17:27:07',NULL,'2026-03-13 15:23:35',12.12083230,79.14950600),('PRJ000007',NULL,'COM000001','CUS000008','Kilo Watts',NULL,'Jagan Metal Mart','130 KW\nCivil work , Materials site cleaning customer scope','Modachur, Gobi',150,NULL,NULL,NULL,NULL,6302380.00,NULL,'Active','2026-05-01','2026-05-25','USR000010','Rithani  T','2026-05-04 12:02:24',NULL,'2026-05-28 11:57:24',11.43733378,77.43494511),('PRJ000008','02','COM000001','CUS000012','Kilo Watts','10 Kw','Celeris',NULL,'Sathyamangalam',150,NULL,NULL,NULL,NULL,16001.00,NULL,'Active','2026-06-01','2026-06-30','USR000015','Bharani Kumar.C','2026-06-01 15:09:58','Bharani Kumar.C','2026-06-06 01:23:16',11.45748131,77.43438721);
/*!40000 ALTER TABLE `ccms_projects` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:13
