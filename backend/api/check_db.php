<?php
require_once __DIR__ . '/../config/database.php';
$db = getDB();
$stmt = $db->query("DESCRIBE products");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
