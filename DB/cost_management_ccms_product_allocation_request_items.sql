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
-- Table structure for table `ccms_product_allocation_request_items`
--

DROP TABLE IF EXISTS `ccms_product_allocation_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_product_allocation_request_items` (
  `CM_Item_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Request_ID` varchar(20) NOT NULL,
  `CM_Product_ID` varchar(20) NOT NULL,
  `CM_Item_Master_ID` varchar(20) NOT NULL,
  `CM_Requested_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Available_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Shortage_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Unit_Type` varchar(50) DEFAULT NULL,
  `CM_Unit_Price` decimal(25,2) DEFAULT NULL,
  `CM_Status` enum('Pending','Approved','Rejected','Partially Approved') DEFAULT 'Pending',
  `CM_Approved_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Notes` text,
  `CM_Pending_Quantity` decimal(15,2) DEFAULT NULL,
  `CM_Godown_ID` varchar(50) DEFAULT NULL,
  `CM_Godown_Name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`CM_Item_ID`),
  KEY `CM_Request_ID` (`CM_Request_ID`),
  CONSTRAINT `ccms_product_allocation_request_items_ibfk_1` FOREIGN KEY (`CM_Request_ID`) REFERENCES `ccms_product_allocation_requests` (`CM_Request_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_product_allocation_request_items`
--

LOCK TABLES `ccms_product_allocation_request_items` WRITE;
/*!40000 ALTER TABLE `ccms_product_allocation_request_items` DISABLE KEYS */;
INSERT INTO `ccms_product_allocation_request_items` VALUES (3,'REQ000001','ITM000026','ITM000026',1.00,4.00,0.00,'UNT000006',0.00,'Approved',1.00,'1 approved',0.00,NULL,NULL),(4,'REQ000002','ITM000026','ITM000026',4.00,4.00,0.00,'UNT000006',0.00,'Approved',200.00,'200 approved',-199.00,NULL,NULL),(5,'REQ000003','ITM000040','ITM000040',1.00,12.00,0.00,'UNT000005',0.00,'Approved',2.00,'0 approved, 2 pending',0.00,NULL,NULL),(6,'REQ000003','ITM000033','ITM000033',1.00,0.00,1.00,'UNT000004',0.00,'Approved',1.00,'0 approved, 1 pending',0.00,NULL,NULL),(7,'REQ000003','ITM000032','ITM000032',1.00,560.00,0.00,'UNT000007',0.00,'Pending',0.00,'Requested from product selection screen | Item: 300 Sq Mm Aluminium Cable (Negative)',1.00,NULL,NULL),(8,'REQ000003','ITM000030','ITM000030',1451.00,531.00,920.00,'UNT000007',0.00,'Pending',0.00,'Requested from product selection screen | Item: 300 Sq Mm Aluminium Cable (Positive)',1451.00,NULL,NULL),(9,'REQ000003','ITM000051','ITM000051',2.00,3.00,0.00,'UNT000004',0.00,'Approved',600.00,'0 approved, 600 pending',0.00,NULL,NULL),(10,'REQ000003','ITM000003','ITM000003',3.00,50.00,0.00,'UNT000001',0.00,'Pending',0.00,'Requested from product selection screen | Item: BATTERY-12.8V/105AH LIPO4',3.00,NULL,NULL),(11,'REQ000003','ITM000009','ITM000009',1.00,15.00,0.00,'UNT000001',0.00,'Pending',0.00,'Requested from product selection screen | Item: BATTERY-25.6V/105AH LIPO4',1.00,NULL,NULL),(12,'REQ000004','ITM000032','ITM000032',1.00,560.00,0.00,'UNT000007',0.00,'Approved',70.00,'0 approved, 70 pending',0.00,NULL,NULL),(13,'REQ000005','ITM000029','ITM000029',4.00,1.00,3.00,'UNT000006',0.00,'Partially Approved',1.00,'1 approved, 3 pending',3.00,NULL,NULL),(14,'REQ000006','ITM000029','ITM000029',4.00,1.00,3.00,'UNT000006',0.00,'Partially Approved',2.00,'2 approved, 2 pending',2.00,NULL,NULL),(15,'REQ000011','ITM000025','ITM000025',50.00,49.00,1.00,'UNT000005',0.00,'Rejected',0.00,'Requested from product selection screen | Item: Cement Bag 50kg',0.00,NULL,NULL),(16,'REQ000012','ITM000025','ITM000025',50.00,49.00,1.00,'UNT000005',0.00,'Partially Approved',49.00,'49 approved, 1 pending',1.00,NULL,NULL),(17,'REQ000013','ITM000025','ITM000025',50.00,0.00,50.00,'UNT000005',0.00,'Approved',50.00,'50 approved',0.00,NULL,NULL),(18,'REQ000015','ITM000013','ITM000013',5.00,1.00,4.00,'UNT000004',0.00,'Rejected',0.00,'Requested from product selection screen | Item: Birla White Cement - 50kg',0.00,NULL,NULL),(19,'REQ000017','ITM000061','ITM000061',16.00,35.00,0.00,'UNT000004',0.00,'Approved',20.00,'20 approved',-4.00,NULL,NULL),(20,'REQ000018','ITM000013','ITM000013',2.00,1.00,1.00,'UNT000004',0.00,'Partially Approved',1.00,'1 approved, 1 pending',1.00,NULL,NULL),(21,'REQ000020','ITM000115','ITM000115',1.00,1.00,0.00,'UNT000004',0.00,'Approved',1.00,'1 approved',0.00,NULL,NULL),(22,'REQ000021','ITM000070','ITM000070',440.00,440.00,0.00,'UNT000004',0.00,'Approved',440.00,'440 approved',0.00,NULL,NULL),(23,'REQ000021','ITM000069','ITM000069',10.00,10.00,0.00,'UNT000004',0.00,'Approved',10.00,'10 approved',0.00,NULL,NULL),(24,'REQ000021','ITM000067','ITM000067',2.00,2.00,0.00,'UNT000004',0.00,'Approved',2.00,'2 approved',0.00,NULL,NULL),(25,'REQ000021','ITM000073','ITM000073',440.00,440.00,0.00,'UNT000004',0.00,'Approved',440.00,'440 approved',0.00,NULL,NULL),(26,'REQ000021','ITM000072','ITM000072',440.00,440.00,0.00,'UNT000004',0.00,'Approved',440.00,'440 approved',0.00,NULL,NULL),(27,'REQ000021','ITM000071','ITM000071',440.00,440.00,0.00,'UNT000004',0.00,'Approved',440.00,'440 approved',0.00,NULL,NULL),(28,'REQ000021','ITM000061','ITM000061',15.00,15.00,0.00,'UNT000004',0.00,'Approved',15.00,'15 approved',0.00,NULL,NULL),(29,'REQ000021','ITM000113','ITM000113',1.00,0.00,1.00,'UNT000004',0.00,'Rejected',0.00,'double entry',0.00,NULL,NULL),(30,'REQ000021','ITM000125','ITM000125',1.00,0.00,1.00,'UNT000004',0.00,'Approved',1.00,'1 approved',0.00,NULL,NULL),(31,'REQ000021','ITM000124','ITM000124',3.00,0.00,3.00,'UNT000004',0.00,'Rejected',0.00,'double entry',0.00,NULL,NULL),(32,'REQ000021','ITM000058','ITM000058',50.00,1000.00,0.00,'UNT000004',0.00,'Approved',50.00,'50 approved',0.00,NULL,NULL),(33,'REQ000021','ITM000062','ITM000062',435.00,435.00,0.00,'UNT000004',0.00,'Approved',435.00,'435 approved',0.00,NULL,NULL),(34,'REQ000021','ITM000063','ITM000063',212.00,212.00,0.00,'UNT000004',0.00,'Approved',212.00,'212 approved',0.00,NULL,NULL),(35,'REQ000021','ITM000027','ITM000027',3.00,0.00,3.00,'UNT000004',0.00,'Rejected',0.00,' Created separately',0.00,NULL,NULL),(36,'REQ000021','ITM000025','ITM000025',1.00,0.00,1.00,'UNT000005',0.00,'Rejected',0.00,' rejected civil customer scope',0.00,NULL,NULL),(37,'REQ000021','ITM000108','ITM000108',1.00,0.00,1.00,'UNT000004',0.00,'Approved',1.00,'1 approved',0.00,NULL,NULL),(38,'REQ000021','ITM000016','ITM000016',2.00,0.00,2.00,'UNT000004',0.00,'Rejected',0.00,' Spell Error separate creation',0.00,NULL,NULL),(39,'REQ000021','ITM000053','ITM000053',6.00,4.00,2.00,'UNT000004',0.00,'Approved',6.00,'6 approved',0.00,NULL,NULL),(40,'REQ000021','ITM000114','ITM000114',1.00,0.00,1.00,'UNT000004',0.00,'Approved',1.00,'1 approved',0.00,NULL,NULL),(41,'REQ000021','ITM000109','ITM000109',1.00,0.00,1.00,'UNT000004',0.00,'Rejected',0.00,' Created separately ',0.00,NULL,NULL),(42,'REQ000022','ITM000141','ITM000141',2.00,0.00,2.00,'UNT000004',0.00,'Approved',6.00,'6 approved',-4.00,NULL,NULL),(43,'REQ000023','ITM000139','ITM000139',4.00,0.00,4.00,'UNT000004',0.00,'Approved',6.00,'6 approved',-2.00,NULL,NULL),(44,'REQ000024','ITM000131','ITM000131',16.00,0.00,16.00,'UNT000004',0.00,'Approved',16.00,'20 bought 16 approved',0.00,NULL,NULL),(45,'REQ000025','ITM000138','ITM000138',10.00,0.00,10.00,'UNT000004',0.00,'Approved',10.00,'10 approved',0.00,NULL,NULL),(46,'REQ000026','ITM000135','ITM000135',17.00,0.00,17.00,'UNT000017',0.00,'Partially Approved',15.00,'15 approved, 2 pending',2.00,NULL,NULL),(47,'REQ000027','ITM000015','ITM000015',8.00,0.00,8.00,'UNT000004',0.00,'Approved',8.00,'To be returned',0.00,NULL,NULL),(48,'REQ000028','ITM000076','ITM000076',252.00,0.00,100.00,'UNT000007',0.00,'Approved',252.00,'252 approved',0.00,NULL,NULL),(49,'REQ000029','ITM000077','ITM000077',100.00,0.00,100.00,'UNT000007',0.00,'Approved',100.00,'100 approved',0.00,NULL,NULL),(50,'REQ000030','ITM000099','ITM000099',430.00,0.00,430.00,'UNT000004',0.00,'Rejected',0.00,'Requested from product selection screen | Item: 2.5 Sqmm Cu Lugs(4MM or 5MM Dia) round',0.00,NULL,NULL),(51,'REQ000039','ITM000099','ITM000099',1.00,0.00,1.00,'UNT000004',0.00,'Rejected',0.00,'Requested from product selection screen | Item: 2.5 Sqmm Cu Lugs(4MM or 5MM Dia) round',0.00,NULL,NULL),(52,'REQ000040','ITM000158','ITM000158',430.00,420.00,10.00,'UNT000004',0.00,'Rejected',0.00,'Requested from product selection screen | Item: 2.5Sqmm CU Ring type Socket 6MM Hex',0.00,NULL,NULL),(53,'REQ000041','ITM000171','ITM000171',2.00,20.00,0.00,'UNT000001',0.00,'Pending',0.00,'Requested from product selection screen | Item: Helmet White',2.00,NULL,NULL),(54,'REQ000041','ITM000109','ITM000109',2.00,0.00,2.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: Lighting Arrester',2.00,NULL,NULL),(55,'REQ000042','ITM000027','ITM000027',15.00,0.00,15.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: Copper Earthing Rod',15.00,NULL,NULL),(56,'REQ000072','ITM000159','ITM000159',20.00,28.00,0.00,'UNT000011',0.00,'Pending',0.00,'Requested from product selection screen | Item: 10Sqmm Flex Wire HRFR',20.00,NULL,NULL),(57,'REQ000074','ITM000140','ITM000140',1.00,350.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: 0.5 Star Screw',1.00,NULL,NULL),(58,'REQ000074','ITM000140','ITM000140',1.00,350.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: 0.5 Star Screw',1.00,NULL,NULL),(59,'REQ000075','ITM000162','ITM000162',5.00,15.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: 1 1/2\" double compression Gland',5.00,'GOD000003','Bannari Solar Valley'),(60,'REQ000075','ITM000015','ITM000015',2.00,92.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item:  Yellow Labour Helmate',2.00,'GOD000005','Office'),(61,'REQ000076','ITM000015','ITM000015',1.00,92.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item:  Yellow Labour Helmate',1.00,'GOD000005','Office'),(62,'REQ000077','ITM000192','ITM000192',10.00,60.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: Laptop',10.00,'GOD000004','Jagan Godown'),(63,'REQ000079','ITM000140','ITM000140',5.00,350.00,0.00,'UNT000004',0.00,'Pending',0.00,'Requested from product selection screen | Item: 0.5 Star Screw',5.00,'GOD000003','Bannari Solar Valley');
/*!40000 ALTER TABLE `ccms_product_allocation_request_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:11
