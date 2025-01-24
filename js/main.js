// Funzione per gestire il menu responsive
document.addEventListener('DOMContentLoaded', function() {
    console.log('Il sito è caricato!');
    // Configurazione iniziale
    let earnings = {
        total: 0,
        available: 0,
        history: []
    };

    // Carica i dati salvati
    loadSavedData();

    // Inizializza il grafico
    const ctx = document.getElementById('earnings-chart').getContext('2d');
    const earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Guadagni Giornalieri',
                data: [],
                borderColor: '#27ae60',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gestione del prelievo con PayPal
    document.getElementById('withdraw-button').addEventListener('click', function() {
        const availableAmount = parseFloat(document.getElementById('available-earnings').textContent.replace('€', ''));
        if (availableAmount >= 10) { // Minimo €10 per il prelievo
            initializePayPalButton(availableAmount);
            document.getElementById('paypal-button-container').style.display = 'block';
        } else {
            alert('Devi avere almeno €10 disponibili per effettuare un prelievo');
        }
    });

    function initializePayPalButton(amount) {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amount.toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Aggiorna i dati dopo il prelievo
                    earnings.available -= amount;
                    earnings.history.push({
                        date: new Date().toISOString(),
                        amount: -amount,
                        type: 'withdrawal'
                    });
                    updateDisplay();
                    saveData();
                    alert('Prelievo completato con successo!');
                });
            }
        }).render('#paypal-button-container');
    }

    // Simulazione di completamento task per test
    function completeTask(amount, type) {
        earnings.total += amount;
        earnings.available += amount;
        earnings.history.push({
            date: new Date().toISOString(),
            amount: amount,
            type: type
        });
        updateDisplay();
        saveData();
    }

    // Aggiorna la visualizzazione
    function updateDisplay() {
        document.getElementById('total-earnings').textContent = `€${earnings.total.toFixed(2)}`;
        document.getElementById('available-earnings').textContent = `€${earnings.available.toFixed(2)}`;
        updateChart();
        updateHistory();
    }

    // Aggiorna il grafico
    function updateChart() {
        const dailyEarnings = {};
        earnings.history.forEach(entry => {
            const date = entry.date.split('T')[0];
            if (entry.amount > 0) { // Solo guadagni, non prelievi
                dailyEarnings[date] = (dailyEarnings[date] || 0) + entry.amount;
            }
        });

        earningsChart.data.labels = Object.keys(dailyEarnings);
        earningsChart.data.datasets[0].data = Object.values(dailyEarnings);
        earningsChart.update();
    }

    // Aggiorna lo storico
    function updateHistory() {
        const historyContainer = document.getElementById('earnings-history');
        historyContainer.innerHTML = '';
        earnings.history.slice().reverse().forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const amount = entry.amount > 0 ? `+€${entry.amount.toFixed(2)}` : `-€${Math.abs(entry.amount).toFixed(2)}`;
            div.innerHTML = `
                <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
                <span class="type">${entry.type}</span>
                <span class="amount ${entry.amount > 0 ? 'positive' : 'negative'}">${amount}</span>
            `;
            historyContainer.appendChild(div);
        });
    }

    // Salva i dati
    function saveData() {
        localStorage.setItem('earningsData', JSON.stringify(earnings));
    }

    // Carica i dati salvati
    function loadSavedData() {
        const savedData = localStorage.getItem('earningsData');
        if (savedData) {
            earnings = JSON.parse(savedData);
            updateDisplay();
        }
    }

    // Aggiungi alcuni task di esempio
    addSampleTasks();

    // Gestione animazioni smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Sistema di notifiche per nuove opportunità
    function checkNewOpportunities() {
        // Simulazione di nuove opportunità
        setTimeout(() => {
            showNotification('Nuova opportunità di guadagno disponibile!');
        }, 5000);
    }

    function showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message);
        }
    }

    // Richiedi permesso per le notifiche
    if ('Notification' in window) {
        Notification.requestPermission();
    }

    checkNewOpportunities();

    // Recupera le opportunità di testing in tempo reale
    fetchTestOpportunities();
    
    // Aggiorna ogni 5 minuti
    setInterval(fetchTestOpportunities, 300000);
});

// Configurazione Stripe
const stripe = Stripe('your_publishable_key'); // Sostituisci con la tua chiave pubblica Stripe

function addSampleTasks() {
    const tasks = [
        { 
            title: 'Valutazione Siti Web',
            reward: 25.00,
            time: '1 ora',
            description: 'Analizza e valuta 5 siti web seguendo le linee guida fornite',
            taskId: 'task_web_eval'
        },
        { 
            title: 'Test Applicazioni Mobile',
            reward: 35.00,
            time: '1.5 ore',
            description: 'Testa funzionalità specifiche di 3 app e fornisci feedback dettagliato',
            taskId: 'task_app_test'
        },
        { 
            title: 'Analisi Contenuti',
            reward: 20.00,
            time: '45 min',
            description: 'Analizza e categorizza contenuti web secondo le specifiche',
            taskId: 'task_content_analysis'
        }
    ];

    const tasksContainer = document.getElementById('tasks-list');
    tasks.forEach(task => {
        const div = createTaskElement(task);
        tasksContainer.appendChild(div);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.innerHTML = `
        <h3>${task.title}</h3>
        <p class="task-description">${task.description}</p>
        <p class="task-reward">Ricompensa: €${task.reward.toFixed(2)}</p>
        <p class="task-time">Tempo stimato: ${task.time}</p>
        <button onclick="startTask('${task.taskId}', ${task.reward})" class="task-button">Inizia Task</button>
        <p class="task-note">Pagamento PayPal immediato su approvazione</p>
    `;
    return div;
}

async function startTask(taskId, reward) {
    try {
        // Prima verifica se l'utente ha configurato PayPal
        const paypalEmail = localStorage.getItem('paypalEmail');
        if (!paypalEmail) {
            showPayPalSetup();
            return;
        }

        showTaskForm(taskId, reward);
    } catch (error) {
        console.error('Errore nell\'avvio del task:', error);
        alert('Si è verificato un errore. Riprova più tardi.');
    }
}

function showPayPalSetup() {
    const modal = document.createElement('div');
    modal.className = 'task-modal';
    modal.innerHTML = `
        <div class="task-form">
            <h3>Configura PayPal per Ricevere Pagamenti</h3>
            <form id="paypalForm">
                <div class="form-group">
                    <label>Il tuo indirizzo email PayPal:</label>
                    <input type="email" required name="paypalEmail" placeholder="esempio@email.com">
                </div>
                <button type="submit" class="submit-button">Salva</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('paypalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.paypalEmail.value;
        localStorage.setItem('paypalEmail', email);
        modal.remove();
        alert('Email PayPal salvata con successo!');
    });
}

function showTaskForm(taskId, reward) {
    const modal = document.createElement('div');
    modal.className = 'task-modal';
    modal.innerHTML = `
        <div class="task-form">
            <h3>Completa il Task</h3>
            <form id="taskForm">
                <div class="form-group">
                    <label>Il tuo feedback:</label>
                    <textarea required name="feedback" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label>Screenshot del completamento:</label>
                    <input type="file" required name="proof">
                </div>
                <button type="submit" class="submit-button">Invia per Revisione</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('paypalEmail', localStorage.getItem('paypalEmail'));
        formData.append('reward', reward);
        await submitTask(taskId, formData);
        modal.remove();
    });
}

function showBankDetailsSetup() {
    const modal = document.createElement('div');
    modal.className = 'task-modal';
    modal.innerHTML = `
        <div class="task-form">
            <h3>Inserisci i tuoi dati bancari per ricevere i pagamenti</h3>
            <form id="bankForm">
                <div class="form-group">
                    <label>Nome completo intestatario:</label>
                    <input type="text" required name="accountName">
                </div>
                <div class="form-group">
                    <label>IBAN:</label>
                    <input type="text" required name="iban" pattern="[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}">
                </div>
                <div class="form-group">
                    <label>Nome banca:</label>
                    <input type="text" required name="bankName">
                </div>
                <button type="submit" class="submit-button">Salva</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('bankForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const bankDetails = {
            accountName: formData.get('accountName'),
            iban: formData.get('iban'),
            bankName: formData.get('bankName')
        };
        localStorage.setItem('bankDetails', JSON.stringify(bankDetails));
        modal.remove();
        alert('Dati bancari salvati con successo!');
    });
}

async function submitTask(taskId, formData) {
    try {
        const bankDetails = localStorage.getItem('bankDetails');
        if (!bankDetails) {
            showBankDetailsSetup();
            return;
        }

        formData.append('bankDetails', bankDetails);
        const response = await fetch('/api/submit-task', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`Task completato! Il bonifico di €${result.amount} verrà processato entro 24 ore.`);
            updateEarnings(result.amount);
            startPaymentStatusCheck(result.paymentId);
        } else {
            alert(result.message || 'Si è verificato un errore. Riprova più tardi.');
        }
    } catch (error) {
        console.error('Errore nel completamento del task:', error);
        alert('Si è verificato un errore. Contatta il supporto.');
    }
}

function startPaymentStatusCheck(paymentId) {
    const checkStatus = async () => {
        try {
            const response = await fetch(`/api/payment-status/${paymentId}`);
            const result = await response.json();
            
            if (result.status === 'completed') {
                alert(`Il bonifico di €${result.amount} è stato inviato con successo!`);
                return;
            }
            
            // Controlla di nuovo tra 1 ora
            setTimeout(checkStatus, 3600000);
        } catch (error) {
            console.error('Errore nel controllo dello stato del pagamento:', error);
        }
    };

    checkStatus();
}

function requestService(serviceType, amount) {
    const userEmail = prompt("Inserisci la tua email per essere contattato:");
    if (!userEmail) return;

    fetch('/api/request-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount,
            taskType: serviceType,
            userContact: userEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(`Per procedere, effettua un bonifico di €${amount} a questo IBAN:\n\n${data.iban}\n\nVerrai contattato appena ricevuto il pagamento.`);
        } else {
            alert('Errore: ' + data.error);
        }
    })
    .catch(error => {
        alert('Errore nella richiesta');
        console.error('Errore:', error);
    });
}

function fetchTestOpportunities() {
    fetch('/api/test-opportunities')
        .then(response => response.json())
        .then(data => {
            updateTestList(data.opportunities);
            updateStats(data.opportunities);
        })
        .catch(error => console.error('Errore:', error));
}

function updateTestList(opportunities) {
    const container = document.getElementById('testList');
    container.innerHTML = '';

    opportunities.forEach(opp => {
        const card = createOpportunityCard(opp);
        container.appendChild(card);
    });
}

function createOpportunityCard(opp) {
    const div = document.createElement('div');
    div.className = 'opportunity-card';
    div.innerHTML = `
        <div class="card-header">
            <h3>${opp.title}</h3>
            <span class="payment">€${opp.payment.toFixed(2)}</span>
        </div>
        <p class="platform">${opp.platform}</p>
        <p class="description">${opp.description}</p>
        <div class="details">
            <span class="time">⏱️ ${opp.duration} minuti</span>
            <span class="difficulty">📊 ${opp.difficulty}</span>
        </div>
        <a href="${opp.link}" target="_blank" class="test-button">Inizia Test</a>
    `;
    return div;
}

function updateStats(opportunities) {
    const activeTests = opportunities.length;
    const potentialEarnings = opportunities.reduce((sum, opp) => sum + opp.payment, 0);
    
    document.getElementById('activeTests').textContent = activeTests;
    document.getElementById('potentialEarnings').textContent = `€${potentialEarnings.toFixed(2)}`;
}

// Configurazione
const RATE_PER_VIEW = 0.001; // €0.001 per view

function generateTrackingLink() {
    const youtubeUrl = document.getElementById('urlInput').value;
    if (!isValidYoutubeUrl(youtubeUrl)) {
        alert('Inserisci un URL valido di YouTube');
        return;
    }

    // Estrai l'ID del video da YouTube
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
        alert('URL YouTube non valido');
        return;
    }

    // Crea un link di tracking unico
    const trackingId = generateUniqueId();
    const trackingUrl = `${window.location.origin}/watch/${trackingId}/${videoId}`;

    // Salva il link nel localStorage
    saveTrackingLink(trackingId, youtubeUrl, videoId);

    // Aggiorna l'interfaccia
    addLinkToList({
        id: trackingId,
        originalUrl: youtubeUrl,
        trackingUrl: trackingUrl,
        views: 0,
        earnings: 0
    });

    document.getElementById('urlInput').value = '';
}

function isValidYoutubeUrl(url) {
    return url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
}

function extractYoutubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function generateUniqueId() {
    return 'yt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveTrackingLink(trackingId, originalUrl, videoId) {
    const links = JSON.parse(localStorage.getItem('trackingLinks') || '{}');
    links[trackingId] = {
        originalUrl,
        videoId,
        views: 0,
        earnings: 0,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('trackingLinks', JSON.stringify(links));
}

function addLinkToList(linkData) {
    const container = document.getElementById('linksList');
    const div = document.createElement('div');
    div.className = 'link-card';
    div.innerHTML = `
        <div class="link-info">
            <p class="original-url">Video: ${linkData.originalUrl}</p>
            <p class="tracking-url">Link di tracking: ${linkData.trackingUrl}</p>
            <button onclick="copyToClipboard('${linkData.trackingUrl}')">Copia Link</button>
        </div>
        <div class="link-stats">
            <p>Views: ${linkData.views}</p>
            <p>Guadagno: €${linkData.earnings.toFixed(3)}</p>
        </div>
    `;
    container.appendChild(div);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copiato negli appunti!');
    });
}

// Simula le views (per test)
setInterval(() => {
    const links = JSON.parse(localStorage.getItem('trackingLinks') || '{}');
    Object.keys(links).forEach(trackingId => {
        // Simula 0-2 nuove views ogni 30 secondi
        const newViews = Math.floor(Math.random() * 3);
        if (newViews > 0) {
            links[trackingId].views += newViews;
            links[trackingId].earnings += newViews * RATE_PER_VIEW;
        }
    });
    localStorage.setItem('trackingLinks', JSON.stringify(links));
    updateStats();
}, 30000);

function updateStats() {
    const links = JSON.parse(localStorage.getItem('trackingLinks') || '{}');
    const totalViews = Object.values(links).reduce((sum, link) => sum + link.views, 0);
    const totalEarnings = Object.values(links).reduce((sum, link) => sum + link.earnings, 0);

    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalEarnings').textContent = `€${totalEarnings.toFixed(3)}`;

    // Aggiorna la lista dei link
    const container = document.getElementById('linksList');
    container.innerHTML = '';
    Object.entries(links).forEach(([trackingId, linkData]) => {
        addLinkToList({
            id: trackingId,
            originalUrl: linkData.originalUrl,
            trackingUrl: `${window.location.origin}/watch/${trackingId}/${linkData.videoId}`,
            views: linkData.views,
            earnings: linkData.earnings
        });
    });
}

// Inizializza le statistiche
document.addEventListener('DOMContentLoaded', updateStats);

// Gestione prelievi
async function requestWithdraw() {
    const currentEarnings = parseFloat(document.getElementById('totalEarnings').textContent.replace('€', ''));
    
    if (currentEarnings < 5) {
        alert('Devi avere almeno €5 per effettuare un prelievo');
        return;
    }

    try {
        const response = await fetch('/api/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: currentEarnings
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            // Crea il form PayPal
            createPayPalForm(data.paypalButton);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nella richiesta di prelievo');
    }
}

function createPayPalForm(paypalData) {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = 'https://www.paypal.com/cgi-bin/webscr';

    // Aggiungi i campi PayPal necessari
    Object.entries(paypalData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    // Aggiungi il pulsante di submit
    const submit = document.createElement('input');
    submit.type = 'submit';
    submit.value = 'Procedi al Prelievo';
    submit.className = 'withdraw-button';
    form.appendChild(submit);

    // Mostra il form
    const container = document.createElement('div');
    container.className = 'withdraw-container';
    container.appendChild(form);
    document.body.appendChild(container);
}

// Aggiorna il tracciamento delle views
function trackView(linkId) {
    fetch('/api/track-view', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            linkId,
            referrer: document.referrer
        })
    });
} 