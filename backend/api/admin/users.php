<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$db = getDB();

try {
    $stmt = $db->query("
        SELECT u.id, u.email, u.role, u.is_verified, u.created_at, p.business_type 
        FROM users u 
        LEFT JOIN profiles p ON u.id = p.user_id 
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll();

    echo json_encode(['users' => $users]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch users: ' . $e->getMessage()]);
}
