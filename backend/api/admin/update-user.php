<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? null;
$action = $data['action'] ?? ''; // 'verify', 'set_role', 'delete'

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

$db = getDB();

try {
    if ($action === 'verify') {
        $isVerified = $data['is_verified'] ? 1 : 0;
        $stmt = $db->prepare("UPDATE users SET is_verified = ? WHERE id = ?");
        $stmt->execute([$isVerified, $userId]);
    } else if ($action === 'set_role') {
        $role = $data['role'] ?? 'user';
        if (!in_array($role, ['admin', 'user'])) {
            throw new Exception("Invalid role");
        }
        $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$role, $userId]);
    } else if ($action === 'delete') {
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
    } else {
        throw new Exception("Invalid action");
    }

    echo json_encode(['message' => 'User updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update user: ' . $e->getMessage()]);
}
