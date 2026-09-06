<?php
require_once __DIR__ . '/../../config/database.php';

$db = getDB();

try {
    $sql = "ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) AFTER business_type,
            ADD COLUMN IF NOT EXISTS company_logo TEXT AFTER company_name,
            ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50) AFTER company_logo,
            ADD COLUMN IF NOT EXISTS company_website VARCHAR(255) AFTER company_phone";
    
    $db->exec($sql);
    echo "Migration successful: profiles table updated with branding fields.";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage();
}
