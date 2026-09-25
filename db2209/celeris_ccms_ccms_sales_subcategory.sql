-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: celeris_ccms
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `ccms_sales_subcategory`
--

DROP TABLE IF EXISTS `ccms_sales_subcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_sales_subcategory` (
  `CM_Subcategory_ID` int NOT NULL AUTO_INCREMENT,
  `CM_Category_ID` int NOT NULL,
  `CM_Subcategory_Name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `CM_Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `CM_Created_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT CURRENT_TIMESTAMP,
  `CM_Updated_By` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CM_Updated_At` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CM_Subcategory_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_sales_subcategory`
--

LOCK TABLES `ccms_sales_subcategory` WRITE;
/*!40000 ALTER TABLE `ccms_sales_subcategory` DISABLE KEYS */;
INSERT INTO `ccms_sales_subcategory` VALUES (1,1,'General Hospital',NULL,'USR000015','2026-05-21 17:34:48','USR000015','2026-05-21 17:43:09'),(3,2,'Pharmacy',NULL,'USR000015','2026-05-21 17:36:56',NULL,'2026-05-21 17:36:56'),(4,3,'Dental Hospital',NULL,'USR000015','2026-05-21 17:38:06',NULL,'2026-05-21 17:38:06'),(5,3,'Dental Clinic',NULL,'USR000015','2026-05-21 17:38:20',NULL,'2026-05-21 17:38:20'),(6,1,'Dental Clinic',NULL,'USR000015','2026-05-21 17:43:40',NULL,'2026-05-21 17:43:40'),(7,1,'Pet Clinic',NULL,'USR000015','2026-05-21 17:44:08',NULL,'2026-05-21 17:44:08'),(8,4,'Jewellery Shop',NULL,'USR000015','2026-05-21 17:46:32',NULL,'2026-05-21 17:46:32'),(9,4,'Pawn Brokers',NULL,'USR000015','2026-05-21 17:46:54',NULL,'2026-05-21 17:46:54'),(10,5,'Workshop/ Lathe works/ Fabrication',NULL,'USR000015','2026-05-21 17:54:07',NULL,'2026-05-21 17:54:07'),(11,5,'Production/ Service/ Builders/Construction',NULL,'USR000015','2026-05-21 17:57:18','USR000001','2026-06-30 10:07:18'),(12,6,'Hotel/Restaurant/Resort',NULL,'USR000015','2026-05-21 18:07:17','USR000001','2026-05-26 16:04:45'),(13,6,'Bakery/Cafe/Tea Stall',NULL,'USR000015','2026-05-21 18:07:51',NULL,'2026-05-21 18:07:51'),(14,7,'Installation/Maintenance/Service',NULL,'USR000015','2026-05-21 18:11:31',NULL,'2026-05-21 18:11:31'),(15,7,'Household/Furniture/Appliances',NULL,'USR000015','2026-05-21 18:13:19','USR000001','2026-05-26 15:39:34'),(16,8,'Bike/Car/Commercial',NULL,'USR000015','2026-05-21 18:15:31',NULL,'2026-05-21 18:15:31'),(17,9,'Clothing Store/Silks/Button center/Baby shop/Toys & Gifts',NULL,'USR000015','2026-05-21 18:26:46','USR000015','2026-07-04 10:23:39'),(18,9,'Department Store/Super Market/FMCG & all Distributor',NULL,'USR000015','2026-05-21 18:32:15','USR000015','2026-07-02 10:13:57'),(19,10,'Garments/Spinning Mill/Tailor/Sports wear',NULL,'USR000015','2026-05-21 18:36:27','USR000001','2026-05-26 16:16:52'),(20,9,'Fridge/Washing Machine/Air coolers',NULL,'USR000001','2026-05-25 10:14:05','USR000016','2026-06-10 13:19:35'),(21,11,'Solar Panel/Generator/Water/Wind mill',NULL,'USR000001','2026-05-25 10:22:33','USR000001','2026-05-26 15:41:30'),(22,9,'Rice/ Oil/ Masala/ Food products',NULL,'USR000008','2026-05-26 09:47:20','USR000015','2026-07-02 09:44:56'),(23,9,'Electricals/Granites/Tiles/Bricks/Paints/Electronics',NULL,'USR000001','2026-05-26 15:00:57','USR000016','2026-06-02 14:50:36'),(24,12,'General/Health/Automobile',NULL,'USR000001','2026-05-26 15:13:42',NULL,'2026-05-26 15:13:42'),(25,9,'Furniture/Plastic/Stationery/Small Appliances',NULL,'USR000001','2026-05-26 15:17:28','USR000016','2026-05-27 15:39:30'),(26,9,'Constructions/Old Scrap/Metals/Plumbing/Steels',NULL,'USR000001','2026-05-26 15:18:58','USR000015','2026-07-04 09:31:10'),(27,13,'Overseas Sales/E-commerce/Licence',NULL,'USR000001','2026-05-26 16:02:27',NULL,'2026-05-26 16:02:27'),(28,6,'Tour packages/VISA/Aboard',NULL,'USR000001','2026-05-26 16:06:35',NULL,'2026-05-26 16:06:35'),(29,8,'Goods/Courier/Recovery/Logistics/Tracking',NULL,'USR000001','2026-05-26 16:10:19','USR000001','2026-05-26 16:13:18'),(30,14,'Farming/Irrigation/Weaving/Fishing',NULL,'USR000001','2026-05-26 16:16:10',NULL,'2026-05-26 16:16:10'),(31,9,'Agri Allied/Fertilizer/Irrigation/Feeds',NULL,'USR000001','2026-05-27 11:02:55',NULL,'2026-05-27 11:02:55'),(32,9,'Disposable/Eco Friendly/Home Goods/Fancy',NULL,'USR000016','2026-05-27 12:14:04','USR000016','2026-06-05 10:26:13'),(33,1,'Heart Centre',NULL,'USR000008','2026-05-30 11:12:32',NULL,'2026-05-30 11:12:32'),(34,1,'Eye Hospital',NULL,'USR000008','2026-06-01 14:10:23',NULL,'2026-06-01 14:10:23'),(35,1,'Ortho Hospital',NULL,'USR000008','2026-06-01 14:11:46',NULL,'2026-06-01 14:11:46'),(36,1,'Physiotherapy',NULL,'USR000008','2026-06-01 15:09:58',NULL,'2026-06-01 15:09:58'),(37,1,'Children Hospital',NULL,'USR000008','2026-06-01 15:10:49',NULL,'2026-06-01 15:10:49'),(39,1,'Diabetes Centre',NULL,'USR000008','2026-06-01 15:16:43',NULL,'2026-06-01 15:16:43'),(40,9,'Doors/Windows/Plywoods/ Hardwares',NULL,'USR000016','2026-06-05 09:33:23','USR000016','2026-06-05 09:34:29'),(41,9,'Architects/Interiors Design',NULL,'USR000016','2026-06-10 13:19:08',NULL,'2026-06-10 13:19:08'),(43,9,'Electrical/ Plumming',NULL,'USR000008','2026-06-15 11:01:09',NULL,'2026-06-15 11:01:09'),(51,15,'Hardware Sales',NULL,'USR000001','2026-06-16 10:54:25',NULL,'2026-06-16 10:54:25'),(52,1,'Skin | Hair | Body care',NULL,'USR000008','2026-06-18 14:57:17',NULL,'2026-06-18 14:57:17'),(53,4,'1gm Fashion Jewellery',NULL,'USR000008','2026-06-18 15:02:08',NULL,'2026-06-18 15:02:08'),(54,9,'Eyeglasses, Sunglasses & Contact Lens',NULL,'USR000008','2026-06-18 15:05:05',NULL,'2026-06-18 15:05:05'),(55,6,'Home Foods | Food Products',NULL,'USR000008','2026-06-18 16:18:27',NULL,'2026-06-18 16:18:27'),(56,17,'Mandabam/Mini Halls/Events',NULL,'USR000001','2026-06-22 10:33:30',NULL,'2026-06-22 10:33:30'),(57,9,'Cars-Bikes Dealers/Vehicle showroom/Auto consulting',NULL,'USR000001','2026-06-22 10:44:35','USR000015','2026-07-09 10:22:08'),(58,19,'Installation/Maintanance/Service',NULL,'USR000008','2026-06-23 17:59:13',NULL,'2026-06-23 17:59:13'),(59,5,'Food Making | Orders | Delivery',NULL,'USR000008','2026-06-27 10:55:30',NULL,'2026-06-27 10:55:30'),(60,1,'Eye Clinic',NULL,'USR000001','2026-06-27 12:52:23',NULL,'2026-06-27 12:52:23'),(61,21,'Battery',NULL,'USR000001','2026-06-30 09:59:31',NULL,'2026-06-30 09:59:31'),(62,9,'Dresses/Makeup Accessories',NULL,'USR000001','2026-06-30 20:30:38',NULL,'2026-06-30 20:30:38'),(63,9,'Batteries/Agriculture Equipments/Water Purifiers/Solar system',NULL,'USR000001','2026-06-30 20:44:24','USR000015','2026-07-04 10:21:22'),(64,1,'Psychiatrist',NULL,'USR000001','2026-07-01 09:54:55',NULL,'2026-07-01 09:54:55'),(65,22,'Psychiatrist',NULL,'USR000001','2026-07-01 10:07:54',NULL,'2026-07-01 10:07:54'),(66,22,'Dental',NULL,'USR000001','2026-07-01 10:15:25',NULL,'2026-07-01 10:15:25'),(67,1,'Kidney Hospital',NULL,'USR000001','2026-07-01 10:23:04',NULL,'2026-07-01 10:23:04'),(68,5,'Rice Mill/Flour mill/Food-Snacks related',NULL,'USR000015','2026-07-01 11:39:52',NULL,'2026-07-01 11:39:52'),(69,17,'Decorations',NULL,'USR000007','2026-07-01 16:44:35',NULL,'2026-07-01 16:44:35'),(70,9,'Hardwares/Auto parts/Vehicle spares related',NULL,'USR000015','2026-07-02 09:45:59','USR000015','2026-07-03 18:01:05'),(71,22,'Physician',NULL,'USR000001','2026-07-02 11:23:24',NULL,'2026-07-02 11:23:24'),(72,9,'Organics Products',NULL,'USR000018','2026-07-02 20:48:05',NULL,'2026-07-02 20:48:05'),(73,22,'Diagnosis',NULL,'USR000001','2026-07-03 10:36:01',NULL,'2026-07-03 10:36:01'),(74,1,'ENT Hospital',NULL,'USR000015','2026-07-03 17:58:06',NULL,'2026-07-03 17:58:06'),(75,9,'Shoe/Chappal shop/Bags/Imported goods shop/Novelties/Fancy',NULL,'USR000015','2026-07-04 10:30:48',NULL,'2026-07-04 10:30:48'),(76,15,'vehicle services',NULL,'USR000018','2026-07-14 18:13:54',NULL,'2026-07-14 18:13:54'),(77,27,'Swimming pool/Tennis court/Gaming',NULL,'USR000015','2026-07-20 13:55:46',NULL,'2026-07-20 13:55:46'),(78,28,'Machine Sales & service',NULL,'USR000015','2026-07-24 11:56:11',NULL,'2026-07-24 11:56:11'),(79,6,'Catering',NULL,'USR000008','2026-07-31 18:18:39',NULL,'2026-07-31 18:18:39'),(80,41,'Franchise, Sales Partner',NULL,'USR000015','2026-08-20 23:54:58',NULL,'2026-08-20 23:54:58');
/*!40000 ALTER TABLE `ccms_sales_subcategory` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:59
