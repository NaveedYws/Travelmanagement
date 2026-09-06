<?php
require_once __DIR__ . '/../../config/database.php';

$db = getDB();

try {
    $sql = "ALTER TABLE itineraries 
            ADD COLUMN IF NOT EXISTS destination VARCHAR(255) AFTER trip_title,
            ADD COLUMN IF NOT EXISTS adults INT DEFAULT 0 AFTER end_date,
            ADD COLUMN IF NOT EXISTS children INT DEFAULT 0 AFTER adults,
            ADD COLUMN IF NOT EXISTS theme VARCHAR(255) AFTER children";
    
    $db->exec($sql);
    echo "Migration successful: itineraries table updated.";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage();
}
