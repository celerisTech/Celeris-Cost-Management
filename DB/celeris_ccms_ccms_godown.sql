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
  KEY `fk_godown_company` (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_godown`
--

LOCK TABLES `ccms_godown` WRITE;
/*!40000 ALTER TABLE `ccms_godown` DISABLE KEYS */;
INSERT INTO `ccms_godown` VALUES ('GOD000001','GOD001','COM000001','Main Godown','Central','123 Storage St','Central','Tamil Nadu','India',600021,'Storage Manager','9876543230','9123456800','storage@example.com','Active','admin','2025-08-29 13:14:25','admin','2026-01-27 16:13:24'),('GOD000002','GOD002','COM000001','North Godown','North','456 Storage St','North','Tamil Nadu','India',600022,'North Manager','9876543231','9123456801','north@example.com','Active','admin','2025-08-29 13:14:25','admin','2025-08-29 13:14:25'),('GOD000003','GOD003','COM000001','South Godown','South','789 Storage St','South','Tamil Nadu','India',600023,'South Manager','9876543232','9123456802','south@example.com','Active','admin','2025-08-29 13:14:25','admin','2025-08-29 13:14:25');
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

-- Dump completed on 2026-05-21  9:56:25
