// app-initializer.js
// Garante que todos os event listeners sejam configurados corretamente
// e que não haja conflitos bloqueando cliques

(function() {
    'use strict';
    
    // Flag para garantir que a inicialização só aconteça uma vez
    let initialized = false;
    
    // Função para remover todos os event listeners problemáticos temporariamente
    function clearConflictingListeners() {
        // Remove event listeners que podem estar bloqueando
        const oldListeners = document.querySelectorAll('[data-listener-removed]');
        oldListeners.forEach(el => {
            el.removeAttribute('data-listener-removed');
        });
    }
    
    // Função para garantir que elementos sejam clicáveis
    function ensureClickability() {
        // Remove pointer-events: none de elementos que não devem tê-lo
        const style = document.createElement('style');
        style.textContent = `
            body, html {
                pointer-events: auto !important;
            }
            .nav-link, button, a, [data-section] {
                pointer-events: auto !important;
                cursor: pointer !important;
            }
            .content-section {
                pointer-events: auto !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Função principal de inicialização
    function initializeApp() {
        if (initialized) return;
        initialized = true;
        
        console.log('App Initializer: Starting initialization...');
        
        // Garantir clicabilidade
        ensureClickability();
        
        // Limpar listeners conflitantes
        clearConflictingListeners();
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupNavigation);
        } else {
            setupNavigation();
        }
        
        console.log('App Initializer: Initialization complete');
    }
    
    // Setup de navegação melhorado
    function setupNavigation() {
        console.log('Setting up navigation...');
        
        // Função para navegar
        function navigateToSection(sectionId) {
            console.log('Navigating to:', sectionId);
            
            // Esconder todas as seções
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar seção alvo
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('active');
                
                // Atualizar nav links
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
                
                // Carregar dados da seção se necessário
                if (window.loadSectionData) {
                    window.loadSectionData(sectionId);
                }
            } else {
                console.warn('Section not found:', sectionId);
            }
        }
        
        // Event listener global com prioridade alta
        document.addEventListener('click', function(e) {
            // Verificar se é um nav-link
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                // Skip logout buttons - they have their own handler
                if (navLink.classList.contains('logout-btn') || navLink.id === 'nav-logout-btn' || navLink.id === 'profile-logout-btn') {
                    return; // Let logout handler take over
                }
                
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const sectionId = navLink.getAttribute('data-section');
                if (sectionId) {
                    navigateToSection(sectionId);
                }
                return false;
            }
            
            // Verificar se é um botão com data-section
            const button = e.target.closest('[data-section]');
            if (button && button.tagName === 'BUTTON') {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const sectionId = button.getAttribute('data-section');
                if (sectionId) {
                    navigateToSection(sectionId);
                }
                return false;
            }
        }, true); // Capture phase - alta prioridade
        
        // Adicionar listeners diretos aos botões existentes
        function attachDirectListeners() {
            document.querySelectorAll('.nav-link, [data-section]').forEach(element => {
                // Remover listeners antigos
                const newElement = element.cloneNode(true);
                element.parentNode?.replaceChild(newElement, element);
                
                // Adicionar novo listener
                newElement.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const sectionId = newElement.getAttribute('data-section');
                    if (sectionId) {
                        navigateToSection(sectionId);
                    }
                }, true);
            });
        }
        
        // Executar imediatamente e após delays
        attachDirectListeners();
        setTimeout(attachDirectListeners, 100);
        setTimeout(attachDirectListeners, 500);
        setTimeout(attachDirectListeners, 1000);
        
        console.log('Navigation setup complete');
    }
    
    // Inicializar quando possível
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
    
    // Também tentar após um pequeno delay para garantir
    setTimeout(initializeApp, 100);
    
    // Exportar função globalmente
    window.appInitializer = {
        init: initializeApp,
        navigate: function(sectionId) {
            const target = document.getElementById(sectionId);
            if (target) {
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                target.classList.add('active');
            }
        }
    };
})();

