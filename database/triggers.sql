-- ============================================================================
-- CLUBSYNC Database Triggers
-- ============================================================================

DELIMITER //

-- ============================================================================
-- 1. PLAYER CONTRACT VALIDATION TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS player_contract_before_insert//

CREATE TRIGGER player_contract_before_insert
BEFORE INSERT ON CONTRACTS
FOR EACH ROW
BEGIN
    -- Only apply to player contracts
    IF NEW.contract_type = 'PLAYER' THEN
        -- Check that end_date > start_date
        IF NEW.end_date <= NEW.start_date THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Contract end date must be after start date';
        END IF;
        
        -- Prevent multiple active contracts for same player
        IF NEW.is_active = TRUE THEN
            IF EXISTS (
                SELECT 1 FROM CONTRACTS 
                WHERE player_id = NEW.player_id 
                AND is_active = TRUE 
                AND contract_type = 'PLAYER'
            ) THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Player already has an active contract';
            END IF;
        END IF;
    END IF;
END//

-- ============================================================================
-- 2. MANAGER CONTRACT VALIDATION TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS manager_contract_before_insert//

CREATE TRIGGER manager_contract_before_insert
BEFORE INSERT ON CONTRACTS
FOR EACH ROW
BEGIN
    -- Only apply to manager contracts
    IF NEW.contract_type = 'MANAGER' THEN
        -- Check that end_date > start_date
        IF NEW.end_date <= NEW.start_date THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Contract end date must be after start date';
        END IF;
        
        -- Ensure a club cannot have two active managers
        IF NEW.is_active = TRUE THEN
            IF EXISTS (
                SELECT 1 FROM CONTRACTS 
                WHERE club_id = NEW.club_id 
                AND is_active = TRUE 
                AND contract_type = 'MANAGER'
            ) THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Club already has an active manager contract';
            END IF;
        END IF;
    END IF;
END//

-- ============================================================================
-- 3. AUTO-UPDATE PLAYER CLUB ON CONTRACT ACTIVATION
-- ============================================================================
DROP TRIGGER IF EXISTS update_player_current_club//

CREATE TRIGGER update_player_current_club
AFTER INSERT ON CONTRACTS
FOR EACH ROW
BEGIN
    -- When a new active player contract is created, update player's current_club_id
    IF NEW.contract_type = 'PLAYER' AND NEW.is_active = TRUE THEN
        UPDATE PLAYER 
        SET current_club_id = NEW.club_id 
        WHERE player_id = NEW.player_id;
    END IF;
END//

-- ============================================================================
-- 4. AUTO-GENERATE MATCH EVENT DESCRIPTIONS
-- ============================================================================
DROP TRIGGER IF EXISTS match_event_auto_description//

CREATE TRIGGER match_event_auto_description
BEFORE INSERT ON EVENTS
FOR EACH ROW
BEGIN
    DECLARE player_name_var VARCHAR(100);
    DECLARE related_player_name_var VARCHAR(100);
    DECLARE time_str VARCHAR(10);
    
    -- Only generate if description is empty or NULL
    IF NEW.event_description IS NULL OR NEW.event_description = '' THEN
        -- Get player name
        SELECT player_name INTO player_name_var 
        FROM PLAYER 
        WHERE player_id = NEW.player_id;
        
        -- Get related player name if exists
        IF NEW.related_player_id IS NOT NULL THEN
            SELECT player_name INTO related_player_name_var 
            FROM PLAYER 
            WHERE player_id = NEW.related_player_id;
        END IF;
        
        -- Format time string
        IF NEW.extra_time > 0 THEN
            SET time_str = CONCAT(NEW.minute, '+', NEW.extra_time, '''');
        ELSE
            SET time_str = CONCAT(NEW.minute, '''');
        END IF;
        
        -- Generate description based on event type
        CASE NEW.event_type
            WHEN 'GOAL' THEN
                SET NEW.event_description = CONCAT('⚽ Goal by ', player_name_var, ' at ', time_str);
            WHEN 'PENALTY' THEN
                SET NEW.event_description = CONCAT('⚽ Penalty scored by ', player_name_var, ' at ', time_str);
            WHEN 'OWN_GOAL' THEN
                SET NEW.event_description = CONCAT('Own Goal by ', player_name_var, ' at ', time_str);
            WHEN 'ASSIST' THEN
                SET NEW.event_description = CONCAT('🎯 Assist by ', player_name_var, ' at ', time_str);
            WHEN 'YELLOW_CARD' THEN
                SET NEW.event_description = CONCAT('🟨 Yellow card for ', player_name_var, ' at ', time_str);
            WHEN 'RED_CARD' THEN
                SET NEW.event_description = CONCAT('🟥 Red card for ', player_name_var, ' at ', time_str);
            WHEN 'SUBSTITUTION' THEN
                SET NEW.event_description = CONCAT('🔄 Substitution: ', IFNULL(related_player_name_var, 'Unknown'), ' ➡️ ', player_name_var, ' at ', time_str);
            ELSE
                SET NEW.event_description = CONCAT('Event by ', player_name_var, ' at ', time_str);
        END CASE;
    END IF;
END//

-- ============================================================================
-- 5. AUDIT TRIGGERS FOR DATA TRACKING
-- ============================================================================

-- Audit trigger for PLAYER table
DROP TRIGGER IF EXISTS audit_player_insert//
CREATE TRIGGER audit_player_insert
AFTER INSERT ON PLAYER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, new_values)
    VALUES ('PLAYER', NEW.player_id, 'INSERT', 
            JSON_OBJECT(
                'player_name', NEW.player_name,
                'position', NEW.position,
                'current_club_id', NEW.current_club_id,
                'nationality', NEW.nationality
            ));
END//

DROP TRIGGER IF EXISTS audit_player_update//
CREATE TRIGGER audit_player_update
AFTER UPDATE ON PLAYER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, old_values, new_values)
    VALUES ('PLAYER', NEW.player_id, 'UPDATE',
            JSON_OBJECT(
                'player_name', OLD.player_name,
                'position', OLD.position,
                'current_club_id', OLD.current_club_id,
                'nationality', OLD.nationality
            ),
            JSON_OBJECT(
                'player_name', NEW.player_name,
                'position', NEW.position,
                'current_club_id', NEW.current_club_id,
                'nationality', NEW.nationality
            ));
END//

DROP TRIGGER IF EXISTS audit_player_delete//
CREATE TRIGGER audit_player_delete
AFTER DELETE ON PLAYER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, old_values)
    VALUES ('PLAYER', OLD.player_id, 'DELETE',
            JSON_OBJECT(
                'player_name', OLD.player_name,
                'position', OLD.position,
                'current_club_id', OLD.current_club_id,
                'nationality', OLD.nationality
            ));
END//

-- Audit trigger for MATCH_TABLE
DROP TRIGGER IF EXISTS audit_match_update//
CREATE TRIGGER audit_match_update
AFTER UPDATE ON MATCH_TABLE
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, old_values, new_values)
    VALUES ('MATCH_TABLE', NEW.match_id, 'UPDATE',
            JSON_OBJECT(
                'home_score', OLD.home_score,
                'away_score', OLD.away_score,
                'match_status', OLD.match_status
            ),
            JSON_OBJECT(
                'home_score', NEW.home_score,
                'away_score', NEW.away_score,
                'match_status', NEW.match_status
            ));
END//

-- Audit trigger for CONTRACTS
DROP TRIGGER IF EXISTS audit_contract_insert//
CREATE TRIGGER audit_contract_insert
AFTER INSERT ON CONTRACTS
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, new_values)
    VALUES ('CONTRACTS', NEW.contract_id, 'INSERT',
            JSON_OBJECT(
                'contract_type', NEW.contract_type,
                'player_id', NEW.player_id,
                'manager_id', NEW.manager_id,
                'club_id', NEW.club_id,
                'is_active', NEW.is_active
            ));
END//

DELIMITER ;

-- End of triggers file
