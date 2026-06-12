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
-- Table structure for table `ccms_new_item_requests`
--

DROP TABLE IF EXISTS `ccms_new_item_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_new_item_requests` (
  `CM_NEW_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Request_ID` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Item_Name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Item_Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Unit_Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Qty` decimal(15,2) DEFAULT NULL,
  `CM_Item_URL` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Status` enum('Pending','Approved','Rejected','Partially Approved') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Request_Reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Company_ID` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_By` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_NEW_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_new_item_requests`
--

LOCK TABLES `ccms_new_item_requests` WRITE;
/*!40000 ALTER TABLE `ccms_new_item_requests` DISABLE KEYS */;
INSERT INTO `ccms_new_item_requests` VALUES (1,'REQ000007','Aluminium Rivets','Requested from product selection screen','Unit',250.00,NULL,'Approved',NULL,'COM000001','USR000012','2026-05-05 16:10:59'),(2,'REQ000008',' Lord Adhesive - Cartridge  Structural Adhesive - Lord 810  /24 - 400ml ','Requested from product selection screen','Unit',20.00,NULL,'Approved',NULL,'COM000001','USR000012','2026-05-05 16:13:32'),(3,'REQ000009','Diamond Fencing Roll','Yard Fencing work','Unit',5.00,NULL,'Pending',NULL,'COM000001','USR000007','2026-05-07 15:34:01'),(4,'REQ000010','MS WELD MESH  ','Fencing work size 1x1','Unit',1.00,NULL,'Approved',NULL,'COM000001','USR000007','2026-05-07 15:36:02'),(5,'REQ000014','wire cutter','Dc cable cutting purpose ','Unit',2.00,NULL,'Approved',NULL,'COM000001','USR000013','2026-05-13 14:49:39'),(6,'REQ000014','TAPARIA 1/4 DR SOCKET SET ','Inverter working tool ','Unit',1.00,NULL,'Approved',NULL,'COM000001','USR000013','2026-05-13 14:49:39'),(7,'REQ000016','Yellow  Flooring paint (mat finished)','Requested from product selection screen','Unit',3.00,NULL,'Pending','','COM000001','USR000013','2026-05-19 16:04:02'),(8,'REQ000019','Painting brush 4&2 inch ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000015','2026-05-20 13:58:13'),(9,'REQ000031','6\" Mould Hollow Block','Requested from product selection screen','Unit',600.00,NULL,'Approved','','COM000001','USR000004','2026-05-27 10:54:11'),(12,'REQ000032','1.5 UPVC Clamp','Requested from product selection screen','Unit',70.00,NULL,'Approved','','COM000001','USR000005','2026-05-27 15:30:43'),(13,'REQ000033','2 inch  SS bore well nipple ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 11:44:16'),(14,'REQ000034','2 inch clamp set','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 11:46:58'),(15,'REQ000035','2 inch GI bend ','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 11:49:21'),(16,'REQ000036','2 inch NRV ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 11:50:30'),(17,'REQ000037','2 inch GI coupling ','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 11:51:21'),(18,'REQ000038','16 sq mm cable pin type socket ','Requested from product selection screen','Unit',10.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 12:25:53'),(19,'REQ000043','Double Compresser Gland','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000005','2026-05-28 14:04:51'),(20,'REQ000044','8 inch bore well pipe end plate','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:14:13'),(21,'REQ000045','16 sq mm 3.5 core aluminium armoured UG cable cable','Requested from product selection screen','Unit',140.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:16:56'),(22,'REQ000046','4 sq mm 3 core copper flat  bore well cable ','Requested from product selection screen','Unit',190.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:21:34'),(23,'REQ000047','2 inch upvc bore well pipe','Requested from product selection screen','Unit',46.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:22:40'),(24,'REQ000048','1.5 inch UPVC  Tank nipple ','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:29:14'),(25,'REQ000048','1.5 inch  UPVC FTA ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:29:14'),(26,'REQ000049','1.5 inch UPVC MTA','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:30:08'),(27,'REQ000050','1.5 inch UPVC ball valve','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:33:21'),(28,'REQ000051','UPVC paste 100 ml','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:35:52'),(29,'REQ000052','1 inch UPVC MTA ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:38:27'),(30,'REQ000052','1 inch UPVC FTA ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:38:27'),(31,'REQ000053','1 inch UPVC ball valve ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:39:19'),(32,'REQ000054','1 inch UPVC union ','Requested from product selection screen','Unit',2.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:40:13'),(33,'REQ000055','2× 1 UPVc Reducer','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:42:19'),(34,'REQ000055','Celing fan ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 14:42:19'),(35,'REQ000056','2 hp pressure pump','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:11:18'),(36,'REQ000057',' Led Tube light ','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:12:35'),(37,'REQ000058','2 kw ups with battery','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:13:37'),(38,'REQ000059','Computer system with table','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:16:23'),(39,'REQ000059','Lighting arrester ','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:16:23'),(40,'REQ000060','70 sq copper multi stand cable ','Requested from product selection screen','Unit',40.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:18:34'),(41,'REQ000061','70 sq mm copper ring type leg','Requested from product selection screen','Unit',8.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:22:52'),(42,'REQ000062','Septic tank ring with closet ','4ft ring 4nos and 1 closet ','Unit',5.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:31:18'),(43,'REQ000063','Fire soil bucket ','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000015','2026-05-28 15:34:15'),(44,'REQ000064','Flooring tiles ','240sqft','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:35:35'),(45,'REQ000065','Washroom Flooring Tiles ','Flooring tiles 160sqft','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:37:57'),(46,'REQ000066','Wall tiles ','Wall tiles 160 sqft','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:40:08'),(47,'REQ000067','Tiles laying paste white ','Requested from product selection screen','Unit',6.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:43:27'),(48,'REQ000068','Control cable ','14 core 2.5 sq mm copper armoured cable ','Unit',23.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:50:43'),(49,'REQ000069','Western commode ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:53:35'),(50,'REQ000070','Wash basin ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-28 15:55:01'),(51,'REQ000071','Western commode ','Requested from product selection screen','Unit',1.00,NULL,'Pending','','COM000001','USR000004','2026-05-29 11:28:04'),(52,'REQ000073','90 sqmm Al lug round ','Requested from product selection screen','Unit',4.00,NULL,'Pending','','COM000001','USR000010','2026-05-29 16:35:16'),(53,'REQ000075','Mouse','Requested from product selection screen','Unit',10.00,NULL,'Pending','','COM000001','USR000001','2026-05-30 11:29:36'),(54,'REQ000076','BEE','Robot','Unit',100.00,'/uploads/ddd54839-d0ab-45ef-94fb-ff94d7e7a3eb.jpg','Pending','','COM000001','USR000001','2026-05-30 12:10:29'),(55,'REQ000078','Dheena','Use for Mass','Unit',1100.00,NULL,'Pending','Good Boy','COM000001','USR000001','2026-06-06 09:22:30');
/*!40000 ALTER TABLE `ccms_new_item_requests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:15
