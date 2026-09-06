<?php
/**
 * CORS middleware — allows cross-origin requests from the Vite dev server
 */
function handleCors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080';
    
    // Basic security: only allow localhost in dev
    if (strpos($origin, 'http://localhost') === 0) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        $envOrigin = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080';
        header("Access-Control-Allow-Origin: {$envOrigin}");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
