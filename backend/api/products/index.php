<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

$db = getDB();

/**
 * Helper: decode JSON columns into arrays/objects for the frontend
 */
function formatProduct(&$p) {
    $p['price'] = (float) $p['price'];
    $p['stock'] = (int) $p['stock'];
    $p['rating'] = isset($p['rating']) ? (float) $p['rating'] : 0;
    $p['reviews'] = isset($p['reviews']) ? (int) $p['reviews'] : 0;

    // JSON columns — decode to arrays
    foreach (['inclusions', 'exclusions', 'itinerary', 'activities'] as $jsonCol) {
        if (isset($p[$jsonCol]) && is_string($p[$jsonCol])) {
            $p[$jsonCol] = json_decode($p[$jsonCol], true);
        }
        if (!isset($p[$jsonCol])) {
            $p[$jsonCol] = [];
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List products
    $userId = $_GET['user_id'] ?? null;
    $category = $_GET['category'] ?? null;

    $query = "SELECT * FROM products WHERE 1=1";
    $params = [];

    if ($userId) {
        $query .= " AND user_id = ?";
        $params[] = $userId;
    }
    if ($category) {
        $query .= " AND category = ?";
        $params[] = $category;
    }

    $query .= " ORDER BY created_at DESC";

    try {
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        // Convert types appropriately
        foreach ($products as &$p) {
            formatProduct($p);
        }

        echo json_encode(['products' => $products]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch products: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create product
    $currentUserId = requireAuth();

    // Check Package Limit (Max 10)
    try {
        $stmtCount = $db->prepare("SELECT COUNT(*) as count FROM products WHERE user_id = ?");
        $stmtCount->execute([$currentUserId]);
        $result = $stmtCount->fetch();
        if ($result && (int)$result['count'] >= 10) {
            http_response_code(403);
            echo json_encode(['error' => 'Package limit reached. You can only add up to 10 packages.']);
            exit;
        }
    } catch (Exception $e) {
        // Silently continue
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $name        = $data['name'] ?? '';
    $title       = $data['title'] ?? null;
    $price       = $data['price'] ?? 0;
    $stock       = $data['stock'] ?? 0;
    $description = $data['description'] ?? null;
    $duration    = $data['duration'] ?? null;
    $category    = $data['category'] ?? null;
    $image_url   = $data['image_url'] ?? null;
    $whatsapp    = $data['whatsapp'] ?? null;
    $rating      = $data['rating'] ?? 0.00;
    $reviews     = $data['reviews'] ?? 0;
    $hero_heading    = $data['hero_heading'] ?? null;
    $hero_subheading = $data['hero_subheading'] ?? null;
    $inclusions  = isset($data['inclusions']) ? json_encode($data['inclusions']) : null;
    $exclusions  = isset($data['exclusions']) ? json_encode($data['exclusions']) : null;
    $itinerary   = isset($data['itinerary'])  ? json_encode($data['itinerary'])  : null;
    $activities  = isset($data['activities']) ? json_encode($data['activities']) : null;

    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Product name is required']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO products (user_id, name, title, description, duration, price, category, image_url, hero_heading, hero_subheading, stock, whatsapp, rating, reviews, inclusions, exclusions, itinerary, activities) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $currentUserId, $name, $title, $description, $duration, $price, $category, $image_url,
            $hero_heading, $hero_subheading, $stock, $whatsapp, $rating, $reviews,
            $inclusions, $exclusions, $itinerary, $activities
        ]);
        
        $newId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$newId]);
        $product = $stmt->fetch();
        formatProduct($product);
        
        echo json_encode($product);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create product: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
