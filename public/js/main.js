// Configura l'URL base dell'API in base all'ambiente
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://tua-app.onrender.com';

async function submitTask(taskId, formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/submit-task`, {
            method: 'POST',
            body: formData
        });
        // ... resto del codice
    } catch (error) {
        console.error('Errore:', error);
    }
} 