<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$currentUserId = requireAuth();
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Inquiry ID is required']);
    exit;
}

$db = getDB();

try {
    // Verify ownership via product
    $stmt = $db->prepare("
        SELECT p.user_id 
        FROM inquiries i 
        JOIN products p ON i.product_id = p.id 
        WHERE i.id = ?
    ");
    $stmt->execute([$id]);
    $inquiry = $stmt->fetch();

    if (!$inquiry) {
        http_response_code(404);
        echo json_encode(['error' => 'Inquiry not found']);
        exit;
    }

    if ((int)$inquiry['user_id'] !== $currentUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM inquiries WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete inquiry: ' . $e->getMessage()]);
}
