// onboarding.js

(function () {
    const TUTORIAL_COMPLETED_KEY = 'fmd_tutorial_completed';
    const translations = {
        'pt': {
            nextBtn: 'Próximo',
            startBtn: 'Começar!',
            skipBtn: 'Saltar Tutorial',
            tutorialComplete: 'Tutorial Terminado. Pode começar a usar a aplicação!'
        },
        'en': {
            nextBtn: 'Next',
            startBtn: 'Start!',
            skipBtn: 'Skip Tutorial',
            tutorialComplete: 'Tutorial Complete. You can start using the app!'
        }
    };

    // Get current language or fallback to Portuguese
    const getCurrentLang = () => {
        return (localStorage.getItem('findmydocs_language') || 'pt');
    };

    const steps = [
        {
            title: "Bem-vindo(a) ao FindMyDocument!",
            content: "Estamos felizes por tê-lo(a) connosco. Este tutorial irá guiá-lo(a) pelas principais funcionalidades da plataforma.",
            target: '#app-section', // Pop-up central
            position: 'center',
            highlight: false // Don't highlight full app section
        },
        {
            title: "O Seu Perfil e Pontuação 🏆",
            content: "Aqui pode ver o seu Rank e a sua Pontuação. Ganhe mais pontos ao interagir com a plataforma!",
            target: '.nav-link[data-section="perfil"]', // Profile nav button
            position: 'bottom-left',
            allowClick: true // Allow clicking the profile button
        },
        {
            title: "Registar Documento Perdido ou Encontrado",
            content: "Clique no botão 'Novo Documento' para fazer o upload de documentos que perdeu ou encontrou. **Atenção:** Mantenha os seus dados seguros!",
            target: '#add-document', // O ID do botão "Adicionar Documento"
            position: 'left',
            allowClick: true // Allow clicking the add document button
        },
        {
            title: "Pesquisa de Documentos 🔎",
            content: "Use a barra de pesquisa para encontrar documentos perdidos por tipo, localização ou número (parcialmente mascarado).",
            target: '#search-input', // Correct ID from index.html
            position: 'bottom',
            allowClick: true // Allow interacting with search
        },
        {
            title: "Tudo Pronto!",
            content: "Agora já pode começar! Se precisar de ajuda, use a seção de chat. Boa sorte na sua busca!",
            target: '#app-section',
            position: 'center',
            highlight: false,
            isLast: true
        }
    ];

    function isTutorialCompleted() {
        return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    }

    function markTutorialCompleted() {
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    }

    // Função para mostrar o hint (adaptada para o seu sistema de Toast ou Modal)
    function showHint(step, stepIndex) {
        const targetElement = document.querySelector(step.target);
        const modal = document.getElementById('tutorial-modal'); // Usaremos um modal centralizado
        const hintTitle = document.getElementById('tutorial-title');
        const hintContent = document.getElementById('tutorial-content');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const skipBtn = document.getElementById('tutorial-skip-btn');

        if (!modal || !hintTitle || !hintContent || !nextBtn || !skipBtn) {
            // Fallback: usar o sistema de toast se não conseguir mostrar o modal/hint
            if (window.showToast) {
                window.showToast(step.title + ': ' + step.content, 'info');
            } else {
                console.info('Tutorial:', step.title, step.content);
            }
            // Avançar para o próximo passo no fallback
            setTimeout(() => {
                if (!step.isLast) {
                    showNextStep(stepIndex + 1);
                } else {
                    markTutorialCompleted();
                }
            }, 4000);
            return;
        }

        // --- Lógica do Modal Centralizado (Mais simples para o FMD) ---
        hintTitle.textContent = step.title;
        hintContent.innerHTML = step.content;
        
        // Configurar o botão 'Próximo'
        const t = translations[getCurrentLang()];
        nextBtn.textContent = step.isLast ? t.startBtn : `${t.nextBtn} (${stepIndex + 1}/${steps.length})`;
        nextBtn.onclick = () => {
            modal.style.display = 'none';
            if (step.isLast) {
                markTutorialCompleted();
            } else {
                showNextStep(stepIndex + 1);
            }
        };

        // Configurar o botão 'Saltar'
        skipBtn.style.display = step.isLast ? 'none' : 'block';
        skipBtn.textContent = t.skipBtn;
        skipBtn.onclick = () => {
            modal.style.display = 'none';
            markTutorialCompleted();
            if (window.showToast) window.showToast(t.tutorialComplete, 'success');
        };

        modal.style.display = 'flex';
        // --- Fim da Lógica do Modal Centralizado ---
    }

    function showNextStep(index) {
        if (index < steps.length) {
            showHint(steps[index], index);
        }
    }

    async function startTutorial() {
        // Garantir que todos os elementos DOM estão carregados
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        if (!isTutorialCompleted()) {
            showNextStep(0);
        }
    }

    // Start tutorial after app init or when manually triggered
    window.addEventListener('appInitialized', startTutorial);
    window.onboarding = { 
        startTutorial, 
        isTutorialCompleted, 
        markTutorialCompleted,
        // Add method to check if tutorial should auto-start
        shouldAutoStart: () => !isTutorialCompleted()
    };
})();
