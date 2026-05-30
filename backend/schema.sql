CREATE DATABASE IF NOT EXISTS blood_donation_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE blood_donation_db;

CREATE TABLE IF NOT EXISTS `user` (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    gender VARCHAR(20),
    birthday DATE,
    blood_type VARCHAR(5) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100) NOT NULL UNIQUE,
    last_date DATE,
    password_hash VARCHAR(255) NOT NULL,
    spent_points INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    weight DECIMAL(5, 2),
    location VARCHAR(100),
    drugs_record TEXT,
    hold_points INT NOT NULL DEFAULT 0,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_log_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donation_site (
    site_id INT PRIMARY KEY AUTO_INCREMENT,
    loca_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    open_time TIME,
    close_time TIME,
    open_days VARCHAR(20),
    hours_note VARCHAR(100),
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS gift (
    gift_id INT PRIMARY KEY AUTO_INCREMENT,
    gift_item VARCHAR(100) NOT NULL,
    needed_points INT NOT NULL
);

CREATE TABLE IF NOT EXISTS donation_record (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    donation_date DATE NOT NULL,
    address VARCHAR(255),
    category VARCHAR(50),
    CONSTRAINT fk_donation_record_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transportation (
    trans_id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    location_id INT,
    trans_type VARCHAR(50) NOT NULL,
    CONSTRAINT fk_transportation_site
        FOREIGN KEY (site_id)
        REFERENCES donation_site (site_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search (
    donor_id INT NOT NULL,
    site_id INT NOT NULL,
    gift_id INT NOT NULL,
    PRIMARY KEY (donor_id, site_id, gift_id),
    CONSTRAINT fk_search_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_search_site
        FOREIGN KEY (site_id)
        REFERENCES donation_site (site_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_search_gift
        FOREIGN KEY (gift_id)
        REFERENCES gift (gift_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Migration: add spent_points to existing databases
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS spent_points INT NOT NULL DEFAULT 0;
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
ALTER TABLE `user` DROP COLUMN IF EXISTS is_admin;
UPDATE `user`
SET nickname = name
WHERE nickname IS NULL OR nickname = '';

INSERT INTO admin (username, display_name, password_hash)
VALUES
    ('admin1@blood.local', '審核管理員一號', 'pbkdf2_sha256$100000$0fd541d90684ea3ecceb16eca5d29e6d$59a0572cdde6e1174b220cf8e7d59d06e67837be49eaac73df288050ac3457fd'),
    ('admin2@blood.local', '審核管理員二號', 'pbkdf2_sha256$100000$e87ef7ce7c2025fb9f15bb5c412fbc84$2fe9f1dfe78c615d39eba58721c2083b2966c2fc488ca239eb9e232e1f4a6ed8'),
    ('reviewer@blood.local', '捐血紀錄審核員', 'pbkdf2_sha256$100000$9014f6b0aba66ab03677a8e9752602b3$cf654f7a07da97df2a83374e08cb98804b5014d823d72f3fe38550f8aade9b6f')
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

CREATE OR REPLACE VIEW donor_points_summary AS
SELECT
    u.donor_id,
    COALESCE(NULLIF(u.nickname, ''), u.name) AS nickname,
    COALESCE(SUM(h.hold_points), 0) AS cumulative_points,
    GREATEST(COALESCE(SUM(h.hold_points), 0) - u.spent_points, 0) AS current_points
FROM `user` AS u
LEFT JOIN history_log AS h
    ON h.donor_id = u.donor_id
GROUP BY u.donor_id, u.nickname, u.name, u.spent_points;

-- Migration: add display text for non-fixed opening hours
ALTER TABLE donation_site ADD COLUMN IF NOT EXISTS hours_note VARCHAR(100);

-- Seed current donation sites and mobile blood drives.
-- This replaces old sample locations so the app shows the current official addresses.
DELETE FROM donation_site;

INSERT INTO donation_site
    (site_id, loca_name, address, latitude, longitude, open_time, close_time, open_days, hours_note, category)
VALUES
    (1, '台北捐血中心', '112臺北市北投區一德里立德路123號', 25.1248000, 121.4693000, '08:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (2, '板橋捐血站', '220新北市板橋區溪頭里雙十路三段27號2樓', 25.0310000, 121.4727000, '08:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (3, '台北捐血中心基隆捐血站', '201基隆市信義區義和里信一路14號', 25.1290000, 121.7500000, '08:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (4, '高雄捐血中心', '811高雄市楠梓區惠豐里高楠公路1837號', 22.7286000, 120.3246000, '08:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (5, '桃園捐血站', '330桃園市桃園區光興里文康街61號', 24.9956000, 121.3050000, '08:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (6, '二二八公園捐血室', '台北市中正區襄陽路2號', 25.0436000, 121.5153000, '10:00:00', '18:00:00', NULL, NULL, '固定捐血點'),
    (7, '南海捐血室', '台北市中正區南海路1號3樓', 25.0327000, 121.5168000, '08:00:00', '17:30:00', NULL, NULL, '固定捐血點'),
    (8, '忠孝號捐血室', '台北市大安區忠孝東路四段地下街B1（忠孝敦化站）', 25.0416000, 121.5500000, '11:00:00', '19:00:00', NULL, NULL, '固定捐血點'),
    (9, '長春捐血室', '台北市中山區長春路328號', 25.0544000, 121.5439000, '09:00:00', '17:00:00', NULL, NULL, '固定捐血點'),
    (10, '台中公園捐血車', '台中市北區精武路291-3號對面（中興堂對面停車場）', 24.1458000, 120.6868000, '10:00:00', '18:00:00', NULL, NULL, '捐血車'),
    (11, '峨嵋號捐血車', '台北市萬華區峨眉街', 25.0439000, 121.5045000, '13:00:00', '21:00:00', NULL, NULL, '捐血車'),
    (12, '台南公園捐血車', '台南市北區公園南路89號', 23.0010000, 120.2095000, NULL, NULL, NULL, '依每日活動公告為主', '捐血車'),
    (13, '新光站前號捐血車', '台北市中正區忠孝西路一段66號前', 25.0462000, 121.5150000, '11:00:00', '19:00:00', NULL, NULL, '捐血車');

ALTER TABLE donation_site AUTO_INCREMENT = 14;
