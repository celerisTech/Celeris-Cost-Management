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
-- Table structure for table `ccms_users`
--

DROP TABLE IF EXISTS `ccms_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_users` (
  `CM_User_ID` varchar(25) NOT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_Role_ID` varchar(25) DEFAULT NULL,
  `CM_Labor_Type_ID` varchar(25) DEFAULT NULL,
  `CM_First_Name` varchar(50) DEFAULT NULL,
  `CM_Last_Name` varchar(50) DEFAULT NULL,
  `CM_Full_Name` varchar(150) DEFAULT NULL,
  `CM_Father_Name` varchar(50) DEFAULT NULL,
  `CM_Marriage_Status` varchar(50) DEFAULT NULL,
  `CM_Phone_Number` varchar(15) DEFAULT NULL,
  `CM_Alternative_Phone` varchar(15) DEFAULT NULL,
  `CM_Aadhaar_Number` varchar(15) DEFAULT NULL,
  `CM_PAN_Number` varchar(10) DEFAULT NULL,
  `CM_Password` varchar(255) DEFAULT NULL,
  `CM_Email` varchar(150) DEFAULT NULL,
  `CM_Address` varchar(100) DEFAULT NULL,
  `CM_City` varchar(50) DEFAULT NULL,
  `CM_District` varchar(100) DEFAULT NULL,
  `CM_Date_Of_Birth` date DEFAULT NULL,
  `CM_Gender` varchar(50) DEFAULT NULL,
  `CM_Higher_Education` varchar(100) DEFAULT NULL,
  `CM_Previous_Experiences` text,
  `CM_State` varchar(50) DEFAULT NULL,
  `CM_Country` varchar(50) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_Photo_URL` text,
  `CM_Is_Active` enum('Active','Inactive') DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_User_ID`),
  KEY `fk_users_company` (`CM_Company_ID`),
  KEY `fk_users_role` (`CM_Role_ID`),
  KEY `fk_user_labor` (`CM_Labor_Type_ID`),
  CONSTRAINT `fk_user_labor` FOREIGN KEY (`CM_Labor_Type_ID`) REFERENCES `ccms_labor` (`CM_Labor_Type_ID`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`CM_Company_ID`) REFERENCES `ccms_companies` (`CM_Company_ID`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`CM_Role_ID`) REFERENCES `ccms_roles_master` (`CM_Role_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_users`
--

LOCK TABLES `ccms_users` WRITE;
/*!40000 ALTER TABLE `ccms_users` DISABLE KEYS */;
INSERT INTO `ccms_users` VALUES ('USR000001','COM000001','ROL000001',NULL,'Baranikumar C',NULL,'Bharani Kumar.C','Devaraj','Married','9524210055','9940356707',NULL,NULL,'$2b$12$RNirBFedTRoAy3kHXSrHZ.ye6NSYbihkGUsWtgHdpCVws51yNyY46','saransolarpvtltd@gmail.com','131/2 Kullampalayam Main Road Gobi','Gobichettipalayam','Erode',NULL,'Male',NULL,NULL,'Tamil Nadu','India',638476,'/uploads/profiles/user_USR000001_1771329770540.jpg','Active','Prabakar.D','2025-08-29 13:13:58','SYSTEM','2026-02-17 17:34:48'),('USR000002','COM000001','ROL000002',NULL,'Saravanan ','C','Saravanan  C','Chandra Mohan.N','Single','8015154848','8015154848','907562426423','LBVPS1473G','$2a$12$x52LAUaqXyz6zwRx9BhyiuHjRFaPXTMzcoSLkaHryF29sHDrWE6pO','saravanakumarpandiyan123@gmail.com','546, Pillaiyar Kovil Street, Kullampalayam ','Gobichettipalayam ','Erode','2000-05-28','Male','MBA ','2 Years ','Tamil Nadu ','India',638476,'/uploads/profiles/user_USR000002_1778033744625.jpg','Active','Prabakar.D','2025-12-18 15:38:24','SYSTEM','2026-05-06 07:45:44'),('USR000003','COM000001','ROL000003','LAB000005','Viji','S','Viji S','Subramani','Married','7904744431','','341630040937','','$2a$12$xTxfh7WszxwQf7XUtygzPOtWy/Zf9DoO1Hsh/ellhFbu7uLO.fLf6','viji@gmail.com','252-F,Pusari Kotta,Sananadal,Kalasthambadi','Tiruvannamalai','Tiruvannamalai','1993-06-08','Male','','0','Tamil Nadu','India',606805,'','Active','Bharani Kumar.C','2025-12-24 00:10:29','SYSTEM','2026-05-04 11:09:22'),('USR000004','COM000001','ROL000003','LAB000009','Senkathir','C','Senkathir C','CHANTHIRAN','Single','9566990696','9566990696','719622003084','','$2b$12$RNirBFedTRoAy3kHXSrHZ.ye6NSYbihkGUsWtgHdpCVws51yNyY46','senkathirkk@gmail.com','395,ANNAMALIGOUNDERTHOOTAM.BODICHINNAMPALAYAM','Gobichettipalayam','Erode','1994-04-19','Male','','0','Tamil Nadu','India',638453,NULL,'Active','Bharani Kumar.C','2025-12-24 14:26:38','SYSTEM','2026-03-19 11:57:03'),('USR000005','COM000001','ROL000002',NULL,'Rithani ','T','Rithani  T','Tharmalingam','Single','8015150808','','','','$2a$12$vHbH1oXApJLkLx8JvZMFQuV5jgfKFGN6481dHVZBTjogdKPdGKQkm','rithanir@gmail.com','','','','2001-08-28','Female','','','','',NULL,'','Active','Bharani Kumar.C','2025-12-24 14:33:20','SYSTEM','2026-04-22 10:04:18'),('USR000006','COM000001','ROL000003','LAB000012','Sundaraj ','P','Sundaraj  P','Palani','Single','7695968707','','','','$2a$12$pCOF7uveweZVB.6zc8Z/l.4xssBm662X4mRu2Ez/xeZhmZQprziJm','psundar803@gmail.com','No 5 vadakku theru, adampallam.','Thiruvannamalai','Tiruvannamalai','2000-06-20','Male','','2','Tamil Nadu','India',606804,'','Active','Bharani Kumar.C','2026-01-29 16:34:43',NULL,NULL),('USR000007','COM000001','ROL000003','LAB000007','Sureshkumar','N','Sureshkumar N','Nataraj','Single','8637450003','','958544941402','FVNPS3237L','$2a$12$FDcUuf1EOJWQceDqrIHRMuSZGWgeuPxl0W44lnsm.0qX03tZoXu06','','1/9, 1St Street,Rajan nagar,','Rajannagar','Erode','1983-03-17','Male','','','Tamil Nadu','India',638451,'','Active','Bharani Kumar.C','2026-02-17 17:21:16',NULL,NULL),('USR000008','COM000001','ROL000002','LAB000011','Manohari','V','Manohari V','mohanraj','Married','8015157676','8015157676','987352198217','BPSPM2781L','$2a$12$exoXzzGevA3plSBiu2XReudNS3sjpf1pv6odp9.n3nk9KjQntUTly','manovijay31@gmail.com','254,tholapesi nagar,Kullampalyam','Gobichettipalayam','Erode','1983-03-27','Female','D.CT','14YEARS','Tamil Nadu','India',638476,'','Active','Bharani Kumar.C','2026-02-23 16:26:33','SYSTEM','2026-02-23 16:35:03'),('USR000009','COM000001','ROL000003','LAB000008','Thangarasu','N','Thangarasu N','Natesan','Married','8778310436','','837412421271','ETIPA4718J','$2a$12$fGq41BKHug1YRNtMAGi9Y.5u.zFJ8IN8zN9Xf24z1WOIlyt6PRl9u','cnthangam1994@gmail.com','12,Chinna Karukka Palayam,Olagadam','Bhavani','Erode','1994-06-03','Male','','0','Tamil Nadu','India',638314,'','Active','Rithani  T','2026-03-09 10:16:03','SYSTEM','2026-05-05 12:15:39'),('USR000010','COM000001','ROL000003','LAB000045','Afrose','S','Afrose S','','Single','6374032169',NULL,'426338301301','ETIPA4718J','$2a$12$ULLcTABkSMoTen5JB9VtA.R48X5R18ya2JRL4hZfT0L5tMMPUwJ2m','aafrose618@gmail.com',NULL,'',NULL,'2004-07-01','Male','','0',NULL,'India',NULL,NULL,'Active','Rithani  T','2026-03-09 10:17:57',NULL,NULL),('USR000011','COM000001','ROL000003','LAB000003','Krishnamurthy','P','Krishnamurthy P','M.Pachiannan','Married','9363728970','','467770099492','CBIPP4984R','$2a$12$30sAWI6IUzYa/mbwZXfa/OeMhrC36J5gSDstJKvHeEvXmSZhgpkHS','krishnamurthyp057@gmail.com','37/65 East Street,Savandapur','Savandapur','Erode','1972-02-05','Male','','','Tamil Nadu','India',638502,'','Active','Rithani  T','2026-03-09 10:55:57','SYSTEM','2026-03-09 10:59:08'),('USR000012','COM000001','ROL000001',NULL,'Nikhil ','Saran','Sri Nikhil','','Married','9629335784',NULL,'','','$2a$12$AFinjAcMn3/RDBaAMieG6OryrTawm/IFmL379Fhbc/xpq4EBljDO.',NULL,NULL,'',NULL,NULL,'Male','','',NULL,NULL,NULL,NULL,'Active','Bharani Kumar.C','2026-03-17 18:28:14',NULL,NULL),('USR000013','COM000001','ROL000003','LAB000004','Mohan','Kumar.L','Mohan Kumar.L','Loganathan','Married','8825696373','','853620347398','DVCPM8790R','$2a$12$xTWWDcKmEAVoMugt6Y/8Hu9eXdZ6Jvi4YiKCiNyz2RFHZcol/d3ii','mohankumar@gmail.com','5, Dhoorayur,Nadupalaym','Chithode','Erode','1996-04-30','Male','','','Tamil Nadu','India',638102,'','Active','Bharani Kumar.C','2026-03-18 11:30:55',NULL,NULL),('USR000014','COM000001','ROL000003',NULL,'Arun','M','Arun M','','Single','9942683680','','874569440053','CKZPA8241E',NULL,NULL,'12','','Erode ','1998-05-15','Male','','1','Tamilnadu ','India',638476,'','Active','Rithani  T','2026-05-11 10:06:53',NULL,NULL),('USR000015','COM000001','ROL000003',NULL,'Satheeskarthick ','P','Satheeskarthick  P','Ponnusamy ','Married','8056591717','','952862123141','EGHPS9391K','$2a$12$IGDnIgzvZijPpVDETtHY8eeXCVefTNK6YBCoWhS1Xr8aLY4YXyGi2','satheeskarthick866@gmail.com','1/167, Muthu Mariamman Kovil Street, Rajan Nagar ','Sathyamangalam ','Erode ','1984-03-19','Male','Iti Electrical ','20','Tamilnadu ','India',638451,'','Active','Bharani Kumar.C','2026-05-11 18:27:53',NULL,NULL),('USR000016','COM000001','ROL000003',NULL,'Parvendhan','A','Parvendhan A','Arulmurugan','Single','8667365434','','297948314529','HJZPP2602G','$2a$12$7SCn8q4KDBGwn3bWhqRIl.ceZ9IY/2MoQTUr2CFzq9wPzpwUpdh8i',NULL,'Door No 174. South Street,Meliruppu','Panruti','Cuddalore','2006-02-26','Male','','','Tamil Nadu','India',607103,'','Active','Bharani Kumar.C','2026-05-12 19:05:04',NULL,NULL);
/*!40000 ALTER TABLE `ccms_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 18:57:20
