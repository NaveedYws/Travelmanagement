<?php
/**
 * FULL MIGRATION SCRIPT — adds ALL travel package columns to products table.
 * Works on ALL MySQL / MariaDB versions.
 *
 * HOW TO USE:
 *   Visit: http://localhost/backend/api/migrate.php?secret=run_migration
 *
 * DELETE THIS FILE after running it once!
 */

if (($_GET['secret'] ?? '') !== 'run_migration') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden. Pass ?secret=run_migration to proceed.']));
}

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

$db = getDB();
$results = [];

// Get existing columns so we can skip ones that already exist
$stmt = $db->query("SHOW COLUMNS FROM products");
$existingCols = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

// Each entry: [column_name, ALTER SQL]
$migrations = [
    ['title',          "ALTER TABLE products ADD COLUMN title          VARCHAR(255)  DEFAULT NULL AFTER name"],
    ['duration',       "ALTER TABLE products ADD COLUMN duration       VARCHAR(100)  DEFAULT NULL AFTER description"],
    ['rating',         "ALTER TABLE products ADD COLUMN rating         DECIMAL(3,2)  NOT NULL DEFAULT 0.00 AFTER whatsapp"],
    ['reviews',        "ALTER TABLE products ADD COLUMN reviews        INT           NOT NULL DEFAULT 0    AFTER rating"],
    ['hero_heading',   "ALTER TABLE products ADD COLUMN hero_heading   VARCHAR(255)  DEFAULT NULL AFTER image_url"],
    ['hero_subheading',"ALTER TABLE products ADD COLUMN hero_subheading VARCHAR(255) DEFAULT NULL AFTER hero_heading"],
    ['inclusions',     "ALTER TABLE products ADD COLUMN inclusions     JSON          DEFAULT NULL AFTER reviews"],
    ['exclusions',     "ALTER TABLE products ADD COLUMN exclusions     JSON          DEFAULT NULL AFTER inclusions"],
    ['itinerary',      "ALTER TABLE products ADD COLUMN itinerary      JSON          DEFAULT NULL AFTER exclusions"],
];

foreach ($migrations as [$col, $sql]) {
    if (in_array($col, $existingCols)) {
        $results[$col] = 'ALREADY EXISTS - skipped';
        continue;
    }
    try {
        $db->exec($sql);
        $results[$col] = 'ADDED';
    } catch (Exception $e) {
        $results[$col] = 'ERROR: ' . $e->getMessage();
    }
}

// Verify
$stmt = $db->query("DESCRIBE products");
$columns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$required = ['title','duration','rating','reviews','hero_heading','hero_subheading','inclusions','exclusions','itinerary'];
$missing = array_diff($required, $columns);

echo json_encode([
    'status'          => empty($missing) ? 'Migration complete!' : 'Some columns missing: ' . implode(', ', $missing),
    'migration_steps' => $results,
    'final_columns'   => $columns,
    'next_step'       => 'DELETE this file (backend/api/migrate.php) now!',
], JSON_PRETTY_PRINT);
