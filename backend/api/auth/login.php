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

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$db = getDB();

try {
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.password_hash, u.is_verified, p.business_type 
        FROM users u 
        JOIN profiles p ON u.id = p.user_id 
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }

    if (!$user['is_verified']) {
        http_response_code(403);
        echo json_encode(['error' => 'Please verify your email address before logging in.']);
        exit;
    }

    $token = generateToken((int)$user['id'], $user['email'], $user['role']);

    echo json_encode([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'business_type' => $user['business_type'],
            'role' => $user['role']
        ],
        'token' => $token
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
}
