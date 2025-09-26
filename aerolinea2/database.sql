-- database.sql (v6)
DROP DATABASE IF EXISTS aerolinea_db;
CREATE DATABASE aerolinea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerolinea_db;

CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_number VARCHAR(20) NOT NULL UNIQUE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  terminal VARCHAR(50) NOT NULL,
  gate VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  seat_code VARCHAR(10) NOT NULL,
  class ENUM('first','economy') NOT NULL,
  status ENUM('free','hold','purchased') NOT NULL DEFAULT 'free',
  hold_token VARCHAR(64) NULL,
  hold_expires_at DATETIME NULL,
  UNIQUE KEY uq_flight_seat (flight_id, seat_code),
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE purchases (
  reservation_code VARCHAR(20) NULL,
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  user_id INT NULL,
  token VARCHAR(64) NOT NULL,
  payment_method ENUM('efectivo','tarjeta') NOT NULL,
  total_amount INT NOT NULL,
  extras_amount INT NOT NULL DEFAULT 0,
  created_at_utc DATETIME NOT NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  seat_code VARCHAR(10) NOT NULL,
  category ENUM('adulto','nino','tercera','primera') NOT NULL,
  price INT NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE purchase_extras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  code VARCHAR(32) NOT NULL,
  label VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  unit_price INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO flights (flight_number,origin,destination,date,time,terminal,gate,type) VALUES
('MXQ-0810','Ciudad de México (MEX)','Doha (Qatar)','2025-10-08','20:00','Terminal 2','Puerta 2','Sencillo'),
('MXP-1105','Ciudad de México (MEX)','París (CDG)','2025-11-05','21:30','Terminal 1','Puerta 15','Sencillo'),
('GX-0922','Guadalajara (GDL)','Los Ángeles (LAX)','2025-09-22','13:45','Terminal 1','Puerta 4','Sencillo'),
('QZ-1201','Querétaro (QRO)','Cancún (CUN)','2025-12-01','08:10','Terminal 1','Puerta 7','Sencillo'),
('PM-1002','Puebla (PBC)','Tijuana (TIJ)','2025-10-02','06:50','Terminal 1','Puerta 3','Sencillo');

DELIMITER //
CREATE PROCEDURE add_seats(fid INT)
BEGIN
  DECLARE i INT;
  SET i=1;
  WHILE i<=10 DO
    INSERT INTO seats(flight_id, seat_code, class) VALUES (fid, CONCAT('F', LPAD(i,2,'0')), 'first');
    SET i=i+1;
  END WHILE;
  SET i=1;
  WHILE i<=20 DO
    INSERT INTO seats(flight_id, seat_code, class) VALUES (fid, CONCAT('E', LPAD(i,2,'0')), 'economy');
    SET i=i+1;
  END WHILE;
END//
DELIMITER ;

CALL add_seats((SELECT id FROM flights WHERE flight_number='MXQ-0810'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MXP-1105'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='GX-0922'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='QZ-1201'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='PM-1002'));
