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

$db = getDB();

// Check if any users exist. If not, the first user will be an admin.
$stmt = $db->query("SELECT COUNT(*) as count FROM users");
$userCount = $stmt->fetch()['count'];

if ($userCount > 0) {
    requireAdmin();
}

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$businessType = $data['business_type'] ?? 'products';
$role = ($userCount == 0) ? 'admin' : 'user';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

try {
    $db->beginTransaction();

    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }

    // Create user
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
    $stmt->execute([$email, $passwordHash, $role]);
    $userId = $db->lastInsertId();

    // Create profile
    $stmt = $db->prepare("INSERT INTO profiles (user_id, business_type) VALUES (?, ?)");
    $stmt->execute([$userId, $businessType]);

    // Generate OTP
    $otp = sprintf("%06d", mt_rand(0, 999999));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Store OTP
    $stmt = $db->prepare("INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $otp, $expiresAt]);

    require_once __DIR__ . '/../../config/mail.php';
    sendOTP($email, $otp);

    $db->commit();

    echo json_encode([
        'message' => 'OTP sent to your email. Please verify to complete registration.',
        'email' => $email
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
}
