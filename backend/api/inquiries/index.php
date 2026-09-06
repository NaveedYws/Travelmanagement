<?php
require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';

handleCors();

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List inquiries for logged-in user
    $currentUserId = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT i.*, p.name as product_name, p.category as product_category
            FROM inquiries i
            JOIN products p ON i.product_id = p.id
            WHERE p.user_id = ?
            ORDER BY i.created_at DESC
        ");
        $stmt->execute([$currentUserId]);
        $inquiries = $stmt->fetchAll();

        // Format for frontend
        foreach ($inquiries as &$inq) {
            $inq['products'] = [
                'name' => $inq['product_name'],
                'category' => $inq['product_category']
            ];
            unset($inq['product_name'], $inq['product_category']);

            // Parse source & campaign from message if present: e.g. "[Meta Ads | Campaign: Bali Summer] Notes..."
            if (!empty($inq['message']) && preg_match('/^\[(.*?)\]\s*(.*)$/s', $inq['message'], $matches)) {
                $metaParts = explode('|', $matches[1]);
                $rawSource = strtolower(trim($metaParts[0]));
                if (str_contains($rawSource, 'meta') || str_contains($rawSource, 'facebook') || str_contains($rawSource, 'instagram')) {
                    $inq['source'] = 'meta_ads';
                } elseif (str_contains($rawSource, 'google')) {
                    $inq['source'] = 'google_ads';
                } else {
                    $inq['source'] = str_replace(' ', '_', $rawSource);
                }

                if (isset($metaParts[1]) && stripos($metaParts[1], 'Campaign:') !== false) {
                    $inq['campaign_name'] = trim(str_ireplace('Campaign:', '', $metaParts[1]));
                }
                $inq['clean_message'] = trim($matches[2]);
            } else {
                $inq['source'] = 'website';
                $inq['clean_message'] = $inq['message'];
            }

            // Extract email from address if present: e.g. "Delhi • email@domain.com"
            if (!empty($inq['address'])) {
                if (filter_var(trim($inq['address']), FILTER_VALIDATE_EMAIL)) {
                    $inq['email'] = trim($inq['address']);
                } elseif (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $inq['address'], $emailMatches)) {
                    $inq['email'] = $emailMatches[0];
                }
            }
        }

        echo json_encode(['inquiries' => $inquiries]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch inquiries: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Submit new inquiry or batch import
    $data = json_decode(file_get_contents('php://input'), true);

    $isBatch = isset($data['leads']) && is_array($data['leads']);
    $leads = $isBatch ? $data['leads'] : [$data];

    if (empty($leads)) {
        http_response_code(400);
        echo json_encode(['error' => 'No leads provided']);
        exit;
    }

    try {
        $db->beginTransaction();
        $insertedCount = 0;
        $lastId = null;

        $stmt = $db->prepare("
            INSERT INTO inquiries (product_id, customer_name, contact_no, address, message, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        foreach ($leads as $lead) {
            $product_id = $lead['product_id'] ?? null;
            $customer_name = trim($lead['customer_name'] ?? '');
            $contact_no = trim($lead['contact_no'] ?? '');
            $address = $lead['address'] ?? null;
            $message = $lead['message'] ?? null;
            $status = in_array($lead['status'] ?? '', ['new', 'contacted', 'converted', 'closed']) ? $lead['status'] : 'new';
            $source = $lead['source'] ?? null;
            $email = $lead['email'] ?? null;
            $campaign = $lead['campaign_name'] ?? null;

            if (!$product_id || !$customer_name || !$contact_no) {
                continue;
            }

            // Structure address with email if provided
            $fullAddress = $address;
            if ($email && (!is_string($fullAddress) || !str_contains($fullAddress, $email))) {
                $fullAddress = $fullAddress ? "{$fullAddress} • {$email}" : $email;
            }

            // Structure message with source & campaign prefix
            $fullMessage = $message;
            $metaPrefix = [];
            if ($source) {
                if ($source === 'meta_ads') $metaPrefix[] = "Meta Ads";
                elseif ($source === 'google_ads') $metaPrefix[] = "Google Ads";
                else $metaPrefix[] = ucfirst(str_replace('_', ' ', $source));
            }
            if ($campaign) {
                $metaPrefix[] = "Campaign: {$campaign}";
            }
            if (!empty($metaPrefix)) {
                $prefixStr = "[" . implode(" | ", $metaPrefix) . "]";
                if ($fullMessage && !str_starts_with($fullMessage, "[")) {
                    $fullMessage = "{$prefixStr} " . $fullMessage;
                } elseif (!$fullMessage) {
                    $fullMessage = $prefixStr;
                }
            }

            $stmt->execute([$product_id, $customer_name, $contact_no, $fullAddress, $fullMessage, $status]);
            $lastId = $db->lastInsertId();
            $insertedCount++;
        }

        $db->commit();

        if ($insertedCount === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid leads could be inserted. Check that customer name and contact are provided.']);
            exit;
        }

        echo json_encode(['success' => true, 'count' => $insertedCount, 'id' => $lastId]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save leads: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
