<?php
require_once __DIR__ . '/../config/bootstrap.php';

/**
 * Decode JWT from Authorization header and return user_id.
 */
function getAuthUserId(): ?int {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }
    $decoded = getAuthPayload();
    return $decoded ? (int) $decoded->user_id : null;
}

/**
 * Get full auth payload.
 */
function getAuthPayload(): ?object {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    try {
        $secret = $_ENV['JWT_SECRET'] ?? 'secret';
        $decoded = SimpleJWT::decode($matches[1], $secret);
        return $decoded;
    } catch (\Exception $e) {
        return null;
    }
}

/**
 * Require authentication and return user_id.
 */
function requireAuth(): int {
    $decoded = getAuthPayload();
    if ($decoded === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return (int) $decoded->user_id;
}

/**
 * Require authentication and return full payload.
 */
function requireAuthPayload(): object {
    $decoded = getAuthPayload();
    if ($decoded === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return $decoded;
}

/**
 * Require admin role.
 */
function requireAdmin(): object {
    $decoded = requireAuthPayload();
    if (($decoded->role ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Admin access required']);
        exit;
    }
    return $decoded;
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(int $userId, string $email, string $role = 'user'): string {
    $secret = $_ENV['JWT_SECRET'] ?? 'secret';
    $expiry = (int) ($_ENV['JWT_EXPIRY'] ?? 86400);

    $payload = [
        'user_id' => $userId,
        'email'   => $email,
        'role'    => $role,
        'iat'     => time(),
        'exp'     => time() + $expiry,
    ];

    return SimpleJWT::encode($payload, $secret);
}
