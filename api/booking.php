<?php
header('Content-Type: application/json');
require_once('../includes/config.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate data
    if (validateBookingData($data)) {
        // Save to database
        if (saveBooking($data)) {
            // Send confirmation email
            sendConfirmationEmail($data);
            
            echo json_encode(['success' => true]);
            exit;
        }
    }
    
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
} 