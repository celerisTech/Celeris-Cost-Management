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
INSERT INTO `ccms_customer` VALUES ('CUS000001','Allwin Pipes','accounts@allwinpipes.com','7373052599','','S.F No : 815/4,5B , 817/2 , 818/1,2, 3 & 819/2,3,6\nSiruvalur Village\nCheviyur Road Gobichettipalayam (Tk), Erode (Dt) – 638054.','Erode','Tamil Nadu','India',638054,'gobi','33AAKFA6054G1ZN','AAKFA6054G','30_Days','Active','','Bharani Kumar.C','2025-12-23 16:07:34','Bharani Kumar.C','2026-01-08 15:25:28'),('CUS000002','AVR Mills Private Limited','avrmills.gobi.offices@gmail.com','9486421860','','40-A,Gobi Sathy Main Road K Ganapathipalayam,Kasipalayam','Erode','Tamil Nadu','India',638453,'Gobichettipalayam','33AAGCA9714Q1Z7','AAGCA9714Q','Bank','Active','','Bharani Kumar.C','2026-01-13 16:22:03','Bharani Kumar.C','2026-01-13 16:47:48'),('CUS000003','Bannari Solar Valley','bannarisolarvalley@gmail.com','9842959059','','607/4, Rajannagar, \nSathyamangalam, \nErode(Dt)\nTamil Nadu, 638401\n','erode','Tamil Nadu','India',638401,'Sathyamangalam','33AANCB2364E1ZW','AANCB2364E','Bank','Active','','Bharani Kumar.C','2026-01-21 16:34:50','Bharani Kumar.C','2026-01-21 16:34:50'),('CUS000004','Rithik Sizing Mills','rithik55610@gmail.com','9443376071','','S.F.NO. 80/2, Ikkaraithathapalli,\nASWINI ADITHYA PAPER MILL NEAR,\nSATHYAMANGALAM- 638451\nErode(Dt)\n','Erode','Tamilnadu','India',638451,NULL,'33AAICR7969L1ZL','AAICR7969L',NULL,'Active',NULL,'Bharani Kumar.C','2026-01-21 17:13:17',NULL,'2026-01-23 15:53:59'),('CUS000005','Venmalar','venmalarwindenergy@gmail.com','7904744431','','Thiruvannamalai Thandarai','Tiruvannamalai','Tamil Nadu','India',606804,'Thandarai','','','','Active','','Bharani Kumar.C','2026-02-17 17:25:07','Bharani Kumar.C','2026-02-17 17:25:07'),('CUS000006','Test Name','test@gmail.com','0000000000','','234 ','Erode','Tamil Nadu','India',638457,'Xxxxxx','','','','Active','','Sri Nikhil','2026-04-27 13:14:58','Sri Nikhil','2026-04-27 13:14:58'),('CUS000007','Pachiyappan (Lic)','admin@saransolar.in','9443022096','','Near Palaniyammal School\nKatchurrymedu,\nGobi.','Erode','Tamil Nadu','India',638452,'Gobi','','','cash','Active','','Rithani  T','2026-04-27 13:27:29','Rithani  T','2026-04-27 13:27:29'),('CUS000008','Jagan Metal Mart','info@jaganmetalmart.com','9443510985','','No 455, Modachur Road, Vadugapalayam Pudur, Gobichettipalayam South, Tamil Nadu 638476.','Erode','Tamil Nadu','India',638476,'Gobichettipalayam South','33AEWPJ8097A1Z6','AEWPJ8097A','Bank','Active','','USR000005','2026-05-04 11:49:15','Rithani  T','2026-05-04 11:49:15'),('CUS000009','JRK','jrkpowerpvtltd@gmail.com','9443145087','','S.F.NO. 80/2, Ikkaraithathapalli,\nASWINI ADITHYA PAPER MILL NEAR,\nSATHYAMANGALAM- 638451\nErode(Dt)	\n','Erode','Tamil Nadu','India',638451,'SATHYAMANGALAM','','','','Active','','USR000005','2026-05-29 15:31:04','Rithani  T','2026-05-29 15:31:04'),('CUS000010','JRK','jrkpowerpvtltd@gmail.com','9443145087','','S.F.NO. 80/2, Ikkaraithathapalli,\nASWINI ADITHYA PAPER MILL NEAR,\nSATHYAMANGALAM- 638451\nErode(Dt)	\n','Erode','Tamil Nadu','India',638451,'SATHYAMANGALAM','','','','Active','','USR000005','2026-05-29 15:31:06','Rithani  T','2026-05-29 15:31:06'),('CUS000011','JRK','jrkpowerpvtltd@gmail.com','9443145087','','S.F.NO. 80/2, Ikkaraithathapalli,\nASWINI ADITHYA PAPER MILL NEAR,\nSATHYAMANGALAM- 638451\nErode(Dt)	\n','Erode','Tamil Nadu','India',638451,'SATHYAMANGALAM','','','','Active','','USR000005','2026-05-29 15:31:10','Rithani  T','2026-05-29 15:31:10'),('CUS000012','JRK','jrkpowerpvtltd@gmail.com','9443145087','','S.F.NO. 80/2, Ikkaraithathapalli,\nASWINI ADITHYA PAPER MILL NEAR,\nSATHYAMANGALAM- 638451\nErode(Dt)	\n','Erode','Tamil Nadu','India',638451,'SATHYAMANGALAM','','','','Active','','USR000005','2026-05-29 15:31:18','Rithani  T','2026-05-29 15:31:18');
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

-- Dump completed on 2026-06-11 18:57:09
