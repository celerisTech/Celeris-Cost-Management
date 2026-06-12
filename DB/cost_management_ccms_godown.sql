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
-- Table structure for table `ccms_godown`
--

DROP TABLE IF EXISTS `ccms_godown`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_godown` (
  `CM_Godown_ID` varchar(25) NOT NULL,
  `CM_Godown_Code` varchar(50) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Godown_Name` varchar(150) DEFAULT NULL,
  `CM_Location` varchar(150) DEFAULT NULL,
  `CM_Address` varchar(150) DEFAULT NULL,
  `CM_District` varchar(50) DEFAULT NULL,
  `CM_State` varchar(50) DEFAULT NULL,
  `CM_Country` varchar(50) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_Contact_Person` varchar(100) DEFAULT NULL,
  `CM_Phone_Number` varchar(20) DEFAULT NULL,
  `CM_Alternate_Phone` varchar(20) DEFAULT NULL,
  `CM_Email` varchar(100) DEFAULT NULL,
  `CM_Is_Status` enum('Active','Inactive') DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Godown_ID`),
  KEY `fk_godown_company` (`CM_Company_ID`),
  CONSTRAINT `fk_godown_company` FOREIGN KEY (`CM_Company_ID`) REFERENCES `ccms_companies` (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_godown`
--

LOCK TABLES `ccms_godown` WRITE;
/*!40000 ALTER TABLE `ccms_godown` DISABLE KEYS */;
INSERT INTO `ccms_godown` VALUES ('GOD000001',' 001','COM000001','MAIN GODOWN','GOBI','131/2 Kullampalayam Main Road, Gobi, 638476','Erode','Tamil Nadu','India',638476,'Saran Solar Private Limited','9524210055','7904158989','saransolarpvtltd@gmail.com','Active','system','2025-12-18 10:40:43',NULL,'2026-01-23 15:59:45'),('GOD000002','AL-1','COM000001','Alwin ','Siruvalur','Siruvalur ','Erode ','Tamil Nadu ','India ',638476,'Sa','9944847682',NULL,'g@gamil.com','Active','system','2026-01-09 06:44:57',NULL,'2026-01-23 16:00:33'),('GOD000003','G03','COM000001','Bannari Solar Valley','Sathyamangalam','607/4, Rajannagar,\nSathyamangalam,\nErode(Dt)\nTamil Nadu, 638401','Erode','Tamil Nadu','India',638401,'Suresh ','8637450003',NULL,'saransolarprivatelimited@gmail.com','Active','system','2026-01-27 11:23:39',NULL,NULL),('GOD000004','JAGAN 1','COM000001','Jagan Godown','Gobichettipalayam','No 455, Modachur Rd, Vadugapalayam Pudur, Dharapuram, Gobichettipalayam, Tamil Nadu 638476','Erode ','Tamil Nadu','India',638476,'Afrose S','6374032169',NULL,'sales@saransolar.in','Active','system','2026-05-18 11:13:25',NULL,NULL),('GOD000005',' office=001','COM000001','Office','gobi','131/2, Main Road,Kullampalayam,gobi','Erode','Tamil Nadu','India',638476,'Saran Solar','8015150808','8015157676','admin@saransolar.in','Active','system','2026-05-23 08:09:05',NULL,NULL);
/*!40000 ALTER TABLE `ccms_godown` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:17
