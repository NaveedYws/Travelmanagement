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

$currentUserId = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$db = getDB();

try {
    $sql = "INSERT INTO itineraries (user_id, client_name, trip_title, destination, start_date, end_date, adults, children, theme, days, inclusions, exclusions, client_notes, final_rate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $currentUserId,
        $data['client_name'] ?? '',
        $data['trip_title'] ?? '',
        $data['destination'] ?? '',
        $data['start_date'] ?? null,
        $data['end_date'] ?? null,
        $data['adults'] ?? 0,
        $data['children'] ?? 0,
        $data['theme'] ?? '',
        json_encode($data['days'] ?? []),
        json_encode($data['inclusions'] ?? []),
        json_encode($data['exclusions'] ?? []),
        $data['client_notes'] ?? '',
        $data['final_rate'] ?? 0.00
    ]);

    $itineraryId = $db->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        'message' => 'Itinerary saved successfully',
        'id' => $itineraryId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save itinerary: ' . $e->getMessage()]);
}
