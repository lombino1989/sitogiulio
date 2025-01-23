<?php
require_once 'config.php';
require_once 'db.php';

class BookingManager {
    private $db;
    private $mailer;

    public function __construct() {
        $this->db = new Database();
        $this->mailer = new Mailer();
    }

    public function checkAvailability($date, $time, $guests) {
        // Verifica disponibilità tavoli
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as booked_tables 
            FROM bookings 
            WHERE booking_date = ? 
            AND booking_time = ?
        ");
        $stmt->execute([$date, $time]);
        $result = $stmt->fetch();

        // Massimo 20 tavoli per fascia oraria
        return $result['booked_tables'] < 20;
    }

    public function createBooking($data) {
        try {
            $this->db->beginTransaction();

            // Inserisci prenotazione
            $stmt = $this->db->prepare("
                INSERT INTO bookings 
                (name, email, phone, booking_date, booking_time, guests, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['date'],
                $data['time'],
                $data['guests'],
                $data['notes'] ?? ''
            ]);

            $bookingId = $this->db->lastInsertId();

            // Invia email di conferma
            $this->sendConfirmationEmail($data);

            $this->db->commit();
            return $bookingId;

        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    private function sendConfirmationEmail($data) {
        $subject = "Conferma Prenotazione - La Cucina di Maria";
        $message = $this->getEmailTemplate('booking_confirmation', [
            'name' => $data['name'],
            'date' => $data['date'],
            'time' => $data['time'],
            'guests' => $data['guests']
        ]);

        return $this->mailer->send($data['email'], $subject, $message);
    }

    private function getEmailTemplate($template, $data) {
        ob_start();
        include "../templates/emails/{$template}.php";
        return ob_get_clean();
    }
} 