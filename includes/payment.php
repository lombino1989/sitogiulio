<?php
require_once 'config.php';
require_once 'stripe/init.php';

class PaymentManager {
    private $stripe;
    private $db;

    public function __construct() {
        $this->stripe = new \Stripe\StripeClient(STRIPE_SECRET_KEY);
        $this->db = new Database();
    }

    public function createPaymentIntent($bookingId, $amount) {
        try {
            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => $amount * 100, // Converti in centesimi
                'currency' => 'eur',
                'metadata' => [
                    'booking_id' => $bookingId
                ]
            ]);

            // Salva il payment intent nel database
            $stmt = $this->db->prepare("
                UPDATE bookings 
                SET payment_intent_id = ?, 
                    payment_status = 'pending' 
                WHERE id = ?
            ");
            $stmt->execute([$paymentIntent->id, $bookingId]);

            return [
                'clientSecret' => $paymentIntent->client_secret,
                'success' => true
            ];

        } catch (\Stripe\Exception\ApiErrorException $e) {
            error_log($e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function handleWebhook($payload, $sigHeader) {
        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, STRIPE_WEBHOOK_SECRET
            );

            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $this->handleSuccessfulPayment($event->data->object);
                    break;
                case 'payment_intent.payment_failed':
                    $this->handleFailedPayment($event->data->object);
                    break;
            }

            return true;
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    private function handleSuccessfulPayment($paymentIntent) {
        $bookingId = $paymentIntent->metadata['booking_id'];
        $stmt = $this->db->prepare("
            UPDATE bookings 
            SET payment_status = 'completed', 
                payment_date = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$bookingId]);

        // Invia email di conferma pagamento
        $booking = $this->getBooking($bookingId);
        $this->sendPaymentConfirmation($booking);
    }

    private function handleFailedPayment($paymentIntent) {
        $bookingId = $paymentIntent->metadata['booking_id'];
        $stmt = $this->db->prepare("
            UPDATE bookings 
            SET payment_status = 'failed' 
            WHERE id = ?
        ");
        $stmt->execute([$bookingId]);
    }
} 