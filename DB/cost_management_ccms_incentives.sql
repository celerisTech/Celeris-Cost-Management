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
-- Table structure for table `ccms_incentives`
--

DROP TABLE IF EXISTS `ccms_incentives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_incentives` (
  `CM_Incentive_ID` varchar(125) NOT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Labor_ID` varchar(25) DEFAULT NULL,
  `CM_Incentive_Date` date DEFAULT NULL,
  `CM_Incentive_Type` varchar(100) DEFAULT NULL,
  `CM_Incentive_Amount` decimal(10,2) DEFAULT NULL,
  `CM_Description` varchar(255) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Incentive_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_incentives`
--

LOCK TABLES `ccms_incentives` WRITE;
/*!40000 ALTER TABLE `ccms_incentives` DISABLE KEYS */;
INSERT INTO `ccms_incentives` VALUES ('INC000001','COM000001','LAB000005','2026-03-03','Other',900.00,'food amount for staying in siruvallur allwin site','Rithani  T','2026-04-03 15:29:13'),('INC000002','COM000001','LAB000006','2026-03-31','Other',6525.00,'food amount for 29 days','Rithani  T','2026-04-03 15:32:10'),('INC000003','COM000001','LAB000007','2026-03-31','Other',2900.00,'Food amount dor 30 days one day leave deducted','Rithani  T','2026-04-03 15:34:49'),('INC000004','COM000001','LAB000009','2026-03-02','Other',2870.00,'6 days 225 foe foof 19 days 80 for food','Rithani  T','2026-04-03 15:43:24'),('INC000005','COM000001','LAB000015','2026-03-31','Other',2700.00,'3 days deducted ,food given based on 30 days  - 27  days','Rithani  T','2026-04-03 16:18:39'),('INC000006','COM000001','LAB000046','2026-03-24','Other',8400.00,'food exp for 24days of  31days (7days leave)','Manohari V','2026-04-03 17:19:52'),('INC000007','COM000001','LAB000045','2026-03-30','Other',5625.00,'food exp for 24 days of 3o days (6days leave)','Manohari V','2026-04-03 17:33:57'),('INC000008','COM000001','LAB000045','2026-05-04','Other',6525.00,'food allowance 29 days','Rithani  T','2026-05-04 17:31:55'),('INC000009','COM000001','LAB000045','2026-04-04','Other',6525.00,'food allowance 29 days','Rithani  T','2026-05-04 17:34:57'),('INC000010','COM000001','LAB000046','2026-04-30','Other',4725.00,'food allowances 21 days','Rithani  T','2026-05-04 17:46:09'),('INC000011','COM000001','LAB000046','2026-04-30','Special',2700.00,'incentive','Rithani  T','2026-05-04 18:01:05'),('INC000012','COM000001','LAB000006','2026-04-30','Other',5400.00,'food allowance 24 days','Rithani  T','2026-05-04 18:17:45'),('INC000013','COM000001','LAB000015','2026-04-30','Other',2800.00,'28 Days Food Allowance','Rithani  T','2026-05-04 18:30:59'),('INC000014','COM000001','LAB000009','2026-04-30','Other',1920.00,'food allowancwe 25 days 80 rs','Rithani  T','2026-05-04 18:39:26'),('INC000015','COM000001','LAB000007','2026-04-30','Other',3000.00,'food for 30 days','Rithani  T','2026-05-04 18:43:04'),('INC000016','COM000001','LAB000005','2026-04-30','Other',1702.00,'food for 3 days + md function bus fair','Rithani  T','2026-05-05 11:17:19'),('INC000017','COM000001','LAB000004','2026-04-23','Other',5705.00,'food for 25 days 225 and one half day food 80','Rithani  T','2026-05-06 12:52:44');
/*!40000 ALTER TABLE `ccms_incentives` ENABLE KEYS */;
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
