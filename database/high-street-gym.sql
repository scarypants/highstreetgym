-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: high-street-gym
-- ------------------------------------------------------
-- Server version	8.0.39

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
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `duration` varchar(45) NOT NULL,
  `description` varchar(255) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'YOGA','45min','Enhance flexibility and inner peace through a mindful blend of movement and breath.',0),(3,'PILATES','50min','Strengthen your core and improve posture with controlled, low-impact exercises.',0),(6,'ABS','30min','Sculpt and tone your abdominal muscles with targeted core strengthening routines.',0),(7,'HIIT','30min','Boost your metabolism and burn calories fast with dynamic, high-intensity intervals.',0),(8,'INDOOR CYCLING','45min','Experience a heart-pumping cardio workout on state-of-the-art stationary bikes.',0),(9,'BOXING','60min','Learn essential boxing techniques while enhancing agility, strength, and endurance.',0),(10,'ZUMBA','50min','Dance your way to fitness with fun, energetic routines set to infectious Latin rhythms.',0),(16,'STEP','30min','Step exercise is a form of aerobic workout where you continuously step up onto and down from a raised platform. It improves cardiovascular fitness, tones the lower body, and boosts coordination and balance.',1);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `session_id` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `session_id_idx` (`session_id`),
  KEY `users_member_id_idx` (`member_id`),
  CONSTRAINT `session_id` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`),
  CONSTRAINT `users_member_id` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (50,38,31,0),(51,38,29,0),(52,38,39,1),(53,38,39,1),(54,38,39,1);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `address` varchar(60) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `address_UNIQUE` (`address`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Ashgrove','240 Waterworks Rd, Ashgrove QLD 4060',0),(2,'Brisbane City','300 Queen St, Brisbane City QLD 4000',0),(7,'Chermside','10 Banfield St, Chermside QLD 4032',0),(8,'Graceville','296 Oxley Rd, Graceville QLD 4075',0),(9,'Westlake','Tennent St, Westlake QLD 4074',0);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `writer_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id_idx` (`writer_id`),
  CONSTRAINT `user_id` FOREIGN KEY (`writer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (41,'Morning Yoga Flow','Join me for a gentle yoga session tomorrow at 7 AM in Studio B. Perfect way to start your day relaxed and strong!',8),(42,'Hi guys!','Great morning workout! Feeling energized and ready for the day. ??',9),(58,'Yoga Class','Yoga class was awesome! The playlist kept me pedaling hard. Can’t wait for next week’s ride.',38);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `location_id` int NOT NULL,
  `trainer_id` int NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `activity_id_idx` (`activity_id`),
  KEY `location_id_idx` (`location_id`),
  KEY `user_trainer_id_idx` (`trainer_id`),
  CONSTRAINT `activity_id` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  CONSTRAINT `location_id` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `users_trainer_id` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES (17,1,'2025-03-15','08:00:00',1,9,0),(18,1,'2025-03-14','09:00:00',1,9,0),(19,1,'2025-03-15','08:00:00',1,9,0),(20,3,'2025-03-15','08:00:00',2,9,1),(21,1,'2025-03-13','08:00:00',1,9,1),(29,1,'2025-05-23','08:00:00',1,9,0),(30,1,'2025-05-22','08:00:00',1,9,0),(31,1,'2025-05-19','08:00:00',1,9,0),(32,1,'2025-05-19','09:00:00',1,9,0),(39,1,'2025-05-26','08:00:00',1,9,0),(40,1,'2025-05-26','09:00:00',1,9,0),(41,1,'2025-05-27','08:00:00',1,9,0),(42,1,'2025-05-28','08:00:00',1,9,0),(43,1,'2026-03-16','15:00:00',1,9,0),(44,1,'2026-03-17','10:00:00',1,9,0),(45,1,'2026-05-07','08:00:00',1,9,0),(46,1,'2026-05-07','09:00:00',7,9,0);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('member','trainer','admin') NOT NULL,
  `first_name` varchar(60) NOT NULL,
  `last_name` varchar(60) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `deleted` tinyint NOT NULL DEFAULT '0',
  `authentication_key` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','hwayoung','yoon','hwayoung.y@highstreetgym.tld','$2a$10$Rd2RiyQ3z/jRxgnWJII6SeKFpUqDlR1BNReAxCcxzwjb0DFO8kGHe',0,NULL),(8,'admin','admin','admin','admin@highstreetgym.tld','$2a$10$.uupFMEeM3rp5jHCElmm0.OqI5rWJPh1yMOqbm1VtQjBt4SYRYkwG',0,NULL),(9,'trainer','trainer','trainer','trainer@highstreetgym.tld','$2a$10$FBfjDfgFKBiNfnctA3cYbe994jlTHlEFMqLkdus5oR/Ylljz69LRe',0,'bfea625b-bfe3-4ddf-87f8-91817137a3db'),(38,'member','member','member','member@highstreetgym.tld','$2a$10$oxNv8yiEhwADcjcRI9o6vOZJDqyNDm08IPHb2pGCrLXQOb4fqSFk6',0,NULL),(41,'member','minjoon','ko','kominjoon@gmail.com','$2a$10$/4YcBeE6DiYSs3ni7XQn1u9pG3PyyORsW6wB8rumwBwfI.IiExRwq',0,NULL),(42,'member','jaehyun','kim','kimkjh0369@naver.com','$2a$10$dxkJ50Dlf1wG2AAqkRgQIe12Su5QBYiirwlD4BrMZBFzmY6bzgOTe',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 15:23:24
