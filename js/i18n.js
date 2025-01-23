// Sistema di traduzione multilingua
const translations = {
    it: {
        nav: {
            home: 'Home',
            menu: 'Menu',
            book: 'Prenota',
            about: 'Chi Siamo',
            gallery: 'Galleria',
            news: 'News',
            reviews: 'Recensioni',
            contact: 'Contatti'
        },
        hero: {
            title: 'La Cucina di Maria',
            subtitle: 'Tradizione italiana nel cuore di Milano',
            cta: 'Prenota un Tavolo'
        },
        menu: {
            title: 'Il Nostro Menu',
            categories: {
                antipasti: 'Antipasti',
                primi: 'Primi Piatti',
                secondi: 'Secondi Piatti',
                dolci: 'Dolci'
            },
            items: {
                bruschette: {
                    title: 'Bruschette al Pomodoro',
                    description: 'Pane tostato con pomodorini freschi, basilico e olio extra vergine'
                },
                carpaccio: {
                    title: 'Carpaccio di Manzo',
                    description: 'Sottili fette di manzo con rucola e scaglie di parmigiano'
                }
                // ... altri piatti
            }
        },
        booking: {
            title: 'Prenota un Tavolo',
            form: {
                name: 'Nome e Cognome',
                email: 'Email',
                phone: 'Telefono',
                date: 'Data',
                time: 'Ora',
                guests: 'Numero di Persone',
                notes: 'Note speciali',
                submit: 'Conferma Prenotazione'
            }
        },
        about: {
            title: 'La Nostra Storia',
            description: 'Dal 1985, La Cucina di Maria porta avanti la tradizione della vera cucina italiana nel cuore di Milano.',
            chef: {
                title: 'Il Nostro Chef',
                description: 'Lo Chef Marco Rossi, con oltre 20 anni di esperienza nella cucina tradizionale italiana.'
            }
        }
    },
    en: {
        nav: {
            home: 'Home',
            menu: 'Menu',
            book: 'Book',
            about: 'About Us',
            gallery: 'Gallery',
            news: 'News',
            reviews: 'Reviews',
            contact: 'Contact'
        },
        hero: {
            title: 'La Cucina di Maria',
            subtitle: 'Italian tradition in the heart of Milan',
            cta: 'Book a Table'
        },
        menu: {
            title: 'Our Menu',
            categories: {
                antipasti: 'Starters',
                primi: 'First Courses',
                secondi: 'Main Courses',
                dolci: 'Desserts'
            },
            items: {
                bruschette: {
                    title: 'Tomato Bruschetta',
                    description: 'Toasted bread with fresh cherry tomatoes, basil and extra virgin olive oil'
                },
                carpaccio: {
                    title: 'Beef Carpaccio',
                    description: 'Thin slices of beef with rocket and parmesan shavings'
                }
                // ... altri piatti
            }
        },
        booking: {
            title: 'Book a Table',
            form: {
                name: 'Full Name',
                email: 'Email',
                phone: 'Phone',
                date: 'Date',
                time: 'Time',
                guests: 'Number of Guests',
                notes: 'Special Notes',
                submit: 'Confirm Booking'
            }
        },
        about: {
            title: 'Our Story',
            description: 'Since 1985, La Cucina di Maria has been carrying forward the tradition of authentic Italian cuisine in the heart of Milan.',
            chef: {
                title: 'Our Chef',
                description: 'Chef Marco Rossi, with over 20 years of experience in traditional Italian cuisine.'
            }
        }
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'it';
        this.init();
    }

    init() {
        this.updateLanguage(this.currentLang);
        this.bindLanguageSelector();
        document.documentElement.lang = this.currentLang;
    }

    updateLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        this.translatePage();
        this.updateCurrentLanguageButton(lang);
        this.updateMetaTags(lang);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            const translation = this.getTranslation(key);
            if (translation) {
                element.alt = translation;
            }
        });
    }

    getTranslation(key) {
        return key.split('.').reduce((obj, i) => obj ? obj[i] : null, translations[this.currentLang]);
    }

    bindLanguageSelector() {
        document.querySelectorAll('.lang-selector').forEach(button => {
            button.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.updateLanguage(lang);
            });
        });
    }

    updateCurrentLanguageButton(lang) {
        const currentLangBtn = document.querySelector('.lang-btn');
        const flagImg = currentLangBtn.querySelector('img');
        const langText = currentLangBtn.querySelector('span');
        
        flagImg.src = `img/flags/${lang}.svg`;
        flagImg.alt = lang === 'it' ? 'Italiano' : 'English';
        langText.textContent = lang.toUpperCase();
    }

    updateMetaTags(lang) {
        const metaTags = {
            it: {
                title: 'La Cucina di Maria - Ristorante Tradizionale Milano',
                description: 'Ristorante tradizionale italiano nel cuore di Milano. Scopri i nostri piatti della tradizione e prenota il tuo tavolo online.',
                keywords: 'ristorante milano, cucina italiana, prenotazione ristorante, ristorante tradizionale'
            },
            en: {
                title: 'La Cucina di Maria - Traditional Restaurant Milan',
                description: 'Traditional Italian restaurant in the heart of Milan. Discover our traditional dishes and book your table online.',
                keywords: 'milan restaurant, italian cuisine, restaurant booking, traditional restaurant'
            }
        };

        document.title = metaTags[lang].title;
        document.querySelector('meta[name="description"]').setAttribute('content', metaTags[lang].description);
        document.querySelector('meta[name="keywords"]').setAttribute('content', metaTags[lang].keywords);
    }
}

// Inizializza il sistema multilingua
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});

// Funzione helper per ottenere traduzioni nei file JS
function t(key) {
    return window.i18n.getTranslation(key);
}

// Gestione SEO multilingua
function updateMetaTags(lang) {
    const metaTags = {
        it: {
            title: 'La Cucina di Maria - Ristorante Tradizionale Milano',
            description: 'Ristorante tradizionale italiano nel cuore di Milano. Scopri i nostri piatti della tradizione e prenota il tuo tavolo online.',
            keywords: 'ristorante milano, cucina italiana, prenotazione ristorante, ristorante tradizionale'
        },
        en: {
            title: 'La Cucina di Maria - Traditional Restaurant Milan',
            description: 'Traditional Italian restaurant in the heart of Milan. Discover our traditional dishes and book your table online.',
            keywords: 'milan restaurant, italian cuisine, restaurant booking, traditional restaurant'
        }
    };

    document.title = metaTags[lang].title;
    document.querySelector('meta[name="description"]').setAttribute('content', metaTags[lang].description);
    document.querySelector('meta[name="keywords"]').setAttribute('content', metaTags[lang].keywords);
}

// Aggiungi questa funzione per aggiornare l'icona della lingua corrente
function updateCurrentLanguageButton(lang) {
    const currentLangBtn = document.querySelector('.lang-btn');
    const flagImg = currentLangBtn.querySelector('img');
    const langText = currentLangBtn.querySelector('span');
    
    flagImg.src = `img/flags/${lang}.svg`;
    flagImg.alt = lang === 'it' ? 'Italiano' : 'English';
    langText.textContent = lang.toUpperCase();
} 