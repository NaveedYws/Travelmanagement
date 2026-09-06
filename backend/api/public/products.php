<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';

handleCors();

$db = getDB();

$userId = $_GET['user_id'] ?? null;
$category = $_GET['category'] ?? null;

$query = "SELECT * FROM products WHERE 1=1";
$params = [];

if ($userId) {
    $query .= " AND user_id = ?";
    $params[] = $userId;
}
if ($category) {
    $query .= " AND category = ?";
    $params[] = $category;
}

$query .= " ORDER BY created_at DESC";

try {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['price'] = (float) $p['price'];
        $p['stock'] = (int) $p['stock'];
        $p['rating'] = isset($p['rating']) ? (float) $p['rating'] : 0;
        $p['reviews'] = isset($p['reviews']) ? (int) $p['reviews'] : 0;

        // Decode JSON columns
        foreach (['inclusions', 'exclusions', 'itinerary'] as $jsonCol) {
            if (isset($p[$jsonCol]) && is_string($p[$jsonCol])) {
                $p[$jsonCol] = json_decode($p[$jsonCol], true);
            }
            if (!isset($p[$jsonCol])) {
                $p[$jsonCol] = [];
            }
        }
    }

    echo json_encode(['products' => $products, 'count' => count($products)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
