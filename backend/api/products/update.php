<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$currentUserId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);

$id = $data['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Product ID is required']);
    exit;
}

$db = getDB();

try {
    // Verify ownership
    $stmt = $db->prepare("SELECT user_id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    if ((int)$product['user_id'] !== $currentUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    // Update
    $fields = [];
    $params = [];
    $allowedFields = ['name', 'title', 'description', 'duration', 'price', 'category', 'image_url', 'hero_heading', 'hero_subheading', 'stock', 'whatsapp', 'rating', 'reviews'];
    // JSON columns need special handling
    $jsonFields = ['inclusions', 'exclusions', 'itinerary', 'activities'];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $params[] = $data[$field];
        }
    }

    foreach ($jsonFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $params[] = json_encode($data[$field]);
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $params[] = $id;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $updated = $stmt->fetch();

    // Decode JSON columns
    foreach ($jsonFields as $jsonCol) {
        if (isset($updated[$jsonCol]) && is_string($updated[$jsonCol])) {
            $updated[$jsonCol] = json_decode($updated[$jsonCol], true);
        }
        if (!isset($updated[$jsonCol])) {
            $updated[$jsonCol] = [];
        }
    }
    $updated['price'] = (float) $updated['price'];
    $updated['stock'] = (int) $updated['stock'];
    $updated['rating'] = isset($updated['rating']) ? (float) $updated['rating'] : 0;
    $updated['reviews'] = isset($updated['reviews']) ? (int) $updated['reviews'] : 0;

    echo json_encode($updated);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update product: ' . $e->getMessage()]);
}
