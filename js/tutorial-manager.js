// Interactive Tutorial System for FindMyDocs
class TutorialManager {
    constructor() {
        this.tutorials = new Map();
        this.currentTutorial = null;
        this.currentStep = 0;
        this.isActive = false;
        this.userProgress = new Map();
        
        this.initializeTutorials();
        this.ensureStyles();
        this.loadUserProgress();
    }

    /**
     * Initialize available tutorials
     */
    initializeTutorials() {
        // Main app tutorial
        this.tutorials.set('main', {
            id: 'main',
            title: 'Bem-vindo ao FindMyDocs!',
            description: 'Aprenda a usar as principais funcionalidades',
            steps: [
                {
                    id: 'welcome',
                    title: 'Bem-vindo ao FindMyDocs!',
                    content: 'Bem-vindo ao sistema de documentos perdidos e encontrados! Vamos conhecer todas as funcionalidades disponíveis para você.',
                    target: null,
                    position: 'center',
                    action: 'next'
                },
                {
                    id: 'navigation',
                    title: 'Menu Principal',
                    content: 'Na parte superior, você encontra o menu principal com todas as seções importantes do sistema.',
                    target: 'nav.main-nav',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'profile',
                    title: 'Seu Perfil',
                    content: 'Aqui você pode acessar seu perfil, ver seus pontos, nível e gerenciar suas configurações pessoais.',
                    target: '#profile-section',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'documents',
                    title: 'Feed de Documentos',
                    content: 'Nesta seção central, você visualiza todos os documentos perdidos e encontrados. Use os filtros para refinar sua busca.',
                    target: '[data-section="feed"]',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'search',
                    title: 'Busca Avançada',
                    content: 'Use a barra de pesquisa para encontrar documentos específicos por nome, número ou tipo.',
                    target: '#search-input',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'upload',
                    title: 'Adicionar Documento',
                    content: 'Clique aqui para reportar um documento perdido ou encontrado. Você pode fazer upload de fotos e adicionar detalhes importantes.',
                    target: '#add-document',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'notifications',
                    title: 'Notificações',
                    content: 'Fique atento às notificações sobre documentos encontrados, mensagens e atualizações importantes.',
                    target: '#notifications-section',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'points',
                    title: 'Sistema de Pontos',
                    content: 'Ganhe pontos ao ajudar outras pessoas, reportar documentos e manter seu perfil atualizado. Acompanhe seu progresso aqui.',
                    target: '#points-container',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'help',
                    title: 'Ajuda',
                    content: 'Se precisar de ajuda, você pode reiniciar este tutorial a qualquer momento através do menu de ajuda.',
                    target: '#help-section',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'report-lost',
                    title: 'Reportar Perda',
                    content: 'Use esta seção para reportar quando perder um documento. Quanto mais rápido reportar, maiores as chances de recuperação.',
                    target: '[data-section="relatar-perda"]',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'report-found',
                    title: 'Reportar Encontrado',
                    content: 'Encontrou um documento? Use esta seção para reportar e ajudar o dono a recuperá-lo.',
                    target: '[data-section="relatar-encontrado"]',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'profile',
                    title: 'Seu Perfil',
                    content: 'Gerencie seu perfil, veja seus pontos e estatísticas aqui.',
                    target: '[data-section="perfil"]',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'notifications',
                    title: 'Notificações',
                    content: 'Receba notificações quando seus documentos forem encontrados ou quando houver correspondências.',
                    target: '[data-section="notificacoes"]',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'complete',
                    title: 'Tutorial Concluído!',
                    content: 'Parabéns! Você agora conhece as principais funcionalidades do FindMyDocs. Comece adicionando seu primeiro documento!',
                    target: null,
                    position: 'center',
                    action: 'complete'
                }
            ]
        });

        // Document upload tutorial
        this.tutorials.set('upload', {
            id: 'upload',
            title: 'Como Adicionar Documentos',
            description: 'Aprenda a fazer upload de documentos de forma segura',
            steps: [
                {
                    id: 'upload-intro',
                    title: 'Upload de Documentos',
                    content: 'Vamos aprender como adicionar documentos de forma segura e eficiente.',
                    target: null,
                    position: 'center',
                    action: 'next'
                },
                {
                    id: 'document-type',
                    title: 'Tipo de Documento',
                    content: 'Selecione o tipo de documento que você está adicionando. Isso ajuda na organização e busca.',
                    target: '#document-type',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'document-title',
                    title: 'Título do Documento',
                    content: 'Dê um título descritivo ao seu documento. Exemplo: "BI de João Silva".',
                    target: '#document-title',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'document-number',
                    title: 'Número do Documento',
                    content: 'Digite o número do documento. Este número será usado para encontrar correspondências.',
                    target: '#document-number',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'file-upload',
                    title: 'Upload do Arquivo',
                    content: 'Arraste e solte sua foto aqui ou clique para selecionar. Formatos aceitos: JPG, PNG, PDF.',
                    target: '#drop-zone',
                    position: 'top',
                    action: 'highlight'
                },
                {
                    id: 'privacy-tip',
                    title: 'Dica de Privacidade',
                    content: 'Importante: Cubra ou desfoque informações sensíveis antes de fazer upload. O sistema adiciona uma marca d\'água automaticamente.',
                    target: null,
                    position: 'center',
                    action: 'tip'
                },
                {
                    id: 'submit',
                    title: 'Enviar Documento',
                    content: 'Clique aqui para enviar seu documento. Você ganhará pontos por adicionar documentos!',
                    target: '#submit-document',
                    position: 'top',
                    action: 'highlight'
                }
            ]
        });

        // Search tutorial
        this.tutorials.set('search', {
            id: 'search',
            title: 'Como Pesquisar Documentos',
            description: 'Aprenda a usar a pesquisa avançada',
            steps: [
                {
                    id: 'search-intro',
                    title: 'Pesquisa Avançada',
                    content: 'Aprenda a encontrar documentos usando nossa pesquisa inteligente.',
                    target: null,
                    position: 'center',
                    action: 'next'
                },
                {
                    id: 'search-bar',
                    title: 'Barra de Pesquisa',
                    content: 'Digite palavras-chave para pesquisar. A pesquisa funciona em títulos, descrições e números de documento.',
                    target: '#search-input',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'filters',
                    title: 'Filtros',
                    content: 'Use os filtros para refinar sua pesquisa por tipo, status, localização e data.',
                    target: '.feed-filters',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'saved-searches',
                    title: 'Pesquisas Salvas',
                    content: 'Salve suas pesquisas favoritas para usar novamente rapidamente.',
                    target: '#saved-searches',
                    position: 'bottom',
                    action: 'highlight'
                }
            ]
        });
    }

    /**
     * Start a tutorial
     * @param {string} tutorialId - ID of the tutorial to start
     * @param {boolean} force - Force start even if already completed
     */
    startTutorial(tutorialId, force = false) {
        const tutorial = this.tutorials.get(tutorialId);
        if (!tutorial) {
            console.error(`Tutorial ${tutorialId} not found`);
            return;
        }

        // Check if tutorial already completed
        if (!force && this.isTutorialCompleted(tutorialId)) {
            console.log(`Tutorial ${tutorialId} already completed`);
            return;
        }

        this.currentTutorial = tutorial;
        this.currentStep = 0;
        this.isActive = true;

        // Use popup tutorial instead of modal
        this.startPopupTutorial();
    }

    /**
     * Start popup tutorial (replaces modal)
     */
    startPopupTutorial() {
        this.showStep(0);
    }

    /**
     * Inject minimal styles for tutorial UI if not already present
     */
    ensureStyles() {
        if (document.getElementById('tutorial-styles')) return;
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-popup{position:fixed;z-index:10000;max-width:300px;background:var(--card-bg, #fff);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid var(--border-color, #e0e0e0);}
            .tutorial-popup-content{display:flex;flex-direction:column;}
            .tutorial-popup-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color, #eee);}
            .tutorial-popup-header h4{margin:0;font-size:1rem;color:var(--text-color, #222);}
            .tutorial-popup-close{background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted, #666);padding:4px;}
            .tutorial-popup-body{padding:12px 16px;}
            .tutorial-popup-body p{margin:0 0 8px 0;color:var(--text-color, #222);font-size:0.9rem;line-height:1.4;}
            .tutorial-popup-progress{text-align:center;font-size:0.8rem;color:var(--text-muted, #666);}
            .tutorial-popup-footer{display:flex;gap:6px;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--border-color, #eee);}
            .tutorial-popup-footer button{background:var(--primary-color, #007bff);color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem;display:flex;align-items:center;gap:4px;}
            .tutorial-popup-footer button:disabled{background:var(--text-muted, #ccc);cursor:not-allowed;}
            .tutorial-popup-prev{background:var(--text-muted, #666);}
            .tutorial-popup-skip{background:var(--text-muted, #666);}
            .tutorial-highlight{position:fixed;z-index:9998;pointer-events:none;border:2px solid var(--primary-color, #007bff);border-radius:8px;box-shadow:0 0 0 4px rgba(0,123,255,0.2);animation:tutorial-pulse 2s infinite;}
            @keyframes tutorial-pulse{0%{box-shadow:0 0 0 4px rgba(0,123,255,0.2);}50%{box-shadow:0 0 0 8px rgba(0,123,255,0.1);}100%{box-shadow:0 0 0 4px rgba(0,123,255,0.2);}}
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup popup event listeners
     */
    setupPopupEventListeners() {
        const popup = document.getElementById('tutorial-popup');
        const closeBtn = popup.querySelector('.tutorial-popup-close');
        const prevBtn = popup.querySelector('.tutorial-popup-prev');
        const nextBtn = popup.querySelector('.tutorial-popup-next');
        const skipBtn = popup.querySelector('.tutorial-popup-skip');

        // Close tutorial
        closeBtn.addEventListener('click', () => this.closeTutorial());
        
        // Skip tutorial
        skipBtn.addEventListener('click', () => this.skipTutorial());
        
        // Previous step
        prevBtn.addEventListener('click', () => this.previousStep());
        
        // Next step
        nextBtn.addEventListener('click', () => this.nextStep());

        // Keyboard navigation
        document.addEventListener('keydown', this.handleTutorialKeyboard.bind(this));
    }

    /**
     * Handle keyboard navigation in tutorial
     */
    handleTutorialKeyboard(event) {
        if (!this.isActive) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.closeTutorial();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousStep();
                break;
            case 'ArrowRight':
            case 'Enter':
                event.preventDefault();
                this.nextStep();
                break;
        }
    }

    /**
     * Show specific step using popup
     */
    showStep(stepIndex) {
        if (!this.currentTutorial || stepIndex >= this.currentTutorial.steps.length) {
            console.warn('Tutorial step out of bounds:', stepIndex);
            return;
        }

        const step = this.currentTutorial.steps[stepIndex];
        
        // Remove previous popup if exists
        const existingPopup = document.getElementById('tutorial-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup
        const popup = document.createElement('div');
        popup.id = 'tutorial-popup';
        popup.className = 'tutorial-popup';
        
        // Handle step actions first to get target position
        this.handleStepAction(step);
        
        // Position popup based on target element
        let popupPosition = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        
        if (step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                switch (step.position) {
                    case 'top':
                        popupPosition = {
                            top: `${rect.top + scrollTop - 10}px`,
                            left: `${rect.left + scrollLeft + rect.width / 2}px`,
                            transform: 'translate(-50%, -100%)'
                        };
                        break;
                    case 'bottom':
                        popupPosition = {
                            top: `${rect.bottom + scrollTop + 10}px`,
                            left: `${rect.left + scrollLeft + rect.width / 2}px`,
                            transform: 'translate(-50%, 0)'
                        };
                        break;
                    case 'left':
                        popupPosition = {
                            top: `${rect.top + scrollTop + rect.height / 2}px`,
                            left: `${rect.left + scrollLeft - 10}px`,
                            transform: 'translate(-100%, -50%)'
                        };
                        break;
                    case 'right':
                        popupPosition = {
                            top: `${rect.top + scrollTop + rect.height / 2}px`,
                            left: `${rect.right + scrollLeft + 10}px`,
                            transform: 'translate(0, -50%)'
                        };
                        break;
                    default:
                        popupPosition = {
                            top: `${rect.bottom + scrollTop + 10}px`,
                            left: `${rect.left + scrollLeft + rect.width / 2}px`,
                            transform: 'translate(-50%, 0)'
                        };
                }
            }
        }

        popup.innerHTML = `
            <div class="tutorial-popup-content">
                <div class="tutorial-popup-header">
                    <h4>${step.title}</h4>
                    <button class="tutorial-popup-close" aria-label="Fechar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="tutorial-popup-body">
                    <p>${step.content}</p>
                    <div class="tutorial-popup-progress">
                        <span>${stepIndex + 1} de ${this.currentTutorial.steps.length}</span>
                    </div>
                </div>
                <div class="tutorial-popup-footer">
                    <button class="tutorial-popup-prev" ${stepIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    <button class="tutorial-popup-next">
                        ${stepIndex === this.currentTutorial.steps.length - 1 ? 'Concluir <i class="fas fa-check"></i>' : 'Próximo <i class="fas fa-chevron-right"></i>'}
                    </button>
                    <button class="tutorial-popup-skip">
                        Pular Tutorial
                    </button>
                </div>
            </div>
        `;

        // Apply positioning
        popup.style.cssText = `
            position: fixed;
            top: ${popupPosition.top};
            left: ${popupPosition.left};
            transform: ${popupPosition.transform};
            z-index: 10000;
            max-width: 300px;
            background: var(--card-bg, #fff);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--border-color, #e0e0e0);
        `;

        document.body.appendChild(popup);

        // Add event listeners
        this.setupPopupEventListeners();

        this.currentStep = stepIndex;
    }

    /**
     * Handle step-specific actions
     */
    handleStepAction(step) {
        try {
            // Remove previous highlights
            this.removeHighlights();

            if (step.target) {
                const targetElement = document.querySelector(step.target);
                if (targetElement) {
                    this.highlightElement(targetElement, step.position);
                }
            }
        } catch (error) {
            console.warn('Error in tutorial step action:', error);
        }

        // Handle special actions
        switch (step.action) {
            case 'scroll':
                if (step.target) {
                    const targetElement = document.querySelector(step.target);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                break;
            case 'click':
                if (step.target) {
                    const targetElement = document.querySelector(step.target);
                    if (targetElement) {
                        // Add click listener that will be removed after use
                        const clickHandler = () => {
                            targetElement.click();
                            targetElement.removeEventListener('click', clickHandler);
                        };
                        targetElement.addEventListener('click', clickHandler);
                    }
                }
                break;
        }
    }

    /**
     * Highlight an element
     */
    highlightElement(element, position = 'bottom') {
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.className = 'tutorial-highlight';
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            z-index: 9998;
            pointer-events: none;
            border: 2px solid var(--primary-color);
            border-radius: 8px;
            box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2);
            animation: tutorial-pulse 2s infinite;
        `;

        document.body.appendChild(highlight);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes tutorial-pulse {
                0% { box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2); }
                50% { box-shadow: 0 0 0 8px rgba(0, 123, 255, 0.1); }
                100% { box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Remove all highlights
     */
    removeHighlights() {
        const highlights = document.querySelectorAll('.tutorial-highlight');
        highlights.forEach(highlight => highlight.remove());
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.currentTutorial.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Complete tutorial
     */
    completeTutorial() {
        this.markTutorialCompleted(this.currentTutorial.id);
        this.closeTutorial();
        
        // Show completion message
        if (window.showToast) {
            window.showToast('Tutorial concluído! 🎉', 'success');
        }
    }

    /**
     * Skip tutorial
     */
    skipTutorial() {
        this.closeTutorial();
        
        if (window.showToast) {
            window.showToast('Tutorial pulado. Você pode reiniciá-lo a qualquer momento.', 'info');
        }
    }

    /**
     * Close tutorial
     */
    closeTutorial() {
        this.isActive = false;
        this.removeHighlights();
        
        const popup = document.getElementById('tutorial-popup');
        if (popup) {
            popup.remove();
        }

        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleTutorialKeyboard.bind(this));
    }

    /**
     * Mark tutorial as completed
     */
    markTutorialCompleted(tutorialId) {
        this.userProgress.set(tutorialId, {
            completed: true,
            completedAt: new Date().toISOString(),
            stepsCompleted: this.currentTutorial.steps.length
        });
        
        this.persistUserProgress();
    }

    /**
     * Check if tutorial is completed
     */
    isTutorialCompleted(tutorialId) {
        const progress = this.userProgress.get(tutorialId);
        return progress && progress.completed;
    }

    /**
     * Get tutorial progress
     */
    getTutorialProgress(tutorialId) {
        return this.userProgress.get(tutorialId) || {
            completed: false,
            completedAt: null,
            stepsCompleted: 0
        };
    }

    /**
     * Get all tutorial progress
     */
    getAllTutorialProgress() {
        return Array.from(this.userProgress.entries()).map(([id, progress]) => ({
            tutorialId: id,
            ...progress
        }));
    }

    /**
     * Reset tutorial progress
     */
    resetTutorialProgress(tutorialId = null) {
        if (tutorialId) {
            this.userProgress.delete(tutorialId);
        } else {
            this.userProgress.clear();
        }
        
        this.persistUserProgress();
    }

    /**
     * Show contextual help
     */
    showContextualHelp(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'contextual-help-tooltip';
        tooltip.textContent = message;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 10}px;
            left: ${rect.left}px;
            z-index: 10000;
            background: var(--text-color);
            color: var(--white);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(tooltip);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 5000);
    }

    /**
     * Persist user progress to localStorage
     */
    persistUserProgress() {
        try {
            const progressData = Array.from(this.userProgress.entries());
            localStorage.setItem('findmydocs_tutorial_progress', JSON.stringify(progressData));
        } catch (error) {
            console.warn('Failed to persist tutorial progress:', error);
        }
    }

    /**
     * Load user progress from localStorage
     */
    loadUserProgress() {
        try {
            const saved = localStorage.getItem('findmydocs_tutorial_progress');
            if (saved) {
                const progressData = JSON.parse(saved);
                this.userProgress = new Map(progressData);
            }
        } catch (error) {
            console.warn('Failed to load tutorial progress:', error);
        }
    }

    /**
     * Get tutorial statistics
     */
    getTutorialStats() {
        const totalTutorials = this.tutorials.size;
        const completedTutorials = Array.from(this.userProgress.values()).filter(p => p.completed).length;
        
        return {
            totalTutorials,
            completedTutorials,
            completionRate: totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0
        };
    }
}

// Initialize global tutorial manager
window.tutorialManager = new TutorialManager();
window.TutorialManager = TutorialManager;
