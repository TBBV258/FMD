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
                    title: 'Bem-vindo!',
                    content: 'Bem-vindo ao FindMyDocs! Vamos fazer um tour rápido pelas principais funcionalidades.',
                    target: null,
                    position: 'center',
                    action: 'next'
                },
                {
                    id: 'upload',
                    title: 'Adicionar Documento',
                    content: 'Clique aqui para adicionar seu primeiro documento. Você pode fazer upload de fotos de BI, passaporte, DIRE e outros documentos.',
                    target: '#add-document',
                    position: 'bottom',
                    action: 'highlight'
                },
                {
                    id: 'feed',
                    title: 'Feed de Documentos',
                    content: 'Aqui você pode ver todos os documentos perdidos e encontrados reportados por outros usuários.',
                    target: '[data-section="feed"]',
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

        this.showTutorialModal();
        this.showStep(0);
    }

    /**
     * Show tutorial modal
     */
    showTutorialModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('tutorial-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'tutorial-modal';
        modal.className = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-overlay"></div>
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h3 id="tutorial-title">${this.currentTutorial.title}</h3>
                    <button id="tutorial-close" class="tutorial-close" aria-label="Fechar tutorial">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="tutorial-body">
                    <div class="tutorial-step-content" id="tutorial-step-content">
                        <!-- Step content will be inserted here -->
                    </div>
                    <div class="tutorial-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="tutorial-progress-fill"></div>
                        </div>
                        <span class="progress-text" id="tutorial-progress-text">1 de ${this.currentTutorial.steps.length}</span>
                    </div>
                </div>
                <div class="tutorial-footer">
                    <button id="tutorial-prev" class="btn secondary" disabled>
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    <button id="tutorial-next" class="btn primary">
                        Próximo <i class="fas fa-chevron-right"></i>
                    </button>
                    <button id="tutorial-skip" class="btn secondary">
                        Pular Tutorial
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        this.setupTutorialEventListeners();
    }

    /**
     * Inject minimal styles for tutorial UI if not already present
     */
    ensureStyles() {
        if (document.getElementById('tutorial-styles')) return;
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-modal{position:fixed;inset:0;z-index:9999;}
            .tutorial-overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);}
            .tutorial-content{position:relative;margin:10vh auto;max-width:560px;background:var(--bg-color, #fff);color:var(--text-color, #222);border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);overflow:hidden}
            .tutorial-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color, #eee)}
            .tutorial-body{padding:16px}
            .tutorial-footer{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--border-color, #eee)}
            .tutorial-step h4{margin:0 0 8px 0}
            .progress-bar{width:100%;height:6px;background:#eee;border-radius:6px;overflow:hidden}
            .progress-fill{height:100%;width:0;background:var(--primary-color, #007bff);transition:width .25s ease}
            .progress-text{display:inline-block;margin-top:8px;font-size:.85rem;color:#666}
            .tutorial-close{background:none;border:none;cursor:pointer;font-size:18px}
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup tutorial event listeners
     */
    setupTutorialEventListeners() {
        const modal = document.getElementById('tutorial-modal');
        const closeBtn = document.getElementById('tutorial-close');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        const skipBtn = document.getElementById('tutorial-skip');

        // Close tutorial
        closeBtn.addEventListener('click', () => this.closeTutorial());
        
        // Skip tutorial
        skipBtn.addEventListener('click', () => this.skipTutorial());
        
        // Previous step
        prevBtn.addEventListener('click', () => this.previousStep());
        
        // Next step
        nextBtn.addEventListener('click', () => this.nextStep());

        // Close on overlay click
        modal.querySelector('.tutorial-overlay').addEventListener('click', () => this.closeTutorial());

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
     * Show specific step
     */
    showStep(stepIndex) {
        if (!this.currentTutorial || stepIndex >= this.currentTutorial.steps.length) {
            return;
        }

        const step = this.currentTutorial.steps[stepIndex];
        const stepContent = document.getElementById('tutorial-step-content');
        const progressFill = document.getElementById('tutorial-progress-fill');
        const progressText = document.getElementById('tutorial-progress-text');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        // Update step content
        stepContent.innerHTML = `
            <div class="tutorial-step">
                <h4>${step.title}</h4>
                <p>${step.content}</p>
            </div>
        `;

        // Update progress
        const progress = ((stepIndex + 1) / this.currentTutorial.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${stepIndex + 1} de ${this.currentTutorial.steps.length}`;

        // Update buttons
        prevBtn.disabled = stepIndex === 0;
        
        if (stepIndex === this.currentTutorial.steps.length - 1) {
            nextBtn.innerHTML = 'Concluir <i class="fas fa-check"></i>';
        } else {
            nextBtn.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        }

        // Handle step actions
        this.handleStepAction(step);

        this.currentStep = stepIndex;
    }

    /**
     * Handle step-specific actions
     */
    handleStepAction(step) {
        // Remove previous highlights
        this.removeHighlights();

        if (step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                this.highlightElement(targetElement, step.position);
            }
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
        
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.remove();
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
