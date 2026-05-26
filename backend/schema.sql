CREATE DATABASE IF NOT EXISTS blood_donation_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE blood_donation_db;

CREATE TABLE IF NOT EXISTS `user` (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    birthday DATE,
    blood_type VARCHAR(5) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100) NOT NULL UNIQUE,
    last_date DATE,
    password_hash VARCHAR(255) NOT NULL,
    spent_points INT NOT NULL DEFAULT 0
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
