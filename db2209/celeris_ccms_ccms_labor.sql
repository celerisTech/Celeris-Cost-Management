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
-- Table structure for table `ccms_labor`
--

DROP TABLE IF EXISTS `ccms_labor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccms_labor` (
  `CM_Labor_Type_ID` varchar(25) NOT NULL,
  `CM_Labor_Code` varchar(50) DEFAULT NULL,
  `CM_Labor_Type` enum('Labor','Temporary','Permanent','Contract','Office') DEFAULT NULL,
  `CM_Wage_Type` enum('PerHour','PerDay','PerMonth') DEFAULT NULL,
  `CM_Wage_Amount` decimal(10,2) DEFAULT NULL,
  `CM_Company_ID` varchar(25) DEFAULT NULL,
  `CM_First_Name` varchar(50) DEFAULT NULL,
  `CM_Last_Name` varchar(50) DEFAULT NULL,
  `CM_Fathers_Name` varchar(100) DEFAULT NULL,
  `CM_Date_Of_Birth` date DEFAULT NULL,
  `CM_Labor_Join_Date` date DEFAULT NULL,
  `CM_Sex` enum('Male','Female','Other') DEFAULT NULL,
  `CM_Marriage_Status` enum('Single','Married','Divorced','Widowed') DEFAULT NULL,
  `CM_Previous_Experience` varchar(255) DEFAULT NULL,
  `CM_Labor_Roll` varchar(100) DEFAULT NULL,
  `CM_Higher_Education` varchar(50) DEFAULT NULL,
  `CM_Email` varchar(150) DEFAULT NULL,
  `CM_Phone_Number` varchar(20) DEFAULT NULL,
  `CM_Alternate_Phone` varchar(20) DEFAULT NULL,
  `CM_Labor_Image` text,
  `CM_Status` enum('Active','Inactive') DEFAULT NULL,
  `CM_Delete_Type` enum('Resigned','Terminated','Absconded','Retired','Transferred','Duplicate Entry','Temporary Completed','Other') DEFAULT NULL,
  `CM_Delete_Reason` text,
  `CM_Address` text,
  `CM_City` varchar(50) DEFAULT NULL,
  `CM_District` varchar(50) DEFAULT NULL,
  `CM_State` varchar(25) DEFAULT NULL,
  `CM_Country` varchar(25) DEFAULT NULL,
  `CM_Postal_Code` int DEFAULT NULL,
  `CM_Aadhar_Number` bigint DEFAULT NULL,
  `CM_PAN_Number` varchar(50) DEFAULT NULL,
  `CM_Aadhar_Image` longtext,
  `CM_PAN_Image` longtext,
  `CM_Bank_Name` varchar(100) DEFAULT NULL,
  `CM_Bank_Branch` varchar(100) DEFAULT NULL,
  `CM_Bank_IFSC` varchar(20) DEFAULT NULL,
  `CM_Bank_Account_Number` varchar(30) DEFAULT NULL,
  `CM_Account_Holder_Name` varchar(100) DEFAULT NULL,
  `CM_UPI_ID` varchar(50) DEFAULT NULL,
  `CM_Created_By` varchar(50) DEFAULT NULL,
  `CM_Created_At` datetime DEFAULT NULL,
  `CM_Uploaded_By` varchar(50) DEFAULT NULL,
  `CM_Uploaded_At` datetime DEFAULT NULL,
  PRIMARY KEY (`CM_Labor_Type_ID`),
  KEY `fk_labor_company` (`CM_Company_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_labor`
--

LOCK TABLES `ccms_labor` WRITE;
/*!40000 ALTER TABLE `ccms_labor` DISABLE KEYS */;
INSERT INTO `ccms_labor` VALUES ('LAB000001','CS001','Permanent','PerMonth',17500.00,'COM000001','Dheena','Prabhu.S','Senthil Kumar.N','2002-08-24','2025-03-17','Male','Single','Fresher','Web Devloper','MCA','dheenaprabhu@celerissolutions.in','6379100400',NULL,'/uploads/labors/labor_LAB000001.jpeg','Active',NULL,NULL,'103/1,Vaikkal Street,Kullampalaym,','Gobi','Erode','Tamil Nadu','India',638476,401494574289,'GOMPD9595D',NULL,NULL,'Indian Overseas Bank Ltd., ','Gobi','IOBA0001823','182301000016471','Dheena Prabhu.S',NULL,'Prabakar.D','2025-10-22 10:50:40','Prabakar.D','2026-01-27 16:22:36'),('LAB000002','CS003','Permanent','PerMonth',17500.00,'COM000001','Vidhyarohini','S','Sakthivel','2000-11-13','2025-03-17','Female','Single','Fresher','Web Developer','B.Tech','vidhyarohini13112000@gmail.com','8139054298',NULL,'/uploads/labors/7b4475c8-ce6e-4774-a8b4-9642afa095d5.jpg','Active',NULL,NULL,'55, Nanjappa Street, Sri Valli Theater Road','Gobichettipalayam','Erode','Tamil Nadu','India',638452,960811777352,'QQAPS8833P','/uploads/labors/aadhar_LAB000002.jpeg','/uploads/labors/pan_LAB000002.jpeg','Indian Overseas Bank Ltd., ','Gobichettipalayam','IOBA0001823','182301000016469','Vidhyarohini','8139054298@axl','Prabakar.D','2025-12-02 17:21:45','Prabakar.D','2026-09-18 16:37:09'),('LAB000003','CS002','Permanent','PerMonth',27000.00,'COM000001','Mohan','Raj','Senthilnathan','1997-07-10','2025-04-01','Male','Single','4 Years','Senior Web Developer','B.E Electronics and Communication Engineering','Mohanvijay8344@gmail.com','8344116557','6379770508','/uploads/labor_1764850660685_IMG_3853.JPG','Active',NULL,NULL,'398/12, Aravind Garden, Melappalayam','Chennimalai','Erode','TamilNadu','India',638051,994067542773,'GEJPM6150L',NULL,NULL,'Bank of Baroda','Chennimalai','BARB0CHENNI','45000100007387','Mohanraj S','8344116557@ybl','Prabakar.D','2025-12-04 17:47:40','Prabakar.D','2025-12-04 17:49:06'),('LAB000004','CS005','Permanent','PerMonth',12000.00,'COM000001','Karthikvasanth ','T','Thiruvenkadam KA','2004-12-25','2025-07-04','Male','Single','Fresher','Jr.Developer','BSC Computer science ','karthikceleris@gmail.com','6380268130','6380566119',NULL,'Inactive','Resigned',NULL,'Kasipalayam Gobi to Sathyamangalam mainroad','Erode','Erode','Tamilnadu','India',638454,NULL,NULL,NULL,NULL,'Indian overseas Bank ','Gobichettipalayam ','IOBA0001823','182301000016470','Karthikvasanth T',NULL,'Prabakar.D','2025-12-04 18:13:21','Prabakar.D','2026-05-12 10:30:52'),('LAB000005','CS004','Permanent','PerMonth',12000.00,'COM000001','Nithish ','kumar','Senthil kumar','2002-11-25','2025-07-04','Male','Single',NULL,'Jr.Developer','B.E & ECE','nithishkumars04285@gmail.com','9688804285',NULL,NULL,'Active',NULL,NULL,'36-A Chinnanan Street-2,Vaikkal Road, T.N.Palayam.','Gobi','Erode','Tamil Nadu','India',638506,270893832624,'COMPN5174E',NULL,NULL,'IOB','Gobi','IOBA0001823','182301000016472','Nithish Kumar',NULL,'Prabakar.D','2025-12-04 18:16:17','Prabakar.D','2025-12-04 18:16:17'),('LAB000006','CS007','Permanent','PerMonth',15000.00,'COM000001','Muralitharan','J','N.U.Jaganathan','2003-08-27','2025-12-03','Male','Single',NULL,'Android Developer','MCA','itmuralitharanj@gmail.com','8903095510',NULL,NULL,'Active',NULL,NULL,'11/94,Namakkal Palayam,Ayalur(po)','Gobi','Erode','Tamil Nadu','India',638453,439542227150,'JTAPM1698Q',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2025-12-04 18:16:46','Prabakar.D','2025-12-04 18:18:26'),('LAB000007','CS006','Permanent','PerMonth',12000.00,'COM000001','Calvin','Felix ','Regis Arockia Dass F','2003-02-11','2025-07-30','Male','Single','3 Months','Business Development Executive ','B.Tech (IT)','calvinfelixoff@gmail.com','9952792397',NULL,NULL,'Active',NULL,NULL,'55/11, Sathyamangalam To K.N Palayam Road, Periya Kodiveri','Gobichettipalayam','Erode','Tamil Nadu','India',638503,379331592008,'GBPPR6721B',NULL,NULL,'IOB','D.G Pudur','IOBA0000683','068301000056023','Calvin Felix R',NULL,'Prabakar.D','2025-12-04 18:17:00','Prabakar.D','2025-12-04 18:17:00'),('LAB000009','CSPL010','Permanent','PerMonth',12000.00,'COM000001','Namitha','M',NULL,'2004-12-07','2026-03-06','Female',NULL,NULL,'Jr.Developer','B.Sc(CS)','namithamani7124@gmail.com','9499037378',NULL,NULL,'Active',NULL,NULL,'2,pillaiyar kovil street,K.N.Palayam.','Sathyamangalam','Erode','Tamil Nadu','India',638503,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-03-09 17:50:46','Prabakar.D','2026-03-09 17:50:46'),('LAB000010','CS-IN1','Permanent','PerMonth',7500.00,'COM000001','Gayathri','P','Palani','2005-03-23','2026-04-08','Female','Single',NULL,'Jr.Developer','BCA','gayathribca233@gmail.com','8778931756',NULL,NULL,'Active',NULL,NULL,'6/212, Kattuvalavu, Ottarkarattupalayam','Gobi','Erode','Tamil Nadu','India',638457,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-04-15 10:06:25','Prabakar.D','2026-08-04 22:40:59'),('LAB000011','CS-IN2','Permanent','PerMonth',7500.00,'COM000001','Thilagawathy','S','Senthil','2004-12-11','2026-04-08','Female','Single',NULL,'Internship','BCA','thilagawathysst@gmail.com','8056524860',NULL,NULL,'Inactive',NULL,NULL,'292, Kenkuzhi Street, E.Chettipalayam','Nambiyur','Erode','Tamil Nadu','India',638458,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-04-15 10:10:43','Prabakar.D','2026-08-25 09:39:51'),('LAB000012','CS-IN3','Permanent','PerMonth',7500.00,'COM000001','Venmathi','S','Shanmugam','2004-12-26','2026-04-08','Female','Single',NULL,'Jr.Developer',NULL,'venmathi2612@gmail.com','6382481165',NULL,NULL,'Active',NULL,NULL,'82/77, Kannakattupalayam, Chettipalayam ','Nambiyur','Erode','Tamil Nadu','India',638458,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-04-15 10:14:19','Prabakar.D','2026-08-04 22:40:32'),('LAB000013','CS-IN4','Permanent','PerMonth',7500.00,'COM000001','Subitcha','R','Raju','2004-09-03','2026-04-08','Female','Single',NULL,'Jr.Developer',NULL,'subirbca03@gmail.com','7402636099',NULL,NULL,'Active',NULL,NULL,'5, Chinnasamy Strret, Nanjagoundanpalayam, Pariyur','Gobi','Erode ','Tamil Nadu','India',638452,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-04-15 10:16:33','Prabakar.D','2026-08-04 22:41:30'),('LAB000014','CSPL-014','Permanent','PerMonth',20000.00,'COM000001','Boopathiraj','R','Ramasamy',NULL,'2026-05-08','Male','Married',NULL,'Business Development Executive','MSc','raj.boopathi@gmail.com','9894655565',NULL,NULL,'Inactive',NULL,NULL,'5A, Muthu Nagar, Modachur','Gobi','Erode','Tamilnadu','India',638476,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-05-09 15:00:28','Prabakar.D','2026-08-25 09:40:04'),('LAB000015',NULL,'Permanent','PerMonth',100000.00,'COM000001','Gowri','Prabakar','Rajendran','1981-05-10',NULL,'Female','Married',NULL,'Administrative Officer',NULL,'gowriprabakar2@gmail.com','+919597979111',NULL,NULL,'Active',NULL,NULL,'19A, Satha sivam Street','Gobichettipalayam',NULL,'Tamil Nadu','India',638452,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-05-23 16:32:03','Prabakar.D','2026-05-23 16:32:03'),('LAB000016','CSPL-015','Permanent','PerMonth',15000.00,'COM000001','Ram Sundhar','D','Dhanasekaran','1999-04-10','2026-06-05','Male','Single',NULL,'Business Development Associate',NULL,'ramsundhardrs@gmali.com','9751993615',NULL,NULL,'Inactive',NULL,NULL,'32A,Seethalakshmi puram,6th Street, Modachur','Gobi','Erode','Tamilnadu','India',638476,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-06-06 10:10:22','Prabakar.D','2026-08-25 09:40:22'),('LAB000017','CSPL016','Permanent','PerMonth',15000.00,'COM000001','Dakshin','B','Balasubramaniam','2004-08-04','2026-06-08','Male','Single',NULL,'BDE','BE','dakshinceleris@gmail.com','9344471879',NULL,NULL,'Active',NULL,NULL,'Ikkarai Negamam pudur','Sathy','Erode','Tamilnadu','India',638402,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-06-09 14:46:16','Prabakar.D','2026-06-09 14:46:16'),('LAB000018','CSPL016','Permanent','PerMonth',15000.00,'COM000001','Sridevi ','R','Ramesh','2004-11-05','2026-07-01','Female','Single','0','INTERN','BE.CSE(AIML)','rsridevi583@gmail.com','6379592817',NULL,NULL,'Active',NULL,NULL,'87/151 ,A5 ,  Dr.Subrayan nagar ','Mettur Dam ','Salem',NULL,'India',636401,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-07-01 18:38:07','Prabakar.D','2026-07-01 18:42:53'),('LAB000019','CSPL017','Permanent','PerMonth',24000.00,'COM000001','Varunchand','Sinnaiyan',NULL,'1983-02-21','2026-07-02','Male','Married','20 Years','Business Development Executive - Marketing',NULL,NULL,'9488066991','9894941732',NULL,'Inactive',NULL,NULL,'17/3, Kamarajar Street, TN Palayam','Gobichettipalayam','Erode','Tamil Nadu','India',638506,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-07-02 13:39:32','Prabakar.D','2026-08-25 09:40:39'),('LAB000020','CSPL018','Permanent','PerMonth',7500.00,'COM000001','Yuvadharshini ','M','Manickam K','2006-06-12','2026-07-06','Female','Single','0','Office Admin','BSC.COMPUTER SCIENCE WITH CYBER SECURITY','yuvadharshini1122@gmail.com','9043105134','9384513956',NULL,'Inactive',NULL,NULL,'69,V.V.C.R Nagar','Erode','Erode','Tamil Nadu','India',638001,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-07-07 18:01:55','Prabakar.D','2026-08-25 09:40:56'),('LAB000021',NULL,'Permanent','PerMonth',7500.00,'COM000001','Akash',NULL,NULL,'2005-12-13','2026-07-08','Male','Single',NULL,'accounts','B.COM','aka70159@gmail.com','6382314427',NULL,NULL,'Inactive',NULL,NULL,'51, pattaiyakalipalayam','gobi ','Erode','Tamil Nadu','India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-07-08 18:29:30','Prabakar.D','2026-08-25 09:41:10'),('LAB000022','CSPL019','Permanent','PerMonth',10000.00,'COM000001','Nishanthi ','M','Muthusamy C. R ','2005-01-07',NULL,'Female','Single',NULL,'junior developer',NULL,'nishanthimuthusamy2005@gmail.com','8695952462',NULL,NULL,'Active',NULL,NULL,'38B, Sadaiyappagoundar Street, Chinnagoundan Palayam','Gobichettipalayam','Erode','Tamil Nadu','India',638453,426190957668,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-08-07 18:24:47','Prabakar.D','2026-08-22 18:33:12'),('LAB000023',NULL,'Permanent','PerMonth',12000.00,'COM000001','Sathish',NULL,NULL,'2005-01-13',NULL,'Male','Single',NULL,NULL,NULL,NULL,'9894696837',NULL,NULL,'Active',NULL,NULL,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Prabakar.D','2026-08-22 12:19:09','Prabakar.D','2026-08-22 12:19:09'),('LAB000024','CSPL020','Permanent','PerMonth',12000.00,'COM000001','Priyadharshni ','S','Senthil Kumar A','2004-09-08','2026-08-22','Female','Single',NULL,NULL,NULL,'priyadharshni.senthilkumar24@gmail.com','9629830949',NULL,NULL,'Active',NULL,NULL,'105/76, Sathy KN Palayam road, DG Pudur(via),','Periyakodivery','Erode','Tamil Nadu','India',638503,442866416093,NULL,NULL,NULL,'Indian Overseas Bank','Dasappa goundenpudur','IOBA0000683','068301000025684','Priyadharshni S','itspriyadharshni8924@oksbi','Prabakar.D','2026-08-22 18:41:54','Prabakar.D','2026-08-22 18:46:07');
/*!40000 ALTER TABLE `ccms_labor` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 16:07:48
