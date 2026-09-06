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
$otp = $data['otp'] ?? '';

if (!$email || !$otp) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and OTP are required']);
    exit;
}

$db = getDB();

try {
    // Check OTP
    $stmt = $db->prepare("SELECT id FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email, $otp]);
    $otpRow = $stmt->fetch();

    if (!$otpRow) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired OTP']);
        exit;
    }

    // Mark user as verified
    $stmt = $db->prepare("UPDATE users SET is_verified = 1 WHERE email = ?");
    $stmt->execute([$email]);

    // Get user details
    $stmt = $db->prepare("SELECT u.id, u.email, u.role, p.business_type FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Delete used OTP
    $stmt = $db->prepare("DELETE FROM otps WHERE email = ?");
    $stmt->execute([$email]);

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
    echo json_encode(['error' => 'Verification failed: ' . $e->getMessage()]);
}
