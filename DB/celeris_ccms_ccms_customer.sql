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
-- Table structure for table `ccms_customer`
--

DROP TABLE IF EXISTS `ccms_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_customer` (
  `CM_Customer_ID` varchar(25) NOT NULL,
  `CM_Customer_Name` varchar(150) DEFAULT NULL,
  `CM_Email` varchar(150) DEFAULT NULL,
  `CM_Phone_Number` varchar(20) DEFAULT NULL,
  `CM_Alternate_Phone` varchar(20) DEFAULT NULL,
  `CM_Address` text,
  `CM_District` varchar(50) DEFAULT NULL,
  `CM_State` varchar(25) DEFAULT NULL,
  `CM_Country` varchar(25) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_Location` text,
  `CM_GST_Number` varchar(30) DEFAULT NULL,
  `CM_PAN_Number` varchar(30) DEFAULT NULL,
  `CM_Payment_Terms` varchar(100) DEFAULT NULL,
  `CM_Is_Active` enum('Active','Inactive') DEFAULT NULL,
  `CM_Create_Limit` varchar(100) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_customer`
--

LOCK TABLES `ccms_customer` WRITE;
/*!40000 ALTER TABLE `ccms_customer` DISABLE KEYS */;
INSERT INTO `ccms_customer` VALUES ('CUS000001','Dr. Preethi','preethidentistry@gmail.com','9087455557','','SRT Corner, Mettupalayam - Cuddalore Rd, Sathyamangalam','Erode','Tamil Nadu','India',638456,'Sathyamangalam','','AHNPP4314D','10_Days','Active','','Prabakar.D','2025-12-02 17:25:08','Prabakar.D','2025-12-02 17:25:08'),('CUS000002','Yaksha Systems','sureshcse.ccna@gmail.com','9842566465','9842566466','Kayalvizhi Complex, Erode Main Road, Karatoor.','Erode','Tamil Nadu','India',638476,'Gobichettipalayam','','QWERD5467F','UPI','Active','','Prabakar.D','2025-12-04 18:23:43','Prabakar.D','2025-12-04 18:26:39'),('CUS000003','Saran Soalar Pvt Ltd','info@saransolar.in',' 9524210055',' 9524210055','131/2, Main road,\nKullampalayam,','Erode','Tamil Nadu','India',638476,'gobichettipalayam','','SARAN2025S','30_Days','Active','','Prabakar.D','2025-12-06 09:59:15','Prabakar.D','2026-01-07 17:35:42'),('CUS000004','Gobi Dental Center','gobidental@gmail.com','9362221628','','251, Cutchery St, Opp. Police Station,','Erode','Tamil Nadu','India',638476,'Gobichettipalayam','','GOBID9662C','20_Days','Active','','Prabakar.D','2025-12-06 10:18:53','Prabakar.D','2025-12-06 10:18:53'),('CUS000005','Vignesh','vignesh@gmail.com','9842198828','','North Raja street','Salem','Tamil Nadu','India',638476,'Kolathor','','VIGNS1254D','30_Days','Active','','Prabakar.D','2025-12-06 10:27:11','Prabakar.D','2025-12-06 10:27:11'),('CUS000006','Raaj Solar ','raajsolarpowersystems@gmail.com','9865974232','9865974233','52, Bhavani Road, Near Bus Stand,','Erode','Tamil Nadu','India',638455,'Kavindapadi','','RAAJS2025K','20_Days','Active','','Prabakar.D','2025-12-06 10:32:51','Prabakar.D','2025-12-06 10:32:51'),('CUS000007','Dr. Rama Pradeep','ramapradeep@gmail.com','9965565755','','Ramakrishna Hospital, \nModachur Road,','Gobichettipalayam','Tamil Nadu','India',638476,NULL,'','RAMAC1122D',NULL,'Active',NULL,'Prabakar.D','2025-12-06 10:50:51',NULL,'2025-12-06 11:14:21'),('CUS000008','Somu P','somufca@gmail.com','8754502794','','GNST Associates','ERODE ','Tamil Nadu','India',638453,'erode','','CNIPT1432R','10_Days','Active','','Prabakar.D','2025-12-08 17:46:00','Prabakar.D','2026-03-27 09:32:10'),('CUS000009','Prabakar','Prabakar.d1@gmail.com','9940356707','','Gobichettipalayam','Erode','TamilNadu','India',638456,'Gobi','','GEJPM6150L','30_Days','Active','','Prabakar.D','2025-12-10 09:59:45','Prabakar.D','2025-12-10 09:59:45'),('CUS000010','Surya Glass House','surya@gmail.com','9965128908','9025735740','13,Gobi','Erode','TamilNadu','India',638476,'Gobi','','SASED2432S','30_Days','Active','','Prabakar.D','2025-12-22 11:21:21','Prabakar.D','2025-12-22 11:21:21'),('CUS000011','Celeris','karthikceleris@gmail.com','6379100400','','Gobichettipalyam','Erode','Tamil Nadu','India',638453,'erode','','CNIPT1234T','UPI','Active','','Prabakar.D','2025-12-24 18:37:45','Prabakar.D','2025-12-24 18:37:45'),('CUS000012','DMS Farms -Automated Irrigation Project','duraibabu.ns@gmail.com','9606066056','','DMS Farms, Pennagaram, Dharmapuri','Dharmapuri','Tamil Nadu','India',636705,'Pennagaram','','AJTPD2754J','10_Days','Active','','Prabakar.D','2025-12-31 09:34:01','Prabakar.D','2025-12-31 09:34:01'),('CUS000013','Celeris Solutions','info@celerissolutions.in','9940356707','','sathasivam street\nther corner','Erode','Tamil Nadu','India',638452,'Gobichettipalayam','','ABCDE1234F','30_Days','Active','','Prabakar.D','2026-01-02 11:56:09','Prabakar.D','2026-04-20 17:23:17'),('CUS000014','Lions','info@celerissolutions.in','9940356707','','Gobichettipalyam','Erode','Tamil Nadu','India',638453,'erode','','CNIPT1234T','UPI','Active','','Prabakar.D','2026-01-02 18:04:42','Prabakar.D','2026-01-02 18:04:42'),('CUS000015','Tanio','talentsprime@gmail.com','4923716652','','Angola','angola','angola','India',666596,'angola','','CCOMP2213E','DIGITAL','Active','','Prabakar.D','2026-01-08 11:05:32','Prabakar.D','2026-01-08 11:05:32'),('CUS000016','Gowri Prabakar','saivasthragobi@gmail.com','8754502794','','Sathasivam Street','Erode','Tamil Nadu','India',638453,'Gobi','','JTAPM1698Q','Cash','Active','','Prabakar.D','2026-01-08 11:35:48','Prabakar.D','2026-01-08 11:35:48'),('CUS000017','Gaming','celerissolutions@gmail.com','6379100400','','Gobichettipalyam','Erode','Tamil Nadu','India',638453,'erode','','CNIPT1234T','UPI','Active','','Prabakar.D','2026-01-08 18:06:38','Prabakar.D','2026-01-08 18:06:38'),('CUS000018','Prathipa','dheenaprabhu@celerissolutions.in','6379100400','','vaikkal street\nkullampalayam','Erode','Tamil Nadu','India',638476,NULL,'','LBVPS1473G',NULL,'Active',NULL,'Prabakar.D','2026-01-22 18:02:59',NULL,'2026-01-28 12:03:16'),('CUS000019','K.s.vilashini','nadusalimpex@gmail.com','9344855407','','210/160,Sathy main Road,kasipalayam,Gobi','Erode','Tamil Nadu','India',638454,'Gobichettipalayam','','GOMPD9595D','Bank','Active','','Prabakar.D','2026-03-07 09:44:58','Prabakar.D','2026-03-07 09:44:58'),('CUS000020','P H E - Priyasamy Hydraulic Equipements','phe@gmail.com','9578688888','','7C92+GXF, Erodu Dist, 24/A1, PN Rd, , Tamil Nadu ','Tiruppur','Tamil Nadu','India',638103,'Kunnathur','','LBVPS1473G','Bank','Active','','Prabakar.D','2026-04-16 11:31:11','Prabakar.D','2026-04-16 11:31:11'),('CUS000021','Avvai Scholl Of Nursing','avvai@gmail.com',' 9500624261','','No. 5, Panjupettai Big Street,\n(Behind Ekambaranathar Koil West Mada Street),\n','Kanchipuram','Tamil Nadu','India',631502,'Kanchipuram','','DVCPM8790R','30 Days','Active','','Prabakar.D','2026-04-16 11:36:15','Prabakar.D','2026-04-16 11:36:15'),('CUS000022','Ragupathy','ragupathy@gamil.com','6383978299','','Gobi','Erode','Tamil Nadu','India',638476,'Gobi','','GOMPD9595D','Bank','Active','','Prabakar.D','2026-04-20 17:07:56','Prabakar.D','2026-04-20 17:07:56'),('CUS000023','Sri Paariyur Amman Jewellery','sripaariyurammanjewelley@gamil.com','9003328040','','Gobi (Main):\n5, Sellappa Nagar, V.A.S. Home, Near Agri Arms, Gobi - 638 452','Erode','Tamil Nadu','India',638476,'Gobichettipalayam','','GILPR9879F','Bank','Active','','Prabakar.D','2026-04-20 17:17:19','Prabakar.D','2026-04-20 17:17:19'),('CUS000024','Eye Hospital Website','info@celerissolutions.in','9940356707','','25,Sadhasivam Street','Erode','Tamilnadu','India',638542,'Gobichettipalayam','','ABCDE1234F','Good','Active','','Prabakar.D','2026-04-21 12:26:13','Prabakar.D','2026-04-21 12:26:13'),('CUS000025','Poster Creation','info@celerissolutions.in','9940356707','','25,Sadhasivam Street','Erode','Tamilnadu','India',638542,'Gobichettipalayam','','ABCDE1234F','Good','Active','','Prabakar.D','2026-04-21 12:52:06','Prabakar.D','2026-04-21 12:52:06'),('CUS000026','Module Creation','info@celerissolutions.in','9940356707','','25,Sadhasivam Street','Erode','Tamilnadu','India',638542,'Gobichettipalayam','','ABCDE1234F','Good','Active','','Prabakar.D','2026-04-21 13:13:11','Prabakar.D','2026-04-21 13:13:11'),('CUS000027','Celeris Solutions Project','info@celerissolutions.in','9940356707','','25,Sadhasivam Street','Erode','Tamilnadu','India',638542,'Gobichettipalayam','','ABCDE1234F','Good','Active','','Prabakar.D','2026-04-21 13:35:01','Prabakar.D','2026-04-21 13:35:01'),('CUS000028','Thirumoolar Gurupeedam App ','info@celerissolutions.in','9940356707','','Sathasivam street\nther corner','Erode','Tamil Nadu','India',638452,'Gobichettipalayam','','ABCDE1234F','Not Paid','Active','','Prabakar.D','2026-05-06 12:47:26','Prabakar.D','2026-05-06 12:48:59'),('CUS000029','M Maheswari ','worldwondersbookofrecord@gmail.com','9361934070','','Sakthi Main Road','Erode','Tamil Nadu','India',638453,'Gobichettipalayam ','','GILPR9879F','Bank','Active','','Prabakar.D','2026-05-06 15:51:02','Prabakar.D','2026-05-06 15:51:02'),('CUS000030','Kalaivanan','info@celerissolutions.in','9944299947','','NO , 23F , Bloack D, Senthankadhan Complex,\nOpp to Jeeva Dippo .','Erode','Tamil Nadu','India',638476,'Gobichettipalayam','','ABCDE1234F','Not Paid','Active','','Prabakar.D','2026-05-06 18:17:12','Prabakar.D','2026-05-06 18:17:12'),('CUS000031','Jobs And Services','info@celerissolutions.in','9940356707','','Sathasivam street\nBehind co optex','Erode','Tamil Nadu','India',638452,'Gobichettipalayam','','ABCDE1234F','Not Paid','Active','','Prabakar.D','2026-05-07 11:06:58','Prabakar.D','2026-05-07 11:06:58'),('CUS000032','Sri Om Shakthi Transport','info@celerissolutions.in','9940356707','','Sathasivam street\nBehind Co optex','Erode','Tamil Nadu','India',638452,'Gobichettipalayam','','ABCDE1234F','Not Paid','Active','','Prabakar.D','2026-05-07 11:54:23','Prabakar.D','2026-05-07 11:54:23'),('CUS000033','Booking App','info@celerissolutions.in','9940356707','','Sathasivam street\nBehind Co optex','Erode','Tamil Nadu','India',638452,'Gobichettipalayam','','ABCDE1234F','Not Paid','Active','','Prabakar.D','2026-05-07 12:10:52','Prabakar.D','2026-05-07 12:10:52');
/*!40000 ALTER TABLE `ccms_customer` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21  9:56:28
