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
-- Table structure for table `ccms_companies`
--

DROP TABLE IF EXISTS `ccms_companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_companies` (
  `CM_Company_ID` varchar(25) NOT NULL,
  `CM_Company_Code` varchar(50) DEFAULT NULL,
  `CM_Company_Name` varchar(150) DEFAULT NULL,
  `CM_Company_Type` varchar(100) DEFAULT NULL,
  `CM_Company_Logo` varchar(300) DEFAULT NULL,
  `CM_Company_Phone` varchar(20) DEFAULT NULL,
  `CM_Address` varchar(100) DEFAULT NULL,
  `CM_District` varchar(100) DEFAULT NULL,
  `CM_State` varchar(50) DEFAULT NULL,
  `CM_Country` varchar(50) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_GST_Number` varchar(50) DEFAULT NULL,
  `CM_PAN_Number` varchar(50) DEFAULT NULL,
  `CM_Is_Status` enum('Active','Inactive') DEFAULT NULL,
  `CM_Company_Owner` varchar(50) DEFAULT NULL,
  `CM_Owner_Phone` varchar(20) DEFAULT NULL,
  `CM_Alternate_Phone` varchar(20) DEFAULT NULL,
  `CM_Email` varchar(50) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_companies`
--

LOCK TABLES `ccms_companies` WRITE;
/*!40000 ALTER TABLE `ccms_companies` DISABLE KEYS */;
INSERT INTO `ccms_companies` VALUES ('COM000001','C001','Saran Solar Pvt Ltd','Solar Company','/saranlogo.png','9940356707','131/2, Main road, Kullampalayam, Gobichettipalayam','Erode','Tamil Nadu','India',638476,'33ABKCS0948M1ZX','ABKCS0948M','Active','Bharani Kumar','9524210055',NULL,'info@saransolar.in','Prabakar.D','2025-08-29 13:09:10','Prabakar.D','2025-08-29 13:09:10');
/*!40000 ALTER TABLE `ccms_companies` ENABLE KEYS */;
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
