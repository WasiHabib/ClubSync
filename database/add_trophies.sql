-- Add TROPHY table
CREATE TABLE IF NOT EXISTS TROPHY (
    trophy_id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    trophy_name VARCHAR(100) NOT NULL,
    season_won VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE
);

-- Insert sample trophies
INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2016', 'Champion' FROM CLUB WHERE club_name = 'Dhaka Abahani' LIMIT 1;

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2018', 'Winner' FROM CLUB WHERE club_name = 'Dhaka Abahani' LIMIT 1;

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2021', 'Champion' FROM CLUB WHERE club_name = 'Bashundhara Kings' LIMIT 1;

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Independence Cup', '2022', 'Winner' FROM CLUB WHERE club_name = 'Bashundhara Kings' LIMIT 1;

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Independence Cup', '2014', 'Winner' FROM CLUB WHERE club_name = 'Mohammedan SC' LIMIT 1;
