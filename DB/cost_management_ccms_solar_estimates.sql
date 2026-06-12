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
-- Table structure for table `ccms_solar_estimates`
--

DROP TABLE IF EXISTS `ccms_solar_estimates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_solar_estimates` (
  `CM_ID` varchar(36) NOT NULL,
  `CM_Project_ID` varchar(25) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Project_Name` varchar(255) NOT NULL,
  `CM_Location` varchar(255) NOT NULL,
  `CM_System_Size` varchar(100) NOT NULL,
  `CM_Equipment_Items` json NOT NULL,
  `CM_Labor_Items` json NOT NULL,
  `CM_Other_Items` json NOT NULL,
  `CM_Equipment_Total` decimal(35,2) NOT NULL,
  `CM_Labor_Total` decimal(35,2) NOT NULL,
  `CM_Other_Total` decimal(35,2) NOT NULL,
  `CM_GST_Percentage` decimal(5,2) DEFAULT '0.00',
  `CM_GST_Amount` decimal(35,2) DEFAULT '0.00',
  `CM_Total` decimal(40,2) NOT NULL,
  `CM_Grand_Total` decimal(40,2) DEFAULT '0.00',
  `CM_Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_ID`),
  KEY `fk_solar_estimates_project` (`CM_Project_ID`),
  KEY `fk_solar_estimates_company` (`CM_Company_ID`),
  CONSTRAINT `fk_solar_estimates_company` FOREIGN KEY (`CM_Company_ID`) REFERENCES `ccms_companies` (`CM_Company_ID`),
  CONSTRAINT `fk_solar_estimates_project` FOREIGN KEY (`CM_Project_ID`) REFERENCES `ccms_projects` (`CM_Project_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_solar_estimates`
--

LOCK TABLES `ccms_solar_estimates` WRITE;
/*!40000 ALTER TABLE `ccms_solar_estimates` DISABLE KEYS */;
INSERT INTO `ccms_solar_estimates` VALUES ('EST000001','PRJ000001','COM000001','Allwin Pipes','Siruvallur','Mega Watts','[{\"id\": 1, \"name\": \"panel\", \"notes\": \"\", \"quantity\": 3562, \"unitCost\": 10950}, {\"id\": 2, \"name\": \"CENTRAL INVERTER\", \"notes\": \"\", \"quantity\": 1, \"unitCost\": 3600000}, {\"id\": 3, \"name\": \"\", \"notes\": \"\", \"quantity\": 0, \"unitCost\": 0}]','[{\"id\": 1, \"rate\": 6000, \"hours\": 75, \"notes\": \"\", \"position\": \" Labour\"}, {\"id\": 2, \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"position\": \"\"}]','[{\"id\": 1, \"cost\": 0, \"name\": \"\", \"notes\": \"\"}]',42603900.00,450000.00,0.00,0.00,0.00,43053900.00,0.00,'2025-12-23 10:59:25','2025-12-23 10:59:25'),('EST000002','PRJ000002','COM000001','AVR Mills 1MW','Bhavanisaagar','Mega Watts','[{\"id\": 1, \"name\": \"\", \"notes\": \"\", \"quantity\": 0, \"unitCost\": 0}]','[{\"id\": 1, \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"position\": \"\"}]','[{\"id\": 1, \"cost\": 63800000, \"name\": \"Full Amount\", \"notes\": \"\"}]',0.00,0.00,63800000.00,0.00,0.00,63800000.00,0.00,'2026-01-13 11:27:16','2026-01-13 11:27:16'),('EST000003','PRJ000003','COM000001','Bannari Solar Valley','Sathyamangalam, Tamil Nadu (Approximate area location)','Mega Watts','[{\"id\": 1, \"name\": \"\", \"notes\": \"\", \"quantity\": 0, \"unitCost\": 0}]','[{\"id\": 1, \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"position\": \"\"}]','[{\"id\": 1, \"cost\": 288000000, \"name\": \"Project Cost\", \"notes\": \"\"}]',0.00,0.00,288000000.00,0.00,0.00,288000000.00,0.00,'2026-01-21 11:23:40','2026-01-21 11:23:40'),('EST000004','PRJ000004','COM000001','Rithik Sizing Mills','Rajan Nagar','','[{\"name\": \"\", \"notes\": \"\", \"price\": 0, \"quantity\": 0, \"unitCost\": 0}]','[{\"name\": \"\", \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"price\": 0, \"quantity\": 0}]','[{\"cost\": 117802367, \"name\": \"Project Cost\", \"notes\": \"\", \"price\": 117802367}]',0.00,0.00,117802367.00,0.00,0.00,117802367.00,0.00,'2026-01-21 11:53:16','2026-01-23 10:21:50'),('EST000005','PRJ000005','COM000001','Venmalar','Google Maps: Tandarai, Kilpennathur, Tamil Nadu, 606806','Mega Watts','[{\"id\": 1, \"name\": \"\", \"notes\": \"\", \"quantity\": 0, \"unitCost\": 0}]','[{\"id\": 1, \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"position\": \"\"}]','[{\"id\": 1, \"cost\": 0, \"name\": \"\", \"notes\": \"\"}]',0.00,0.00,0.00,0.00,0.00,0.00,0.00,'2026-02-17 11:57:15','2026-02-17 11:57:15'),('EST000007','PRJ000007','COM000001','Jagan Metal Mart','','','[{\"name\": \"Whole project\", \"notes\": \"\", \"price\": 4700000, \"quantity\": 1, \"unitCost\": 4900000}]','[{\"name\": \"\", \"rate\": 0, \"hours\": 0, \"notes\": \"\", \"price\": 0, \"quantity\": 0}]','[{\"cost\": 0, \"name\": \" \", \"notes\": \"\", \"price\": 0}]',4900000.00,0.00,0.00,18.00,961380.00,6302380.00,6302380.00,'2026-05-04 06:52:50','2026-05-18 06:27:45'),('EST000008','PRJ000008','COM000001','Celeris','Sathyamangalam','','[{\"name\": \"total cost\", \"notes\": \"\", \"price\": 49000000, \"quantity\": 1, \"unitCost\": 10000}]','[{\"name\": \"team 1\", \"rate\": 5000, \"hours\": 1, \"notes\": \"\", \"price\": 0, \"quantity\": 0}]','[{\"cost\": 1000, \"name\": \"FIRST\", \"notes\": \"\", \"price\": 0}]',10000.00,5000.00,1000.00,10.00,1.00,16000.00,16001.00,'2026-06-01 09:40:43','2026-06-05 19:53:15');
/*!40000 ALTER TABLE `ccms_solar_estimates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:09
