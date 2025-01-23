<?php
require_once 'config.php';

class ReviewManager {
    private $db;
    private $mailer;

    public function __construct() {
        $this->db = new Database();
        $this->mailer = new Mailer();
    }

    public function requestReview($bookingId) {
        $booking = $this->getBooking($bookingId);
        
        // Genera token univoco per la recensione
        $token = bin2hex(random_bytes(32));
        
        // Salva token nel database
        $stmt = $this->db->prepare("
            INSERT INTO review_tokens 
            (booking_id, token, expires_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ");
        $stmt->execute([$bookingId, $token]);

        // Invia email con link per recensione
        return $this->sendReviewRequest($booking, $token);
    }

    public function submitReview($token, $data) {
        try {
            // Verifica token
            $stmt = $this->db->prepare("
                SELECT booking_id 
                FROM review_tokens 
                WHERE token = ? 
                AND expires_at > NOW() 
                AND used = 0
            ");
            $stmt->execute([$token]);
            $result = $stmt->fetch();

            if (!$result) {
                throw new Exception('Token non valido o scaduto');
            }

            $this->db->beginTransaction();

            // Inserisci recensione
            $stmt = $this->db->prepare("
                INSERT INTO reviews 
                (booking_id, rating, comment, verified) 
                VALUES (?, ?, ?, 1)
            ");
            $stmt->execute([
                $result['booking_id'],
                $data['rating'],
                $data['comment']
            ]);

            // Marca token come usato
            $stmt = $this->db->prepare("
                UPDATE review_tokens 
                SET used = 1 
                WHERE token = ?
            ");
            $stmt->execute([$token]);

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    public function getVerifiedReviews($limit = 10, $offset = 0) {
        $stmt = $this->db->prepare("
            SELECT r.*, b.name as customer_name 
            FROM reviews r 
            JOIN bookings b ON r.booking_id = b.id 
            WHERE r.verified = 1 
            ORDER BY r.created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    private function sendReviewRequest($booking, $token) {
        $subject = "La tua opinione è importante - La Cucina di Maria";
        $reviewLink = SITE_URL . "/recensione?token=" . $token;
        
        $message = $this->getEmailTemplate('review_request', [
            'name' => $booking['name'],
            'reviewLink' => $reviewLink
        ]);

        return $this->mailer->send($booking['email'], $subject, $message);
    }
} 