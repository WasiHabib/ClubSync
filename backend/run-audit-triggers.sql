-- Enhanced Audit Triggers
-- Run this via CLI: mysql -u root -p ClubSync < run-audit-triggers.sql

DELIMITER //

DROP TRIGGER IF EXISTS audit_player_insert//
DROP TRIGGER IF EXISTS audit_player_update//
DROP TRIGGER IF EXISTS audit_player_delete//
DROP TRIGGER IF EXISTS audit_club_insert//
DROP TRIGGER IF EXISTS audit_club_update//
DROP TRIGGER IF EXISTS audit_club_delete//
DROP TRIGGER IF EXISTS audit_manager_insert//
DROP TRIGGER IF EXISTS audit_manager_update//
DROP TRIGGER IF EXISTS audit_manager_delete//

-- --- PLAYER TRIGGERS ---
CREATE TRIGGER audit_player_insert
AFTER INSERT ON PLAYER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values)
    VALUES (
        @admin_user_id, 'PLAYER', NEW.player_id, 'INSERT', 
        JSON_OBJECT('name', NEW.player_name, 'position', NEW.position, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)
    );
END//

CREATE TRIGGER audit_player_update
AFTER UPDATE ON PLAYER
FOR EACH ROW
BEGIN
    DECLARE action_type VARCHAR(10) DEFAULT 'UPDATE';
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        SET action_type = 'DELETE';
    END IF;

    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (
        @admin_user_id, 'PLAYER', NEW.player_id, action_type,
        JSON_OBJECT('name', OLD.player_name, 'position', OLD.position, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active),
        JSON_OBJECT('name', NEW.player_name, 'position', NEW.position, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)
    );
END//

CREATE TRIGGER audit_player_delete
AFTER DELETE ON PLAYER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values)
    VALUES (
        @admin_user_id, 'PLAYER', OLD.player_id, 'DELETE',
        JSON_OBJECT('name', OLD.player_name, 'position', OLD.position, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active)
    );
END//

-- --- CLUB TRIGGERS ---
CREATE TRIGGER audit_club_insert
AFTER INSERT ON CLUB
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values)
    VALUES (
        @admin_user_id, 'CLUB', NEW.club_id, 'INSERT', 
        JSON_OBJECT('name', NEW.club_name, 'city', NEW.city)
    );
END//

CREATE TRIGGER audit_club_update
AFTER UPDATE ON CLUB
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (
        @admin_user_id, 'CLUB', NEW.club_id, 'UPDATE',
        JSON_OBJECT('name', OLD.club_name, 'city', OLD.city),
        JSON_OBJECT('name', NEW.club_name, 'city', NEW.city)
    );
END//

CREATE TRIGGER audit_club_delete
AFTER DELETE ON CLUB
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values)
    VALUES (
        @admin_user_id, 'CLUB', OLD.club_id, 'DELETE',
        JSON_OBJECT('name', OLD.club_name, 'city', OLD.city)
    );
END//

-- --- MANAGER TRIGGERS ---
CREATE TRIGGER audit_manager_insert
AFTER INSERT ON MANAGER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, new_values)
    VALUES (
        @admin_user_id, 'MANAGER', NEW.manager_id, 'INSERT', 
        JSON_OBJECT('name', NEW.manager_name, 'specialization', NEW.specialization, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)
    );
END//

CREATE TRIGGER audit_manager_update
AFTER UPDATE ON MANAGER
FOR EACH ROW
BEGIN
    DECLARE action_type VARCHAR(10) DEFAULT 'UPDATE';
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        SET action_type = 'DELETE';
    END IF;
    
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values, new_values)
    VALUES (
        @admin_user_id, 'MANAGER', NEW.manager_id, action_type,
        JSON_OBJECT('name', OLD.manager_name, 'specialization', OLD.specialization, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active),
        JSON_OBJECT('name', NEW.manager_name, 'specialization', NEW.specialization, 'club_id', NEW.current_club_id, 'is_active', NEW.is_active)
    );
END//

CREATE TRIGGER audit_manager_delete
AFTER DELETE ON MANAGER
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG (user_id, table_name, record_id, action, old_values)
    VALUES (
        @admin_user_id, 'MANAGER', OLD.manager_id, 'DELETE',
        JSON_OBJECT('name', OLD.manager_name, 'specialization', OLD.specialization, 'club_id', OLD.current_club_id, 'is_active', OLD.is_active)
    );
END//

DELIMITER ;
