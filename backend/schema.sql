CREATE DATABASE IF NOT EXISTS blood_donation_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE blood_donation_db;

CREATE TABLE IF NOT EXISTS `user` (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    id_number VARCHAR(20),
    gender VARCHAR(20),
    birthday DATE,
    blood_type VARCHAR(5) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100) NOT NULL UNIQUE,
    last_date DATE,
    last_category VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL
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
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_log_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    question_no VARCHAR(20) NOT NULL,
    question_text VARCHAR(255) NOT NULL,
    question_category VARCHAR(50) NOT NULL,
    answer_key VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS survey_answer (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    log_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_value BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_survey_answer_log_question
        UNIQUE (log_id, question_id),
    CONSTRAINT fk_survey_answer_history_log
        FOREIGN KEY (log_id)
        REFERENCES history_log (log_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_survey_answer_question
        FOREIGN KEY (question_id)
        REFERENCES question (question_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
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
    donor_weight DECIMAL(5, 2),
    created_by INT NULL,
    CONSTRAINT fk_donation_record_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_donation_record_admin
        FOREIGN KEY (created_by)
        REFERENCES admin (admin_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transportation (
    trans_id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    trans_type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_transportation_site
        FOREIGN KEY (site_id)
        REFERENCES donation_site (site_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS point_transaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INT,
    points_delta INT NOT NULL,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_point_source UNIQUE (source_type, source_id),
    CONSTRAINT fk_point_transaction_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_gift (
    site_gift_id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    gift_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_site_gift (site_id, gift_id),
    CONSTRAINT fk_site_gift_site FOREIGN KEY (site_id) REFERENCES donation_site(site_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_site_gift_gift FOREIGN KEY (gift_id) REFERENCES gift(gift_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS redemption_record (
    redemption_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    gift_id INT NOT NULL,
    site_id INT,
    points_spent INT NOT NULL,
    redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemption_user
        FOREIGN KEY (donor_id)
        REFERENCES `user` (donor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_redemption_gift
        FOREIGN KEY (gift_id)
        REFERENCES gift (gift_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_redemption_site
        FOREIGN KEY (site_id)
        REFERENCES donation_site (site_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

ALTER TABLE `user` ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS id_number VARCHAR(20);
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS last_category VARCHAR(50);
ALTER TABLE `user` DROP COLUMN IF EXISTS is_admin;
ALTER TABLE `user` DROP COLUMN IF EXISTS spent_points;
ALTER TABLE history_log DROP COLUMN IF EXISTS weight;
ALTER TABLE history_log DROP COLUMN IF EXISTS location;
ALTER TABLE history_log DROP COLUMN IF EXISTS drugs_record;
ALTER TABLE history_log DROP COLUMN IF EXISTS has_cold_or_infection;
ALTER TABLE history_log DROP COLUMN IF EXISTS had_dental_treatment;
ALTER TABLE history_log DROP COLUMN IF EXISTS had_surgery_or_transfusion;
ALTER TABLE history_log DROP COLUMN IF EXISTS taking_medication;
ALTER TABLE history_log DROP COLUMN IF EXISTS had_vaccine_or_injection;
ALTER TABLE history_log DROP COLUMN IF EXISTS pregnancy_or_postpartum;
ALTER TABLE history_log DROP COLUMN IF EXISTS unexplained_weight_loss;
ALTER TABLE history_log DROP COLUMN IF EXISTS had_tattoo_piercing;
ALTER TABLE history_log DROP COLUMN IF EXISTS traveled_epidemic_area;
ALTER TABLE history_log DROP COLUMN IF EXISTS contact_infectious_disease;
ALTER TABLE history_log DROP COLUMN IF EXISTS high_risk_behavior;
ALTER TABLE history_log DROP COLUMN IF EXISTS understood_process_and_risk;
ALTER TABLE history_log DROP COLUMN IF EXISTS consent_blood_donation;
ALTER TABLE history_log DROP COLUMN IF EXISTS consent_medical_reuse;
ALTER TABLE history_log DROP COLUMN IF EXISTS hold_points;
UPDATE `user`
SET nickname = name
WHERE nickname IS NULL OR nickname = '';

ALTER TABLE donation_record ADD COLUMN IF NOT EXISTS donor_weight DECIMAL(5, 2);

CREATE TABLE IF NOT EXISTS question (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    question_no VARCHAR(20) NOT NULL,
    question_text VARCHAR(255) NOT NULL,
    question_category VARCHAR(50) NOT NULL,
    answer_key VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS survey_answer (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    log_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_value BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_survey_answer_log_question
        UNIQUE (log_id, question_id),
    CONSTRAINT fk_survey_answer_history_log
        FOREIGN KEY (log_id)
        REFERENCES history_log (log_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_survey_answer_question
        FOREIGN KEY (question_id)
        REFERENCES question (question_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

INSERT INTO question (question_id, question_no, question_text, question_category, answer_key)
VALUES
    (1, 'Q1', '近期是否有感冒、發燒、腹瀉或急性感染？', '健康狀況', 'has_cold_or_infection'),
    (2, 'Q2', '7 天內是否曾接受拔牙或牙科治療？', '健康狀況', 'had_dental_treatment'),
    (3, 'Q3', '近期是否曾進行外科手術或接受輸血？', '健康狀況', 'had_surgery_or_transfusion'),
    (4, 'Q4', '目前是否正在服藥？', '健康狀況', 'taking_medication'),
    (5, 'Q5', '過去 1 個月內是否曾接種疫苗或接受注射？', '健康狀況', 'had_vaccine_or_injection'),
    (6, 'Q6', '女性是否懷孕中、產後或流產未滿 6 個月？', '健康狀況', 'pregnancy_or_postpartum'),
    (7, 'Q7', '是否近期有不明原因體重驟降？', '健康狀況', 'unexplained_weight_loss'),
    (8, 'Q8', '是否曾在近幾個月內刺青、紋眉或穿耳洞？', '健康狀況', 'had_tattoo_piercing'),
    (9, 'Q9', '過去一段時間是否曾出國至傳染病疫區（如瘧疾、茲卡病毒等）？', '旅遊史', 'traveled_epidemic_area'),
    (10, 'Q10', '是否曾與傳染病患者密切接觸？', '傳染病風險', 'contact_infectious_disease'),
    (11, 'Q11', '是否曾有危險性行為、吸毒等高風險行為？', '傳染病風險', 'high_risk_behavior'),
    (12, 'Q12', '確認已了解捐血流程、用血安全及相關刑責。', '同意與簽名', 'understood_process_and_risk'),
    (13, 'Q13', '同意無償捐血。', '同意與簽名', 'consent_blood_donation'),
    (14, 'Q14', '若血液不適合輸給病人，是否同意供作國內外醫藥資源再利用？', '同意與簽名', 'consent_medical_reuse')
ON DUPLICATE KEY UPDATE
    question_no = VALUES(question_no),
    question_text = VALUES(question_text),
    question_category = VALUES(question_category),
    answer_key = VALUES(answer_key);

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
    COALESCE(SUM(CASE WHEN pt.points_delta > 0 THEN pt.points_delta ELSE 0 END), 0) AS cumulative_points,
    GREATEST(COALESCE(SUM(pt.points_delta), 0), 0) AS current_points
FROM `user` AS u
LEFT JOIN point_transaction AS pt
    ON pt.donor_id = u.donor_id
GROUP BY u.donor_id, u.nickname, u.name;

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

DELETE FROM transportation;

INSERT INTO transportation (site_id, trans_type, description, sort_order)
VALUES
    (1, '捷運', '台北捷運淡水信義線忠義站，出站後步行或轉乘短程交通前往立德路。', 1),
    (1, '導航', '可使用站點導航連結查詢即時公車、步行或開車路線。', 2),
    (2, '捷運', '台北捷運板南線江子翠站 1 號出口，步行可達雙十路三段。', 1),
    (2, '公車', '可搭乘行經雙十路、文化路一帶公車至江子翠周邊站點後步行。', 2),
    (3, '台鐵/公車', '可搭台鐵至基隆站後，轉乘市區公車或計程車前往信一路。', 1),
    (3, '導航', '建議使用站點導航連結查詢基隆市區即時交通。', 2),
    (4, '捷運', '高雄捷運紅線都會公園站周邊，出站後步行或轉乘短程交通前往高楠公路。', 1),
    (4, '公車', '可搭乘行經高楠公路、楠梓周邊公車後步行。', 2),
    (5, '公車', '可搭桃園客運 1 路至育樂街口，步行經育樂街、四維街至文康街。', 1),
    (5, '台鐵', '可由桃園火車站周邊轉乘公車或步行前往文康街。', 2),
    (6, '捷運', '台北捷運淡水信義線台大醫院站 4 號出口，鄰近二二八和平公園。', 1),
    (6, '公車', '可搭乘行經公園路、襄陽路、台大醫院周邊公車。', 2),
    (7, '捷運', '台北捷運中正紀念堂站 1 號出口，步行約 3 分鐘。', 1),
    (7, '公車', '可搭乘行經南海路、羅斯福路、南門市場周邊公車。', 2),
    (8, '捷運', '台北捷運板南線忠孝敦化站，東區地下街 9 號出口旁。', 1),
    (8, '地下街', '可由東區地下街步行前往，雨天較方便。', 2),
    (9, '捷運', '可搭台北捷運至南京復興站，步行前往長春路。', 1),
    (9, '公車', '可搭乘行經長春路、復興北路、南京東路周邊公車。', 2),
    (10, '公車', '可搭乘行經中興堂、台中公園、一中商圈周邊公車後步行。', 1),
    (10, '台鐵', '可由台中車站轉乘公車或短程交通前往精武路中興堂。', 2),
    (11, '捷運', '台北捷運板南線/松山新店線西門站 6 號出口，步行約 10 分鐘。', 1),
    (11, '公車', '可搭乘行經西門町、昆明街、峨眉街周邊公車。', 2),
    (12, '台鐵/公車', '可由台南火車站或台南轉運站轉乘行經台南公園周邊公車。', 1),
    (12, 'YouBike', '台南公園周邊設有公共自行車站點，可搭配步行前往。', 2),
    (13, '捷運/台鐵', '台北車站 M6 出口，鄰近新光三越站前店與忠孝西路一段 66 號。', 1),
    (13, '公車', '可搭乘行經台北車站、忠孝西路、館前路周邊公車。', 2);

ALTER TABLE transportation AUTO_INCREMENT = 27;
