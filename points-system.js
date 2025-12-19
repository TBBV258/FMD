// Points System Configuration
const RANKS = [
    {
        name: 'Novato',
        minPoints: 0,
        color: '#6c757d',
        description: 'Iniciante na plataforma',
        benefits: ['Acesso básico', 'Até 3 documentos ativos']
    },
    {
        name: 'Intermediário',
        minPoints: 1000,
        color: '#17a2b8',
        description: 'Usuário ativo',
        benefits: ['Até 10 documentos ativos', 'Suporte prioritário']
    },
    {
        name: 'Avançado',
        minPoints: 5000,
        color: '#28a745',
        description: 'Membro valioso',
        benefits: ['Documentos ilimitados', 'Suporte prioritário', 'Badge exclusiva']
    },
    {
        name: 'Mestre',
        minPoints: 10000,
        color: '#ffc107',
        description: 'Líder da comunidade',
        benefits: ['Todos os benefícios', 'Acesso antecipado a novos recursos', 'Reconhecimento especial']
    }
];

// Initialize Points System
document.addEventListener('DOMContentLoaded', () => {
    // Initialize points and rank display
    updatePointsDisplay();
    
    // Add click handlers
    const pointsContainer = document.getElementById('points-container');
    const rankBadge = document.getElementById('profile-rank');
    
    if (pointsContainer) {
        pointsContainer.addEventListener('click', togglePointsProgress);
    }
    
    if (rankBadge) {
        rankBadge.addEventListener('click', showRankTooltip);
    }
    
    // Close tooltips when clicking outside
    document.addEventListener('click', (e) => {
        if (!pointsContainer.contains(e.target)) {
            const progressContainer = document.getElementById('points-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }
        
        if (rankBadge && !rankBadge.contains(e.target)) {
            const tooltip = document.querySelector('.rank-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        }
    });
});

// Toggle points progress visibility
function togglePointsProgress(e) {
    e.stopPropagation();
    const progressContainer = document.getElementById('points-progress');
    if (progressContainer) {
        const isVisible = progressContainer.style.display === 'block';
        progressContainer.style.display = isVisible ? 'none' : 'block';
    }
}

// Show rank tooltip
function showRankTooltip(e) {
    e.stopPropagation();
    
    // Remove existing tooltip if any
    const existingTooltip = document.querySelector('.rank-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
        return;
    }
    
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'rank-tooltip';
    tooltip.style.display = 'block';
    
    tooltip.innerHTML = `
        <h4>${currentRank.name} <span style="color: ${currentRank.color}">${currentRank.points || 0} pts</span></h4>
        <p style="margin-bottom: 0.5rem; font-size: 0.85rem;">${currentRank.description}</p>
        <p style="font-weight: 500; margin-bottom: 0.5rem;">Benefícios:</p>
        <ul>
            ${currentRank.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
        ${nextRank ? 
            `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                <p style="margin-bottom: 0.5rem;">Próximo nível: <strong>${nextRank.name}</strong> (mais ${nextRank.minPoints - currentRank.points} pontos)</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${Math.min(100, (currentRank.points / nextRank.minPoints) * 100)}%;"></div>
                </div>
            </div>` 
            : ''
        }
    `;
    
    this.appendChild(tooltip);
}

// Get current rank based on points
function getCurrentRank() {
    const points = getUserPoints();
    let currentRank = RANKS[0];
    
    for (const rank of RANKS) {
        if (points >= rank.minPoints) {
            currentRank = { ...rank, points };
        } else {
            break;
        }
    }
    
    return currentRank;
}

// Get next rank
function getNextRank() {
    const points = getUserPoints();
    for (const rank of RANKS) {
        if (points < rank.minPoints) {
            return rank;
        }
    }
    return null;
}

// Get user points from the UI (in a real app, this would come from your backend)
function getUserPoints() {
    const pointsElement = document.getElementById('profile-points');
    return pointsElement ? parseInt(pointsElement.textContent) || 0 : 0;
}

// Update points display
function updatePointsDisplay() {
    const points = getUserPoints();
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();
    
    // Update rank badge
    const rankBadge = document.getElementById('profile-rank');
    if (rankBadge) {
        rankBadge.textContent = currentRank.name;
        rankBadge.style.backgroundColor = currentRank.color;
    }
    
    // Update points progress if container exists
    const progressBar = document.getElementById('points-progress-bar');
    const pointsCurrent = document.getElementById('points-current');
    const pointsNext = document.getElementById('points-next');
    const nextRankName = document.getElementById('next-rank-name');
    
    if (progressBar && pointsCurrent && pointsNext && nextRankName) {
        if (nextRank) {
            const progress = (points / nextRank.minPoints) * 100;
            progressBar.style.width = `${Math.min(100, progress)}%`;
            pointsCurrent.textContent = points;
            pointsNext.textContent = nextRank.minPoints;
            nextRankName.textContent = nextRank.name;
        } else {
            // User has max rank
            progressBar.style.width = '100%';
            pointsCurrent.textContent = points;
            pointsNext.textContent = 'Máx';
            nextRankName.textContent = 'Nível Máximo';
        }
    }
}

// Add points to user (example function)
function addPoints(amount, reason) {
    if (!amount || amount <= 0) return;
    
    // In a real app, you would save this to your backend
    const pointsElement = document.getElementById('profile-points');
    if (pointsElement) {
        const currentPoints = parseInt(pointsElement.textContent) || 0;
        const newPoints = currentPoints + amount;
        pointsElement.textContent = newPoints;
        
        // Update display
        updatePointsDisplay();
        
        // Show notification
        showPointsNotification(amount, reason);
    }
}

// Show points notification
function showPointsNotification(amount, reason) {
    // You can implement a toast notification system here
    console.log(`+${amount} pontos: ${reason}`);
    
    // Example using the existing showToast function if available
    if (window.showToast) {
        window.showToast(`+${amount} pontos! ${reason}`, 'success');
    }
}

// Make functions available globally
window.pointsSystem = {
    addPoints,
    updatePointsDisplay,
    getCurrentRank,
    getNextRank
};
