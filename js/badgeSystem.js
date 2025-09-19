// Badge data based on the provided document
const BADGES = [
    { 
        id: 'novice',
        name: { 'en': 'Novice', 'pt': 'Novato', 'fr': 'Novice', 'zu': 'Umqali' },
        icon: 'fa-seedling',
        color: '#28a745',
        pointsRequired: 0,
        description: {
            'en': 'Welcome! You\'re just starting your journey.',
            'pt': 'Bem-vindo! Você está apenas começando sua jornada.',
            'fr': 'Bienvenue ! Vous commencez tout juste votre aventure.',
            'zu': 'Wamkelekile! Usandaqala uhambo lwakho.'
        }
    },
    { 
        id: 'beginner',
        name: { 'en': 'Beginner', 'pt': 'Iniciante', 'fr': 'Débutant', 'zu': 'Uqalayo' },
        icon: 'fa-star',
        color: '#17a2b8',
        pointsRequired: 100,
        description: {
            'en': 'You\'ve taken your first steps! Keep going to unlock more features.',
            'pt': 'Você deu os primeiros passos! Continue para desbloquear mais recursos.',
            'fr': 'Vous avez fait vos premiers pas ! Continuez pour débloquer plus de fonctionnalités.',
            'zu': 'Uthathe izinyathelo zakho zokuqala! Qhubeka ukuvula izici ezengeziwe.'
        }
    },
    { 
        id: 'intermediate',
        name: { 'en': 'Intermediate', 'pt': 'Intermediário', 'fr': 'Intermédiaire', 'zu': 'Ophakathi' },
        icon: 'fa-medal',
        color: '#6f42c1',
        pointsRequired: 500,
        description: {
            'en': 'You\'re becoming a pro at managing your documents.',
            'pt': 'Você está se tornando um profissional em gerenciar seus documentos.',
            'fr': 'Vous devenez un pro de la gestion de vos documents.',
            'zu': 'Uyaba nguchwepheshe ekulawuleni amadokhumenti akho.'
        }
    },
    { 
        id: 'advanced',
        name: { 'en': 'Advanced', 'pt': 'Avançado', 'fr': 'Avancé', 'zu': 'Othuthukile' },
        icon: 'fa-trophy',
        color: '#fd7e14',
        pointsRequired: 1000,
        description: {
            'en': 'Your dedication is impressive! You\'re now among our most active users.',
            'pt': 'Sua dedicação é impressionante! Agora você está entre nossos usuários mais ativos.',
            'fr': 'Votre dévouement est impressionnant ! Vous faites maintenant partie de nos utilisateurs les plus actifs.',
            'zu': 'Ukuzinikela kwakho kuyamangalisa! Manje usomunye wabasebenzisi abasebenzayo kakhulu.'
        }
    },
    { 
        id: 'master',
        name: { 'en': 'Master', 'pt': 'Mestre', 'fr': 'Maître', 'zu': 'Ungcwele' },
        icon: 'fa-crown',
        color: '#ffc107',
        pointsRequired: 2500,
        description: {
            'en': 'You\'ve mastered document management! Your contributions are invaluable.',
            'pt': 'Você dominou o gerenciamento de documentos! Suas contribuições são inestimáveis.',
            'fr': 'Vous maîtrisez la gestion des documents ! Vos contributions sont inestimables.',
            'zu': 'Uyikhonziwe ukulawulwa kwamadokhumenti! Iminikelo yakho ayinathenwa.'
        }
    },
    { 
        id: 'legend',
        name: { 'en': 'Legend', 'pt': 'Lenda', 'fr': 'Légende', 'zu': 'Inganekwane' },
        icon: 'fa-award',
        color: '#dc3545',
        pointsRequired: 5000,
        description: {
            'en': 'The highest honor! You\'re a true legend of FindMyDocument.',
            'pt': 'A maior honra! Você é uma verdadeira lenda do FindMyDocument.',
            'fr': 'Le plus grand honneur ! Vous êtes une véritable légende de FindMyDocument.',
            'zu': 'Inhlonipho ephezulu! Uyisibonakaliso sangempela se-FindMyDocument.'
        }
    }
];

// Activity points configuration
const ACTIVITY_POINTS = {
    document_upload: 100,
    document_verified: 50,
    document_returned: 200,
    profile_completed: 50,
    daily_login: 10,
    referred_user: 150,
    document_found: 100,
    help_provided: 200
};

// Get current badge based on points
function getCurrentBadge(points, language = 'pt') {
    let currentBadge = BADGES[0];
    
    for (const badge of BADGES) {
        if (points >= badge.pointsRequired) {
            currentBadge = badge;
        } else {
            break;
        }
    }
    
    // Get localized badge info
    return {
        ...currentBadge,
        name: currentBadge.name[language] || currentBadge.name['pt'],
        description: currentBadge.description[language] || currentBadge.description['pt']
    };
}

// Get next badge
function getNextBadge(points, language = 'pt') {
    const currentBadge = getCurrentBadge(points, language);
    const currentIndex = BADGES.findIndex(b => b.id === currentBadge.id);
    
    if (currentIndex < BADGES.length - 1) {
        const nextBadge = BADGES[currentIndex + 1];
        return {
            ...nextBadge,
            name: nextBadge.name[language] || nextBadge.name['pt'],
            description: nextBadge.description[language] || nextBadge.description['pt']
        };
    }
    
    return null;
}

// Calculate progress to next badge
function calculateBadgeProgress(points) {
    const currentBadge = getCurrentBadge(points);
    const nextBadge = getNextBadge(points);
    
    if (!nextBadge) return 100; // Max level reached
    
    const pointsInCurrentLevel = points - currentBadge.pointsRequired;
    const pointsNeeded = nextBadge.pointsRequired - currentBadge.pointsRequired;
    
    return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeeded) * 100));
}

// Render badge component
function renderBadge(points, containerId = 'badge-container', language = 'pt') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const currentBadge = getCurrentBadge(points, language);
    const nextBadge = getNextBadge(points, language);
    const progress = calculateBadgeProgress(points);
    
    container.innerHTML = `
        <div class="badge-container">
            <div class="badge-icon" style="color: ${currentBadge.color};">
                <i class="fas ${currentBadge.icon} fa-3x"></i>
            </div>
            <h3 class="badge-name" style="color: ${currentBadge.color};">${currentBadge.name}</h3>
            <p class="badge-description">${currentBadge.description}</p>
            
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%; background-color: ${currentBadge.color};"></div>
            </div>
            
            <div class="points-info">
                <span class="current-points">${points.toLocaleString()}</span>
                <span class="divider">/</span>
                <span class="next-level-points">${
                    nextBadge 
                        ? nextBadge.pointsRequired.toLocaleString() 
                        : currentBadge.pointsRequired.toLocaleString()
                }</span>
                <span class="points-label">${getTranslatedText('points', language)}</span>
            </div>
            
            ${nextBadge ? 
                `<div class="next-badge">
                    ${getTranslatedText('next_level', language)}: <strong>${nextBadge.name}</strong>
                </div>` 
                : ''
            }
        </div>
    `;
}

// Helper function to get translated text
function getTranslatedText(key, language = 'pt') {
    const translations = {
        points: { 'en': 'points', 'pt': 'pontos', 'fr': 'points', 'zu': 'amaphuzu' },
        next_level: { 'en': 'Next level', 'pt': 'Próximo nível', 'fr': 'Niveau suivant', 'zu': 'Izinga elilandelayo' }
    };
    
    return (translations[key] && translations[key][language]) || translations[key]['pt'] || key;
}

// Initialize badge system
function initBadgeSystem(userPoints = 0, containerId = 'badge-container', language = 'pt') {
    // Ensure the container exists
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[Badge] Container with ID '${containerId}' not found`);
        return null;
    }
    
    // Add styles if not already added
    if (!document.getElementById('badge-styles')) {
        const style = document.createElement('style');
        style.id = 'badge-styles';
        style.textContent = `
            .badge-container {
                text-align: center;
                padding: 1.5rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 300px;
                margin: 0 auto;
            }
            
            .badge-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                transition: transform 0.3s ease;
            }
            
            .badge-icon:hover {
                transform: scale(1.1);
            }
            
            .badge-name {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0.5rem 0;
            }
            
            .badge-description {
                font-size: 0.875rem;
                color: #666;
                margin-bottom: 1.25rem;
                min-height: 3.5rem;
            }
            
            .progress-container {
                width: 100%;
                height: 8px;
                background-color: #f0f0f0;
                border-radius: 4px;
                margin: 1rem 0;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                transition: width 0.5s ease;
            }
            
            .points-info {
                font-size: 0.875rem;
                color: #555;
                margin: 0.5rem 0;
            }
            
            .current-points {
                font-weight: 700;
                color: #333;
            }
            
            .next-level-points {
                font-weight: 600;
                color: #333;
            }
            
            .next-badge {
                font-size: 0.8rem;
                color: #666;
                margin-top: 0.75rem;
                padding-top: 0.75rem;
                border-top: 1px solid #eee;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Render the badge
    renderBadge(userPoints, containerId, language);
    
    // Return functions to update the badge
    return {
        updatePoints: (newPoints) => {
            renderBadge(newPoints, containerId, language);
        },
        changeLanguage: (newLanguage) => {
            language = newLanguage;
            renderBadge(userPoints, containerId, language);
        }
    };
}

// Create BadgeSystem class
class BadgeSystem {
    constructor(initialPoints = 0, containerId = 'badge-container', language = 'pt') {
        this.points = initialPoints;
        this.containerId = containerId;
        this.language = language;
        
        // Initialize the badge
        this.init();
    }
    
    init() {
        // Render the initial badge
        this.render();
        
        // Listen for points updates
        document.addEventListener('pointsUpdated', (event) => {
            this.updatePoints(event.detail.points);
        });
    }
    
    updatePoints(points) {
        this.points = points;
        this.render();
    }
    
    changeLanguage(newLanguage) {
        this.language = newLanguage;
        this.render();
    }
    
    render() {
        const currentBadge = getCurrentBadge(this.points, this.language);
        const nextBadge = getNextBadge(this.points, this.language);
        const progress = calculateBadgeProgress(this.points);
        
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="badge-container">
                <div class="badge-icon" style="color: ${currentBadge.color};">
                    <i class="fas ${currentBadge.icon} fa-3x"></i>
                </div>
                <h3 class="badge-name" style="color: ${currentBadge.color};">${currentBadge.name}</h3>
                <p class="badge-description">${currentBadge.description}</p>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%; background-color: ${currentBadge.color};"></div>
                </div>
                
                <div class="points-info">
                    <span class="current-points">${this.points.toLocaleString()}</span>
                    <span class="divider">/</span>
                    <span class="next-level-points">${
                        nextBadge 
                            ? nextBadge.pointsRequired.toLocaleString() 
                            : currentBadge.pointsRequired.toLocaleString()
                    }</span>
                    <span class="points-label">${getTranslatedText('points', this.language)}</span>
                </div>
                
                ${nextBadge ? 
                    `<div class="next-badge">
                        ${getTranslatedText('next_level', this.language)}: <strong>${nextBadge.name}</strong>
                    </div>` 
                    : ''
                }
            </div>
        `;
    }
}

// Initialize badge system function
function initBadgeSystem(initialPoints = 0, containerId = 'badge-container', language = 'pt') {
    return new BadgeSystem(initialPoints, containerId, language);
}

// Make functions available globally
window.BadgeSystem = {
    BADGES,
    ACTIVITY_POINTS,
    getCurrentBadge,
    getNextBadge,
    calculateBadgeProgress,
    renderBadge,
    initBadgeSystem,
    BadgeSystem
};

// Auto-initialize if data-badge-container attribute is present
document.addEventListener('DOMContentLoaded', () => {
    const badgeContainers = document.querySelectorAll('[data-badge-container]');
    badgeContainers.forEach(container => {
        const initialPoints = parseInt(container.getAttribute('data-initial-points') || '0', 10);
        const language = container.getAttribute('data-language') || 'pt';
        
        // Initialize badge system for this container
        container.id = container.id || `badge-container-${Math.random().toString(36).substr(2, 9)}`;
        window[`badgeSystem_${container.id}`] = new BadgeSystem(initialPoints, container.id, language);
    });
});
