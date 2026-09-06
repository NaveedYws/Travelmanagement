<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$userId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$db = getDB();

try {
    $stmt = $db->prepare("
        UPDATE profiles 
        SET company_name = ?, company_logo = ?, company_phone = ?, company_website = ?
        WHERE user_id = ?
    ");
    
    $stmt->execute([
        $data['company_name'] ?? null,
        $data['company_logo'] ?? null,
        $data['company_phone'] ?? null,
        $data['company_website'] ?? null,
        $userId
    ]);

    echo json_encode(['message' => 'Profile updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update profile: ' . $e->getMessage()]);
}
