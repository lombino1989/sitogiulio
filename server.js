const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const paypal = require('paypal-ipn');

const app = express();

// Abilita CORS per tutte le richieste
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connessione MongoDB Atlas (free tier)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://[your-connection-string]', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Configurazione Storage su Cloudinary (free tier)
const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Schema per i pagamenti
const PaymentSchema = new mongoose.Schema({
    taskId: String,
    amount: Number,
    status: String,
    recipientName: String,
    iban: String,
    bankName: String,
    completedAt: Date,
    paidAt: Date
});

const Payment = mongoose.model('Payment', PaymentSchema);

// Schema per i task completati
const TaskSchema = new mongoose.Schema({
    taskId: String,
    proof: String,
    feedback: String,
    completedAt: Date,
    status: String
});

const Task = mongoose.model('Task', TaskSchema);

// Token del bot Telegram
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, {polling: true});

// ID del tuo canale/gruppo Telegram dove ricevere le notifiche
const ADMIN_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

// Il tuo IBAN dove ricevere i pagamenti
const TUO_IBAN = "IT60X0542811101000000123456"; // Sostituisci con il tuo IBAN reale
const TUA_EMAIL = "tua.email@esempio.com"; // La tua email per le notifiche

// Il tuo ID commerciante PayPal
const PAYPAL_EMAIL = 'tuo.paypal@email.com';
const MINIMUM_PAYOUT = 5; // Minimo €5 per il prelievo

// Serve l'app frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API per sottomettere un task completato
app.post('/api/submit-task', multer({ dest: 'uploads/' }).single('proof'), async (req, res) => {
    try {
        // Salva il task completato
        const task = new Task({
            taskId: req.body.taskId,
            proof: req.file.path,
            feedback: req.body.feedback,
            completedAt: new Date(),
            status: 'pending'
        });
        await task.save();

        // Crea il record del pagamento
        const bankDetails = JSON.parse(req.body.bankDetails);
        const payment = new Payment({
            taskId: req.body.taskId,
            amount: parseFloat(req.body.reward),
            status: 'pending',
            recipientName: bankDetails.accountName,
            iban: bankDetails.iban,
            bankName: bankDetails.bankName,
            completedAt: new Date()
        });
        await payment.save();

        // Notifica l'amministratore
        await notifyAdmin(payment._id);

        res.json({
            status: 'success',
            paymentId: payment._id,
            amount: payment.amount,
            message: 'Task ricevuto! Il pagamento verrà elaborato entro 24 ore lavorative.'
        });

    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({
            status: 'error',
            message: 'Errore nel salvataggio del task.'
        });
    }
});

// API per verificare lo stato del pagamento
app.get('/api/payment-status/:paymentId', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Pagamento non trovato' });
        }

        res.json({
            status: payment.status,
            amount: payment.amount,
            completedAt: payment.completedAt,
            paidAt: payment.paidAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Errore nel recupero dello stato del pagamento' });
    }
});

// API per l'amministratore per approvare e processare i pagamenti
app.post('/api/admin/process-payment', async (req, res) => {
    try {
        const { paymentId, adminKey } = req.body;

        // Verifica la chiave amministratore
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Non autorizzato' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Pagamento non trovato' });
        }

        // Aggiorna lo stato del pagamento
        payment.status = 'completed';
        payment.paidAt = new Date();
        await payment.save();

        // Invia email di conferma all'utente
        await sendPaymentConfirmation(payment);

        res.json({ status: 'success', message: 'Pagamento processato con successo' });

    } catch (error) {
        console.error('Errore nel processo di pagamento:', error);
        res.status(500).json({ error: 'Errore nel processo di pagamento' });
    }
});

// Funzione per notificare l'amministratore
async function notifyAdmin(paymentId) {
    // Invia notifica su Telegram
    const message = `🆕 Nuovo pagamento da processare: ${paymentId}`;
    await bot.sendMessage(ADMIN_CHAT_ID, message);
}

// Funzione per inviare conferma del pagamento
async function sendPaymentConfirmation(payment) {
    // Implementa qui l'invio dell'email di conferma
    console.log(`Pagamento confermato per: ${payment.recipientName}`);
}

// API per ricevere richieste di pagamento
app.post('/api/request-payment', async (req, res) => {
    const { amount, taskType, userContact } = req.body;
    
    // Invia una email a te stesso con i dettagli del pagamento da ricevere
    sendEmailNotification({
        amount,
        taskType,
        userContact,
        iban: TUO_IBAN
    });

    res.json({ 
        status: 'success',
        iban: TUO_IBAN,
        message: 'Richiesta ricevuta. Effettua il bonifico per iniziare.'
    });
});

function sendEmailNotification(details) {
    // Implementa qui l'invio dell'email a te stesso
    console.log(`Nuova richiesta di pagamento: €${details.amount} da ${details.userContact}`);
}

// API per ottenere le opportunità di testing
app.get('/api/test-opportunities', async (req, res) => {
    try {
        // Recupera test da varie piattaforme
        const opportunities = await fetchAllOpportunities();
        res.json({ opportunities });
    } catch (error) {
        res.status(500).json({ error: 'Errore nel recupero delle opportunità' });
    }
});

async function fetchAllOpportunities() {
    // Recupera e combina i test da diverse piattaforme
    const [userTestingOps, testBirdsOps, uTestOps] = await Promise.all([
        fetchUserTestingOpportunities(),
        fetchTestBirdsOpportunities(),
        fetchUTestOpportunities()
    ]);

    return [...userTestingOps, ...testBirdsOps, ...uTestOps];
}

async function fetchUserTestingOpportunities() {
    // Implementa qui lo scraping da UserTesting
    return [
        {
            title: "Test E-commerce Site",
            platform: "UserTesting",
            payment: 10,
            duration: 20,
            difficulty: "Facile",
            description: "Valuta l'usabilità di un sito e-commerce",
            link: "https://www.usertesting.com/be-a-tester"
        }
    ];
}

async function fetchTestBirdsOpportunities() {
    // Implementa qui lo scraping da TestBirds
    return [
        {
            title: "Mobile App Testing",
            platform: "TestBirds",
            payment: 20,
            duration: 30,
            difficulty: "Media",
            description: "Test di una nuova app mobile",
            link: "https://www.testbirds.com/tester"
        }
    ];
}

async function fetchUTestOpportunities() {
    // Implementa qui lo scraping da uTest
    return [
        {
            title: "Website Functionality Test",
            platform: "uTest",
            payment: 15,
            duration: 25,
            difficulty: "Media",
            description: "Verifica funzionalità specifiche di un sito web",
            link: "https://www.utest.com/projects"
        }
    ];
}

// Gestisce le richieste di prelievo
app.post('/api/withdraw', async (req, res) => {
    const { amount } = req.body;
    
    if (amount < MINIMUM_PAYOUT) {
        return res.json({
            status: 'error',
            message: `Il minimo per il prelievo è €${MINIMUM_PAYOUT}`
        });
    }

    // Crea il pulsante PayPal per il prelievo
    const paypalButton = {
        business: PAYPAL_EMAIL,
        amount: amount,
        currency_code: 'EUR',
        item_name: 'Prelievo Guadagni Views',
        return_url: `${req.protocol}://${req.get('host')}/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
        ipn_url: `${req.protocol}://${req.get('host')}/ipn`
    };

    res.json({
        status: 'success',
        paypalButton
    });
});

// Gestisce le notifiche PayPal (IPN)
app.post('/ipn', (req, res) => {
    paypal.verify(req.body, {'allow_sandbox': true}, (err, msg) => {
        if (err) {
            console.error(err);
        } else {
            // Pagamento verificato
            const { payment_status, mc_gross, txn_id } = req.body;
            
            if (payment_status === 'Completed') {
                // Aggiorna il database con il pagamento completato
                updatePaymentStatus(txn_id, mc_gross);
            }
        }
    });
    
    res.sendStatus(200);
});

// Gestisce la pagina di watch
app.get('/watch/:trackingId/:videoId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

// API per tracciare le views
app.post('/api/track-view', async (req, res) => {
    const { trackingId, videoId } = req.body;
    
    try {
        // Verifica che la richiesta provenga dalla pagina di watch
        const referer = req.headers.referer || '';
        if (!referer.includes('/watch/')) {
            return res.status(403).json({ error: 'Invalid request' });
        }

        // Aggiorna le statistiche nel database
        await updateViewStats(trackingId);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ error: 'Error tracking view' });
    }
});

async function updateViewStats(trackingId) {
    // Qui implementa l'aggiornamento delle statistiche
    // Per ora usiamo localStorage sul client
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server attivo sulla porta ${PORT}`);
}); 