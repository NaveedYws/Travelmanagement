<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$userId = requireAuth();

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No image uploaded']);
    exit;
}

$file = $_FILES['image'];
$uploadDir = __DIR__ . '/../' . ($_ENV['UPLOAD_DIR'] ?? 'uploads') . '/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = $userId . '_' . time() . '.' . $ext;
$targetFile = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'];
    $publicUrl = $baseUrl . '/backend/uploads/' . $fileName;

    echo json_encode(['publicUrl' => $publicUrl]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
