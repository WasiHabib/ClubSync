-- Add TROPHY table to database
USE clubsync;

CREATE TABLE IF NOT EXISTS TROPHY (
    trophy_id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    trophy_name VARCHAR(200) NOT NULL,
    season_won VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample trophies
INSERT INTO TROPHY (club_id, trophy_name, season_won, description) VALUES
(1, 'Bangladesh Premier League', '2023', 'Champions of the season'),
(2, 'Bangladesh Premier League', '2022', 'League winners'),
(4, 'Federation Cup', '2023', 'Cup winners');
