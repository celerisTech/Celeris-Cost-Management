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
  `CM_Last_Seen` datetime DEFAULT NULL,
  `CM_Current_Project_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`CM_User_ID`),
  KEY `fk_users_company` (`CM_Company_ID`),
  KEY `fk_users_role` (`CM_Role_ID`),
  KEY `fk_user_labor` (`CM_Labor_Type_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ccms_users`
--

LOCK TABLES `ccms_users` WRITE;
/*!40000 ALTER TABLE `ccms_users` DISABLE KEYS */;
INSERT INTO `ccms_users` VALUES ('USR000001','COM000001','ROL000001',NULL,'Prabakar.D',NULL,'Prabakar.D','Devaraj','Married','9940356707','9940356707',NULL,NULL,'$2b$12$RNirBFedTRoAy3kHXSrHZ.ye6NSYbihkGUsWtgHdpCVws51yNyY46','prabakar.d1@gmail.com','25,Sathasivam Street,Gobichettipalayam','Gobichettipalayam','Erode',NULL,'Male',NULL,NULL,'Tamil Nadu','India',638452,'photo1.jpg','Active','Prabakar.D','2025-08-29 13:13:58','SYSTEM','2026-01-08 09:44:33','2026-09-22 16:03:37','PRJ000061'),('USR000002','COM000001','ROL000003','LAB000001','Dheena ','Prabhu.S','Dheena  Prabhu.S','Senthil Kumar.N','Single','6379100400',NULL,'401494574289','GOMPD9595D','$2b$12$r6VrOWK.e0pheSGJEd3MHuFfV/Tz31r7e3QorIJG8iIRyzd/Skkd2','dheenaprabhu@celerissolutions.in','103/1,Vaikkal Street,Kullampalaym,','Gobi','Erode','2002-08-24','Male','MCA','Fresher','Tamil Nadu','India',638476,NULL,'Active','Prabakar.D','2025-10-25 09:49:14','SYSTEM','2026-01-28 12:01:05',NULL,NULL),('USR000003','COM000001','ROL000003','LAB000002','Vidhyarohini','S','Vidhyarohini S','Sakthivel','Single','8139054298','','960811777352','QQAPS8833P','$2b$12$EU9j/Cv91ysxteBnXfZS6O/2jb5bM9Ar4J9cXaC9bPLAHO9hokT5a','vidhyarohini13112000@gmail.com','55, Nanjappa Street, Sri Valli Theater Road','Gobichettipalayam','Erode','2000-11-14','Female','B.Tech','Fresher','Tamil Nadu','India',638452,'','Active','Prabakar.D','2025-12-04 18:25:21',NULL,NULL,'2026-09-22 16:07:37','PRJ000058'),('USR000004','COM000001','ROL000003','LAB000003','Mohan','Raj','Mohan Raj','Senthilnathan','Single','8344116557','6379770508','994067542773','GEJPM6150L','$2b$12$Tmbg8mSJtSaSphShE2evCOEdixdcxamg9eGz0GCFCY3AH10PzsMGO','Mohanvijay8344@gmail.com','398/12, Aravind Garden, Melappalayam','Chennimalai','Erode','1997-07-11','Male','B.E Electronics and Communication Engineering','4 Years','TamilNadu','India',638051,'/uploads/profiles/user_USR000004_1765340798313.JPG','Active','Prabakar.D','2025-12-04 18:25:39','SYSTEM','2025-12-10 09:56:46',NULL,NULL),('USR000005','COM000001','ROL000003','LAB000004','Karthikvasanth ','T','Karthikvasanth  T','Thiruvenkadam KA','Single','6380268130','6380566119','','','$2b$12$GP9ZZOBI9D40kqXI2gAIAOVMHYwG0czwfRACD/Fk1NKbL4r4a3JS2','karthikceleris@gmail.com','Kasipalayam Gobi to Sathyamangalam mainroad','Erode','Erode','2004-12-26','Male','BSC Computer science ','Fresher','Tamilnadu','India',638454,'','Inactive','Prabakar.D','2025-12-04 18:25:52','SYSTEM','2026-07-02 17:28:15',NULL,NULL),('USR000006','COM000001','ROL000003','LAB000005','Nithish ','kumar','Nithish  kumar','Senthil kumar','Single','9688804285','','270893832624','COMPN5174E','$2b$12$Dc0eExiTJl9UXa/5EHVqU.ko0IQkTrwPSukdxa7v4V1IvPPv61SuO','nithishkumars04285@gmail.com','36-A Chinnanan Street-2,Vaikkal Road, T.N.Palayam.','Gobi','Erode','2002-11-26','Male','B.E & ECE','','Tamil Nadu','India',638506,'','Active','Prabakar.D','2025-12-04 18:26:03',NULL,NULL,NULL,NULL),('USR000007','COM000001','ROL000003','LAB000007','Calvin','Felix ','Calvin Felix','Regis Arockia Dass F','Single','9952792397','','379331592008','GBPPR6721B','$2b$12$KnPvsPOh19322Hp5q21ynOqUAvP35uBVv/SfZMoP9WcmtyUYvSGbe','calvinfelixoff@gmail.com','55/11, Sathyamangalam To K.N Palayam Road, Periya Kodiveri','Gobichettipalayam','Erode','2003-02-12','Male','B.Tech (IT)','3 Months','Tamil Nadu','India',638503,'','Active','Prabakar.D','2025-12-04 18:26:14',NULL,NULL,NULL,NULL),('USR000008','COM000001','ROL000003','LAB000006','Muralitharan','J','Muralitharan J','N.U.Jaganathan','Single','8903095510','','439542227150','JTAPM1698Q','$2b$12$dR.S4MLqSTfvg3Q2nHT3GO1Wu9ElXqk/LZrN3OXfrH9r2ZRoYguQ6','itmuralitharanj@gmail.com','11/94,Namakkal Palayam,Ayalur(po)','Gobi','Erode','2003-08-28','Male','MCA','','Tamil Nadu','India',638453,'/uploads/profiles/user_USR000008_1765340956429.jpg','Active','Prabakar.D','2025-12-08 18:07:14','SYSTEM','2025-12-10 09:59:19',NULL,NULL),('USR000009','COM000001','ROL000001',NULL,'Gowri','Prabakar','Gowri Prabakar','','Married','9597979111','','','','$2b$12$kDQDytES9cTa9vMShcl/XOE2wk1oWpkUrHPbFhI7mAQivc5lxFrIe','gowriprabakar@gmail.com','','','',NULL,'Female','','','','',NULL,'','Active','Prabakar.D','2026-03-06 14:47:09',NULL,NULL,NULL,NULL),('USR000010','COM000001','ROL000003','LAB000009','Namitha','M','Namitha M','','','9499037378','','','','$2b$12$z5VZ3A6ZLnboyv6JEBm8xeW9TfbQA4oBvbUJ876dFeChOnQI5RQhC','namithamani7124@gmail.com','2,pillaiyar kovil street,K.N.Palayam.','Sathyamangalam','Erode','2004-12-08','Female','B.Sc(CS)','','Tamil Nadu','India',638503,'','Active','Prabakar.D','2026-03-09 17:53:31',NULL,NULL,NULL,NULL),('USR000011','COM000001','ROL000003','LAB000010','Gayathri','P','Gayathri P','Palani','Single','8778931756','','','','$2b$12$4iw/ToOERetgyg6BXRNfZuE9qO.0jYjOsMGji73QdjTZJWidSUWAC','gayathribca233@gmail.com','6/212, Kattuvalavu, Ottarkarattupalayam','Gobi','Erode','2005-03-24','Female','BCA','','Tamil Nadu','India',638457,'','Active','Prabakar.D','2026-04-16 11:26:08',NULL,NULL,NULL,NULL),('USR000012','COM000001','ROL000003','LAB000011','Thilagawathy','S','Thilagawathy S','Senthil','Single','8056524860','','','','$2b$12$H.iFThqEp6LzaNcvEcTd1eLqJ6IWhG/d2eUsSnzT6AV3rzA/h22t6','thilagawathysst@gmail.com','292, Kenkuzhi Street, E.Chettipalayam','Nambiyur','Erode','2004-12-12','Female','BCA','','Tamil Nadu','India',638458,'','Inactive','Prabakar.D','2026-04-16 11:26:22','SYSTEM','2026-07-02 17:28:48',NULL,NULL),('USR000013','COM000001','ROL000003','LAB000012','Venmathi','S','Venmathi S','Shanmugam','Single','6382481165',NULL,'','','$2b$12$PIO1xEN1iY2ia/SfiyI9y./alXjzd1Iw8H.CBpbzdOivS6Z0F5aR6','venmathi2612@gmail.com','82/77, Kannakattupalayam, Chettipalayam ','Nambiyur','Erode','2004-12-27','Female','','','Tamil Nadu','India',638458,NULL,'Active','Prabakar.D','2026-04-16 11:26:34','SYSTEM','2026-04-21 16:59:53',NULL,NULL),('USR000014','COM000001','ROL000003','LAB000013','Subitcha','R','Subitcha R','Raju','Single','7402636099','','','','$2b$12$YpkE6ZkNhwfMMtg9E4QNMeOFrCPSUHT8203hg3ltfuPfCEQmpy9.G','subirbca03@gmail.com','5, Chinnasamy Strret, Nanjagoundanpalayam, Pariyur','Gobi','Erode ','2004-09-03','Female','','','Tamil Nadu','India',638452,'','Active','Prabakar.D','2026-04-16 11:26:46','SYSTEM','2026-06-15 10:51:05',NULL,NULL),('USR000015','COM000001','ROL000003','LAB000014','Boopathiraj','R','Boopathiraj R','Ramasamy','Married','9894655565','','','','$2b$12$Ey5nqxK2RbAqvZCVr6xzHO029Ud9rkU2Ld6MIk31BrGttMX42uKd2','raj.boopathi@gmail.com','5A, Muthu Nagar, Modachur','Gobi','Erode',NULL,'Male','MSc','','Tamilnadu','India',638476,'','Inactive','Prabakar.D','2026-05-09 15:00:57','SYSTEM','2026-08-25 09:38:20',NULL,NULL),('USR000016','COM000001','ROL000003',NULL,'Poorani','S','Poorani S','','','8300229734','','','','$2b$12$I1i6EQzuMkos.1nv7E2pG.Ghes7b/gM8IuLCRNRDrFnclJP.mWzB6','poorani@gmail.com','','','',NULL,'','','','','',NULL,'','Inactive','Prabakar.D','2026-05-13 18:27:57','SYSTEM','2026-07-02 17:28:32',NULL,NULL),('USR000017','COM000001','ROL000003','LAB000016','Ram Sundhar','D','Ram Sundhar D','Dhanasekaran','Single','9751993615',NULL,'','','$2b$12$LH6sk1LA8qCsFyK4lWRopOiWUc0exGDNZF6fecp2f/dWu/UymfDsS','ramceleris@gmail.com','32A,Seethalakshmi puram,6th Street, Modachur','Gobi','Erode','1999-04-10','Male','','','Tamilnadu','India',638476,NULL,'Active','Prabakar.D','2026-06-06 10:11:33','SYSTEM','2026-09-02 15:31:09',NULL,NULL),('USR000018','COM000001','ROL000003','LAB000017','Dakshin','B','Dakshin B','Balasubramaniam','Single','9344471879','','','','$2b$12$iPcsFOF.q/b3N7m0M6bNZupk8L3.au9AYjqg7o2cmrwg0sSmRaxdq','dakshinceleris@gmail.com','Ikkarai Negamam pudur','Sathy','Erode','2004-08-05','Male','BE','','Tamilnadu','India',638402,'','Active','Prabakar.D','2026-06-09 14:48:17',NULL,NULL,NULL,NULL),('USR000019','COM000001','ROL000003','LAB000018','Sridevi ','R','Sridevi  R','Ramesh','Single','6379592817','','','','$2b$12$.DlKjXtdnhg4Eb9EJbekFOs5bBPWsDmcAVkaRZXTg2a73gVdqSl5C','rsridevi583@gmail.com','87/151 ,A5 ,  Dr.Subrayan nagar ','Mettur Dam ','Salem','2004-11-06','Female','BE.CSE(AIML)','0','','India',636401,'','Active','','2026-07-01 18:44:02',NULL,NULL,NULL,NULL),('USR000020','COM000001','ROL000003','LAB000019','Varunchand','Sinnaiyan','Varunchand Sinnaiyan','','Married','9488066991','9894941732','','','$2b$12$tgZdU3otMFZ2vRtvMzY6TeB9/sIXc1qiFa5Zxttqho6oAbMt8iLmC','calvi@gmail.com','17/3, Kamarajar Street, TN Palayam','Gobichettipalayam','Erode','1983-02-22','Male','','20 Years','Tamil Nadu','India',638506,'','Inactive','Prabakar.D','2026-07-02 13:42:55','SYSTEM','2026-08-25 09:38:43',NULL,NULL),('USR000021','COM000001','ROL000003','LAB000020','Yuvadharshini ','M','Yuvadharshini  M','Manickam K','Single','9043105134','9384513956','','','$2b$12$xLomuKZBjQFQGkAxLOnYiOIrZdy79JTvu7y71dqdZL9Xqx3Ia6v0y','yuvadharshini1122@gmail.com','69,V.V.C.R Nagar','Erode','Erode','2006-06-12','Female','BSC.COMPUTER SCIENCE WITH CYBER SECURITY','0','Tamil Nadu','India',638001,'','Inactive','Prabakar.D','2026-07-07 18:03:32','SYSTEM','2026-08-25 09:38:55',NULL,NULL),('USR000022','COM000001','ROL000003','LAB000021','Akash','B','Akash B','','Single','6382314427','','','','$2b$12$vIIV2ICitvlW2gCKtzPA.Of8/ykKhxhXMmzkhgSnGdQfHDvupvGs.','aka70159@gmail.com','51, pattaiyakalipalayam','gobi ','Erode','2005-12-14','Male','B.COM','','Tamil Nadu','India',NULL,'','Inactive','Prabakar.D','2026-07-08 18:30:18','SYSTEM','2026-08-25 09:39:19',NULL,NULL),('USR000023','COM000001','ROL000003','LAB000022','Nishanthi ','M','Nishanthi  M','Muthusamy C. R ','Single','8695952462','','426190957668','','$2b$12$BBCevZQHAoGaZT1wABMbneKdAlkBf.MoMdVvUuSiUIPF5Rbhl0MDK','nishanthimuthusamy2005@gmail.com','38B, Sadaiyappagoundar Street, Chinnagoundan Palayam','Gobichettipalayam','Erode','2005-01-08','Female','','','Tamil Nadu','India',638453,'','Active','Prabakar.D','2026-08-07 18:26:24',NULL,NULL,NULL,NULL),('USR000024','COM000001','ROL000003','LAB000023','Sathish','V','Sathish V','','Single','9894696837','','','','$2b$12$PQ0vrNCdfa/MZY9xLZ681uAFM2OgY8b.MRrEmx1W.tqS6tGtMjQhq','sathishceleris@gmail.com','','','','2005-01-14','Male','','','','India',NULL,'','Active','Prabakar.D','2026-08-22 12:21:30',NULL,NULL,NULL,NULL),('USR000025','COM000001','ROL000003','LAB000024','Priyadharshni ','S','Priyadharshni  S','Senthil Kumar A','Single','9629830949','','442866416093','','$2b$12$z8ujJoPfrr4TgZAQMeuwB.sfZac/Q.ZuWoaSJzVtXt8bTpB7QpUe2','priyadharshni.senthilkumar24@gmail.com','105/76, Sathy KN Palayam road, DG Pudur(via),','Periyakodivery','Erode','2004-09-09','Female','','','Tamil Nadu','India',638503,'','Active','Prabakar.D','2026-08-24 18:21:18',NULL,NULL,NULL,NULL);
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

-- Dump completed on 2026-09-22 16:07:56
