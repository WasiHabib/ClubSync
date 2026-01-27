-- Clear existing trophies to avoid duplicates if re-run
DELETE FROM TROPHY;

-- Dhaka Abahani (The Sky Blue Brigade) - Most successful
INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2017-18', 'Champion (6th Title)' FROM CLUB WHERE club_name = 'Dhaka Abahani';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2021-22', 'Winner (12th Title)' FROM CLUB WHERE club_name = 'Dhaka Abahani';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Independence Cup', '2021-22', 'Winner' FROM CLUB WHERE club_name = 'Dhaka Abahani';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2016', 'Champion (Undefeated)' FROM CLUB WHERE club_name = 'Dhaka Abahani';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2018', 'Winner' FROM CLUB WHERE club_name = 'Dhaka Abahani';

-- Bashundhara Kings (The Kings) - Dominant force
INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2023-24', 'Champion (5th Consecutive)' FROM CLUB WHERE club_name = 'Bashundhara Kings';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2022-23', 'Champion' FROM CLUB WHERE club_name = 'Bashundhara Kings';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Independence Cup', '2023-24', 'Winner' FROM CLUB WHERE club_name = 'Bashundhara Kings';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2020-21', 'Winner' FROM CLUB WHERE club_name = 'Bashundhara Kings';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2018-19', 'Champion (Debut season)' FROM CLUB WHERE club_name = 'Bashundhara Kings';

-- Mohammedan SC (Black and Whites) - Traditional giants
INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2022-23', 'Winner (Ending 14-year drought)' FROM CLUB WHERE club_name = 'Mohammedan SC';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Independence Cup', '2014', 'Winner' FROM CLUB WHERE club_name = 'Mohammedan SC';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Super Cup', '2013', 'Champion' FROM CLUB WHERE club_name = 'Mohammedan SC';

-- Sheikh Jamal Dhanmondi Club
INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2015', 'Champion' FROM CLUB WHERE club_name = 'Sheikh Jamal DC';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Federation Cup', '2015', 'Winner' FROM CLUB WHERE club_name = 'Sheikh Jamal DC';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Bangladesh Premier League', '2013-14', 'Champion' FROM CLUB WHERE club_name = 'Sheikh Jamal DC';

INSERT INTO TROPHY (club_id, trophy_name, season_won, description)
SELECT club_id, 'Pokhara Cup (Nepal)', '2011', 'International Trophy' FROM CLUB WHERE club_name = 'Sheikh Jamal DC';
