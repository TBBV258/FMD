// bottom-nav.js
// Barra de navegação inferior mobile-first
export function renderBottomNav() {
  // Renderiza nav bar com gestos e temas
  const container = document.getElementById('bottom-nav');
  if (!container) return;

  // Create nav HTML
  container.innerHTML = `
    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-md z-50">
      <div class="max-w-4xl mx-auto flex justify-between items-center px-4 py-2">
        <button class="nav-link flex-1 text-center" data-section="feed" aria-label="Feed">
          <i class="fas fa-home"></i>
          <div class="text-xs">Feed</div>
        </button>
        <button class="nav-link flex-1 text-center" data-section="relatar-perda" aria-label="Reportar Perdido">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="text-xs">Perdido</div>
        </button>
        <button class="nav-link flex-1 text-center" data-section="relatar-encontrado" aria-label="Reportar Encontrado">
          <i class="fas fa-hand-holding"></i>
          <div class="text-xs">Encontrado</div>
        </button>
        <button class="nav-link flex-1 text-center" data-section="notificacoes" aria-label="Notificações">
          <i class="fas fa-bell"></i>
          <div class="text-xs">Notificações</div>
        </button>
        <button class="nav-link flex-1 text-center" data-section="perfil" aria-label="Perfil">
          <i class="fas fa-user"></i>
          <div class="text-xs">Perfil</div>
        </button>
        
      </div>
    </nav>
  `;

  // Attach click handlers (delegation)
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-link');
    if (!btn) return;

    const section = btn.getAttribute('data-section');
    if (section) {
      // Prefer calling global API if available
      if (typeof window.showSection === 'function') {
        window.showSection(section);
      } else {
        // Dispatch custom event that other code can listen to
        document.dispatchEvent(new CustomEvent('navigateTo', { detail: { section } }));
      }
    }
  });
}
