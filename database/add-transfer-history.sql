USE clubsync;

CREATE TABLE IF NOT EXISTS TRANSFER_HISTORY (
    transfer_id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    from_club_id INT,
    to_club_id INT NOT NULL,
    transfer_fee DECIMAL(15, 2) DEFAULT 0,
    transfer_date DATE NOT NULL,
    contract_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES PLAYER(player_id),
    FOREIGN KEY (from_club_id) REFERENCES CLUB(club_id) ON DELETE SET NULL,
    FOREIGN KEY (to_club_id) REFERENCES CLUB(club_id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES CONTRACTS(contract_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Add index for faster queries
CREATE INDEX idx_transfer_date ON TRANSFER_HISTORY(transfer_date);
