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
-- Table structure for table `ccms_suppliers`
--

DROP TABLE IF EXISTS `ccms_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_suppliers` (
  `CM_Supplier_ID` varchar(25) NOT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Supplier_Code` varchar(20) DEFAULT NULL,
  `CM_Company_Name` varchar(150) DEFAULT NULL,
  `CM_Contact_Person` varchar(150) DEFAULT NULL,
  `CM_Email` varchar(150) DEFAULT NULL,
  `CM_Phone_Number` varchar(20) DEFAULT NULL,
  `CM_Alternate_Phone` varchar(20) DEFAULT NULL,
  `CM_Address` text,
  `CM_District` varchar(50) DEFAULT NULL,
  `CM_State` varchar(25) DEFAULT NULL,
  `CM_Country` varchar(25) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_GST_Number` varchar(30) DEFAULT NULL,
  `CM_PAN_Number` varchar(30) DEFAULT NULL,
  `CM_Payment_Terms` varchar(100) DEFAULT NULL,
  `CM_Is_Active` enum('Active','Inactive') DEFAULT NULL,
  `CM_Create_Limit` varchar(100) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Supplier_ID`),
  KEY `fk_suppliers_company` (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_suppliers`
--

LOCK TABLES `ccms_suppliers` WRITE;
/*!40000 ALTER TABLE `ccms_suppliers` DISABLE KEYS */;
INSERT INTO `ccms_suppliers` VALUES ('SUP000001','COM000001','SUP0010','Steel Suppliers','Mike Johnson','steel@example.com','9876543220','9123456790','321 Steel St','Central','Tamil Nadu','India',600011,'GST011','PAN011','Net 30','Active','100000','Prabakar.D','2025-08-29 13:14:14','Prabakar.D','2025-09-15 14:45:02'),('SUP000002','COM000001','SUP004','Solar Universe','Sarah Wilson','solar@example.com','9876543221','9123456791','654 Cement St','North','Tamil Nadu','India',600012,'GST012','PAN012','Net 15','Active','50000','Prabakar.D','2025-08-29 13:14:14','Prabakar.D','2025-09-15 14:41:49'),('SUP000003','COM000001','SUP003','Agrawal Renewable Energy Pvt Ltd','Agrawal Renewable Energy Pvt Ltd','agrawal@example.com','9876543222','9123456792','Plot No.66/0 Vovoi Road , Curti Ponda.','South Goa','Goa','India',403401,'30AAJCA4627K1ZS','AAJCA4627K','45 days','Active','75000','Prabakar.D','2025-08-29 13:14:14','current_user','2025-11-07 16:10:49'),('SUP000004','COM000001','Maadhu','Maadhu systems','Ram kumar','Maadhu@gmail.com','8344116557',NULL,'Chennimalai','Erode','Tamilnadu','India',638052,'33AADCR2847L2Z6','GEJPM6150L','30 days','Active',NULL,'Prabakar.D','2025-10-13 11:15:15','Prabakar.D','2025-10-15 09:52:10');
/*!40000 ALTER TABLE `ccms_suppliers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:30
