-- CLUBSYNC Database Schema
-- Football Data Management System for Bangladesh

-- Drop existing database if exists (for clean setup)
DROP DATABASE IF EXISTS clubsync;
CREATE DATABASE clubsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clubsync;

-- ============================================
-- CORE ENTITIES
-- ============================================

-- CLUB Table: Football clubs
CREATE TABLE CLUB (
    club_id INT PRIMARY KEY AUTO_INCREMENT,
    club_name VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(100),
    founded_year INT,
    stadium_name VARCHAR(100),
    stadium_capacity INT,
    club_logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_club_name (club_name),
    INDEX idx_city (city)
) ENGINE=InnoDB;

-- PLAYER Table: Player profiles with JSON attributes
CREATE TABLE PLAYER (
    player_id INT PRIMARY KEY AUTO_INCREMENT,
    player_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    position ENUM('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST') NOT NULL,
    height_cm INT,
    weight_kg INT,
    preferred_foot ENUM('Left', 'Right', 'Both'),
    jersey_number INT,
    current_club_id INT,
    player_photo_url VARCHAR(255),
    attributes JSON COMMENT 'JSON object with pace, shooting, passing, dribbling, defending, physical',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_club_id) REFERENCES CLUB(club_id) ON DELETE SET NULL,
    INDEX idx_player_name (player_name),
    INDEX idx_position (position),
    INDEX idx_current_club (current_club_id),
    INDEX idx_nationality (nationality)
) ENGINE=InnoDB;

-- MANAGER Table: Manager/Coach profiles
CREATE TABLE MANAGER (
    manager_id INT PRIMARY KEY AUTO_INCREMENT,
    manager_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    specialization ENUM('Defensive', 'Offensive', 'Balanced', 'Youth Development') DEFAULT 'Balanced',
    licenses VARCHAR(100) COMMENT 'Coaching licenses (e.g., UEFA Pro, AFC A)',
    current_club_id INT,
    manager_photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_club_id) REFERENCES CLUB(club_id) ON DELETE SET NULL,
    INDEX idx_manager_name (manager_name),
    INDEX idx_current_club (current_club_id)
) ENGINE=InnoDB;

-- CONTRACTS Table: Unified contract management for players and managers
CREATE TABLE CONTRACTS (
    contract_id INT PRIMARY KEY AUTO_INCREMENT,
    contract_type ENUM('PLAYER', 'MANAGER') NOT NULL,
    player_id INT,
    manager_id INT,
    club_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    salary_amount DECIMAL(12, 2) NOT NULL,
    salary_currency VARCHAR(10) DEFAULT 'BDT',
    is_active BOOLEAN DEFAULT TRUE,
    contract_terms TEXT COMMENT 'Additional contract details',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES PLAYER(player_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES MANAGER(manager_id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
    CHECK (
        (contract_type = 'PLAYER' AND player_id IS NOT NULL AND manager_id IS NULL) OR
        (contract_type = 'MANAGER' AND manager_id IS NOT NULL AND player_id IS NULL)
    ),
    INDEX idx_contract_type (contract_type),
    INDEX idx_player (player_id),
    INDEX idx_manager (manager_id),
    INDEX idx_club (club_id),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- ============================================
-- MATCH MANAGEMENT
-- ============================================

-- SEASON Table: Season tracking
CREATE TABLE SEASON (
    season_id INT PRIMARY KEY AUTO_INCREMENT,
    season_name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_season_name (season_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- MATCH_TABLE: Match records
CREATE TABLE MATCH_TABLE (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    season_id INT NOT NULL,
    home_club_id INT NOT NULL,
    away_club_id INT NOT NULL,
    match_date DATETIME NOT NULL,
    venue VARCHAR(100),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    match_status ENUM('SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED', 'CANCELLED') DEFAULT 'SCHEDULED',
    attendance INT,
    referee_name VARCHAR(100),
    match_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES SEASON(season_id) ON DELETE CASCADE,
    FOREIGN KEY (home_club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
    FOREIGN KEY (away_club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
    CHECK (home_club_id != away_club_id),
    INDEX idx_season (season_id),
    INDEX idx_match_date (match_date),
    INDEX idx_home_club (home_club_id),
    INDEX idx_away_club (away_club_id),
    INDEX idx_status (match_status)
) ENGINE=InnoDB;

-- EVENTS Table: Match events with auto-description
CREATE TABLE EVENTS (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    event_type ENUM('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'PENALTY', 'OWN_GOAL') NOT NULL,
    player_id INT,
    related_player_id INT COMMENT 'For assists, substitutions',
    club_id INT NOT NULL,
    minute INT NOT NULL,
    extra_time INT DEFAULT 0,
    event_description VARCHAR(255) COMMENT 'Auto-generated description',
    event_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES MATCH_TABLE(match_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES PLAYER(player_id) ON DELETE SET NULL,
    FOREIGN KEY (related_player_id) REFERENCES PLAYER(player_id) ON DELETE SET NULL,
    FOREIGN KEY (club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
    INDEX idx_match (match_id),
    INDEX idx_event_type (event_type),
    INDEX idx_player (player_id),
    INDEX idx_minute (minute)
) ENGINE=InnoDB;

-- ============================================
-- GOVERNANCE & AUDIT
-- ============================================

-- APP_USER Table: User accounts with role-based access
CREATE TABLE APP_USER (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('ADMIN', 'EDITOR', 'VIEWER') DEFAULT 'VIEWER',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- AUDIT_LOG Table: Comprehensive audit trail
CREATE TABLE AUDIT_LOG (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES APP_USER(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_table (table_name),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Current Active Players with Club Info
CREATE VIEW vw_active_players AS
SELECT 
    p.player_id,
    p.player_name,
    p.position,
    p.nationality,
    p.jersey_number,
    c.club_name,
    c.city,
    p.attributes,
    p.player_photo_url
FROM PLAYER p
LEFT JOIN CLUB c ON p.current_club_id = c.club_id
WHERE p.is_active = TRUE;

-- View: Active Contracts
CREATE VIEW vw_active_contracts AS
SELECT 
    con.contract_id,
    con.contract_type,
    CASE 
        WHEN con.contract_type = 'PLAYER' THEN p.player_name
        WHEN con.contract_type = 'MANAGER' THEN m.manager_name
    END AS person_name,
    c.club_name,
    con.start_date,
    con.end_date,
    con.salary_amount,
    con.salary_currency,
    DATEDIFF(con.end_date, CURDATE()) AS days_remaining
FROM CONTRACTS con
LEFT JOIN PLAYER p ON con.player_id = p.player_id
LEFT JOIN MANAGER m ON con.manager_id = m.manager_id
JOIN CLUB c ON con.club_id = c.club_id
WHERE con.is_active = TRUE AND con.end_date >= CURDATE();

-- ============================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================

-- Note: Audit triggers would require stored procedures in production
-- For now, audit logging will be handled at application level

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample clubs
INSERT INTO CLUB (club_name, city, founded_year, stadium_name, stadium_capacity) VALUES
('Dhaka Abahani', 'Dhaka', 1972, 'Bangabandhu National Stadium', 36000),
('Bashundhara Kings', 'Dhaka', 2013, 'Bashundhara Kings Arena', 5000),
('Mohammedan SC', 'Dhaka', 1936, 'Bangabandhu National Stadium', 36000),
('Sheikh Jamal DC', 'Dhaka', 1980, 'Bangabandhu National Stadium', 36000);

-- Insert sample season
INSERT INTO SEASON (season_name, start_date, end_date, is_active, description) VALUES
('Bangladesh Premier League 2024', '2024-01-01', '2024-12-31', TRUE, 'BPL 2024 Season');

-- Insert sample admin user (password: admin123 - bcrypt hash)
-- Note: This hash is for demonstration only
INSERT INTO APP_USER (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@clubsync.bd', '$2a$10$YourHashHere', 'System Administrator', 'ADMIN');

-- ============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================

DELIMITER //

-- Procedure: Calculate League Table for a Season
CREATE PROCEDURE sp_calculate_league_table(IN p_season_id INT)
BEGIN
    SELECT 
        c.club_id,
        c.club_name,
        COUNT(DISTINCT m.match_id) AS matches_played,
        SUM(CASE 
            WHEN (m.home_club_id = c.club_id AND m.home_score > m.away_score) OR 
                 (m.away_club_id = c.club_id AND m.away_score > m.home_score) 
            THEN 1 ELSE 0 
        END) AS wins,
        SUM(CASE 
            WHEN m.home_score = m.away_score 
            THEN 1 ELSE 0 
        END) AS draws,
        SUM(CASE 
            WHEN (m.home_club_id = c.club_id AND m.home_score < m.away_score) OR 
                 (m.away_club_id = c.club_id AND m.away_score < m.home_score) 
            THEN 1 ELSE 0 
        END) AS losses,
        SUM(CASE 
            WHEN m.home_club_id = c.club_id THEN m.home_score 
            ELSE m.away_score 
        END) AS goals_for,
        SUM(CASE 
            WHEN m.home_club_id = c.club_id THEN m.away_score 
            ELSE m.home_score 
        END) AS goals_against,
        (SUM(CASE 
            WHEN m.home_club_id = c.club_id THEN m.home_score 
            ELSE m.away_score 
        END) - SUM(CASE 
            WHEN m.home_club_id = c.club_id THEN m.away_score 
            ELSE m.home_score 
        END)) AS goal_difference,
        (SUM(CASE 
            WHEN (m.home_club_id = c.club_id AND m.home_score > m.away_score) OR 
                 (m.away_club_id = c.club_id AND m.away_score > m.home_score) 
            THEN 3
            WHEN m.home_score = m.away_score 
            THEN 1 
            ELSE 0 
        END)) AS points
    FROM CLUB c
    LEFT JOIN MATCH_TABLE m ON (c.club_id = m.home_club_id OR c.club_id = m.away_club_id)
        AND m.season_id = p_season_id 
        AND m.match_status = 'COMPLETED'
    GROUP BY c.club_id, c.club_name
    ORDER BY points DESC, goal_difference DESC, goals_for DESC;
END //

-- Procedure: Get Top Scorers for a Season
CREATE PROCEDURE sp_get_top_scorers(IN p_season_id INT, IN p_limit INT)
BEGIN
    SELECT 
        p.player_id,
        p.player_name,
        c.club_name,
        COUNT(e.event_id) AS goals,
        SUM(CASE WHEN e.event_type = 'ASSIST' THEN 1 ELSE 0 END) AS assists
    FROM PLAYER p
    JOIN EVENTS e ON p.player_id = e.player_id
    JOIN MATCH_TABLE m ON e.match_id = m.match_id
    LEFT JOIN CLUB c ON p.current_club_id = c.club_id
    WHERE m.season_id = p_season_id 
        AND (e.event_type = 'GOAL' OR e.event_type = 'PENALTY')
        AND m.match_status = 'COMPLETED'
    GROUP BY p.player_id, p.player_name, c.club_name
    ORDER BY goals DESC, assists DESC
    LIMIT p_limit;
END //

DELIMITER ;

-- ============================================
-- GRANTS (Optional - for production)
-- ============================================

-- CREATE USER 'clubsync_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON clubsync.* TO 'clubsync_app'@'localhost';
-- FLUSH PRIVILEGES;
