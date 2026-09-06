<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

$userId = requireAuth();

$db = getDB();

try {
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.role, p.business_type, p.company_name, p.company_logo, p.company_phone, p.company_website 
        FROM users u 
        JOIN profiles p ON u.id = p.user_id 
        WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    echo json_encode([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'business_type' => $user['business_type'],
            'role' => $user['role'],
            'company_name' => $user['company_name'],
            'company_logo' => $user['company_logo'],
            'company_phone' => $user['company_phone'],
            'company_website' => $user['company_website']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user: ' . $e->getMessage()]);
}
