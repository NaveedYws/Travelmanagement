<?php
/**
 * Simple Mail Utility
 */

function sendOTP($email, $otp) {
    $subject = "Your Verification Code - Product Hub";
    $message = "Your verification code is: " . $otp . "\n\nThis code will expire in 10 minutes.";
    
    // Log for development
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    $logFile = $logDir . '/mail.log';
    $logEntry = "[" . date('Y-m-d H:i:s') . "] To: $email | OTP: $otp\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    
    // In production, use mail() or PHPMailer
    // return mail($email, $subject, $message);
    
    return true;
}
