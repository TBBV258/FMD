// Leaderboard Component for FindMyDocs

class Leaderboard {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.containerId = 'leaderboard-container';
        this.pageSize = 10;
        this.currentPage = 1;
        this.ranks = [
            { name: 'Novato', minPoints: 0, color: '#6c757d' },
            { name: 'Iniciante', minPoints: 50, color: '#17a2b8' },
            { name: 'Intermediário', minPoints: 100, color: '#28a745' },
            { name: 'Avançado', minPoints: 200, color: '#007bff' },
            { name: 'Expert', minPoints: 500, color: '#6f42c1' },
            { name: 'Mestre', minPoints: 1000, color: '#fd7e14' }
        ];
    }

    /**
     * Initialize the leaderboard
     */
    async init() {
        await this.render();
        this.setupEventListeners();
    }

    /**
     * Fetch leaderboard data from the database
     */
    async fetchLeaderboard(page = 1) {
        try {
            const from = (page - 1) * this.pageSize;
            const to = from + this.pageSize - 1;
            
            // First get the leaderboard data
            const { data: leaderboardData, error: leaderboardError, count } = await this.supabase
                .from('user_profiles')
                .select('id, full_name, avatar_url, points, updated_at', { count: 'exact' })
                .order('points', { ascending: false })
                .range(from, to);

            if (leaderboardError) throw leaderboardError;

            // Get user ranks
            const usersWithRanks = leaderboardData.map(user => ({
                ...user,
                rank: this.getRankForPoints(user.points || 0)
            }));

            return {
                users: usersWithRanks || [],
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / this.pageSize)
            };
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return { users: [], total: 0, page: 1, totalPages: 1 };
        }
    }

    /**
     * Get rank information based on points
     */
    getRankForPoints(points) {
        // Find the highest rank the user qualifies for
        let userRank = this.ranks[0];
        for (const rank of this.ranks) {
            if (points >= rank.minPoints) {
                userRank = rank;
            } else {
                break;
            }
        }
        
        // Find the next rank
        const currentRankIndex = this.ranks.findIndex(r => r.name === userRank.name);
        const nextRank = this.ranks[currentRankIndex + 1] || null;
        
        return {
            name: userRank.name,
            color: userRank.color,
            nextRank: nextRank ? {
                name: nextRank.name,
                pointsNeeded: nextRank.minPoints - points
            } : null
        };
    }

    /**
     * Render the leaderboard
     */
    async render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando classificação...</p>
            </div>
        `;

        // Fetch data
        const { users, total, page, totalPages } = await this.fetchLeaderboard(this.currentPage);
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>Nenhum dado de classificação disponível ainda.</p>
                </div>
            `;
            return;
        }

        // Get current user's position if logged in
        let currentUserPosition = null;
        let currentUserRank = null;
        
        try {
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            
            if (authError) throw authError;
            
            const currentUserId = user?.id;
            
            if (currentUserId) {
                // Get current user's points and rank
                const { data: userData, error: userError } = await this.supabase
                    .from('user_profiles')
                    .select('points')
                    .eq('id', currentUserId)
                    .single();
                
                if (userError) throw userError;
                
                if (userData) {
                    currentUserRank = this.getRankForPoints(userData.points || 0);
                    
                    try {
                        // Get user's position in the leaderboard
                        const { data: positionData, error: positionError } = await this.supabase.rpc(
                            'get_user_rank_position',
                            { user_id: currentUserId }
                        );
                        
                        if (positionError) throw positionError;
                        
                        if (positionData) {
                            currentUserPosition = positionData;
                        }
                    } catch (positionErr) {
                        console.error('Error getting user position:', positionErr);
                        // Continue without position data if there's an error
                    }
                }
            }
        } catch (error) {
            console.error('Error in leaderboard initialization:', error);
            // Continue with default values if there's an error
        }

        // Render leaderboard
        let html = `
            <div class="leaderboard-header">
                <div class="header-left">
                    <h3><i class="fas fa-trophy"></i> Classificação</h3>
                    ${currentUserPosition ? 
                        `<div class="current-user-position">
                            <span>Sua posição: <strong>#${currentUserPosition}</strong> • ${currentUserRank?.name || 'Novato'}</span>
                        </div>` 
                        : ''
                    }
                </div>
                <div class="header-actions">
                    <button id="refresh-leaderboard" class="btn secondary small" title="Atualizar">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
            ${currentUserRank?.nextRank ? `
                <div class="rank-progress-container">
                    <div class="progress-label">
                        <span>${currentUserRank.nextRank.pointsNeeded} pontos para ${currentUserRank.nextRank.name}</span>
                        <span>${currentUserRank.nextRank.pointsNeeded} pts restantes</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${Math.min(100, 100 - (currentUserRank.nextRank.pointsNeeded / 100) * 100)}%;">
                            <span class="progress-text">${currentUserRank.name}</span>
                        </div>
                    </div>
                </div>` : ''
            }
            <div class="leaderboard-list">
                ${users.map((user, index) => this.renderUserCard(user, index + 1 + ((page - 1) * this.pageSize))).join('')}
            </div>
        `;

        // Add pagination if needed
        if (totalPages > 1) {
            html += this.renderPagination(page, totalPages);
        }

        container.innerHTML = html;
    }

    /**
     * Render a user card for the leaderboard
     */
    async renderUserCard(user, position) {
        let isCurrentUser = false;
        try {
            const { data: { user: currentUser }, error } = await this.supabase.auth.getUser();
            if (!error && currentUser) {
                isCurrentUser = currentUser.id === user.id;
            }
        } catch (error) {
            console.error('Error checking current user:', error);
        }
        const medalClass = position <= 3 ? `medal-${position}` : '';
        const rank = user.rank || this.getRankForPoints(user.points || 0);
        
        return `
            <div class="leaderboard-user ${isCurrentUser ? 'current-user' : ''}" data-user-id="${user.id}">
                <div class="user-position ${medalClass}">
                    ${position <= 3 ? this.getMedalIcon(position) : position}
                </div>
                <div class="user-avatar">
                    <img src="${user.avatar_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ffffff\'%3E%3Cpath d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/%3E%3C/svg%3E'}" 
                         alt="${user.full_name || 'Usuário'}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236c757d\'%3E%3Cpath d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/%3E%3C/svg%3E'">
                </div>
                <div class="user-info">
                    <div class="user-name">
                        ${user.full_name || 'Usuário Anônimo'}
                        ${isCurrentUser ? '<span class="you-badge">Você</span>' : ''}
                    </div>
                    <div class="user-rank" style="color: ${rank.color || '#6c757d'}">
                        <i class="fas fa-award"></i> ${rank.name || 'Novato'}
                    </div>
                </div>
                <div class="user-points">
                    <span class="points-value">${(user.points || 0).toLocaleString()}</span>
                    <span class="points-label">pts</span>
                </div>
            </div>
        `;
    }

    /**
     * Get medal icon for top 3 positions
     */
    getMedalIcon(position) {
        const medals = {
            1: { icon: 'medal', color: '#ffd700' },
            2: { icon: 'medal', color: '#c0c0c0' },
            3: { icon: 'medal', color: '#cd7f32' }
        };
        
        const medal = medals[position];
        return `<i class="fas fa-${medal.icon}" style="color: ${medal.color}"></i>`;
    }

    /**
     * Render pagination controls
     */
    renderPagination(currentPage, totalPages) {
        let html = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button class="pagination-btn" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>`;
        }
        
        // Page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${currentPage + 1}">
                Próximo <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Handle pagination
        container.addEventListener('click', async (e) => {
            // Handle refresh button
            if (e.target.closest('#refresh-leaderboard')) {
                e.preventDefault();
                const btn = e.target.closest('button');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                await this.render();
                return;
            }

            // Handle pagination
            const paginationBtn = e.target.closest('.pagination-btn');
            if (paginationBtn && !paginationBtn.classList.contains('active')) {
                const page = parseInt(paginationBtn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    await this.render();
                    // Scroll to top of leaderboard
                    container.scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            // Handle user click (could be used to show user profile)
            const userCard = e.target.closest('.leaderboard-user');
            if (userCard && !userCard.classList.contains('current-user')) {
                const userId = userCard.dataset.userId;
                // You can add functionality to show user profile or details
                console.log('User clicked:', userId);
            }
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.render();
            }
        });
    }
}

// Initialize leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be available
    const checkSupabase = setInterval(() => {
        if (window.supabase) {
            clearInterval(checkSupabase);
            const leaderboard = new Leaderboard(window.supabase);
            leaderboard.init();
            
            // Expose for debugging
            window.leaderboard = leaderboard;
            
            // Listen for section changes to handle leaderboard updates
            document.addEventListener('sectionChanged', (e) => {
                if (e.detail === 'leaderboard') {
                    leaderboard.currentPage = 1;
                    leaderboard.render();
                }
            });
        }
    }, 100);
    
    // Timeout in case Supabase never loads
    setTimeout(() => {
        clearInterval(checkSupabase);
    }, 5000);
});

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Leaderboard };
}

export default Leaderboard;
