<?php
/**
 * Manual Bootstrap (No Composer Version)
 * This file replaces vendor/autoload.php for users without Composer.
 */

// 1. Manual .env Loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            $_ENV[$name] = $value;
            putenv("$name=$value");
        }
    }
}

loadEnv(__DIR__ . '/../.env');

// 2. Simple JWT Implementation (Replacement for Firebase\JWT)
class SimpleJWT {
    public static function encode(array $payload, string $key): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode(string $jwt, string $key) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return null;
        list($header, $payload, $signature) = $parts;
        
        $expectedSig = hash_hmac('sha256', $header . "." . $payload, $key, true);
        if (!hash_equals($expectedSig, self::base64UrlDecode($signature))) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($payload));
        if (isset($decoded->exp) && $decoded->exp < time()) {
            return null;
        }

        return $decoded;
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
