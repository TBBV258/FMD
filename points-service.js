// Points Service - Handles all points-related operations

const POINTS_CONFIG = {
    // Points for different actions
    ACTIVITY_POINTS: {
        DOCUMENT_UPLOAD: 20,
        DOCUMENT_FOUND: 50,
        DOCUMENT_LOST: 10,
        PROFILE_UPDATE: 10,
        HELP_PROVIDED: 30
    },
    
    // Ranks configuration
    RANKS: [
        { name: 'Novato', minPoints: 0, color: '#6c757d', description: 'Iniciante na plataforma' },
        { name: 'Iniciante', minPoints: 50, color: '#17a2b8', description: 'Começando a jornada' },
        { name: 'Intermediário', minPoints: 100, color: '#28a745', description: 'Usuário ativo' },
        { name: 'Avançado', minPoints: 200, color: '#007bff', description: 'Membro valioso' },
        { name: 'Expert', minPoints: 500, color: '#6f42c1', description: 'Especialista' },
        { name: 'Lenda', minPoints: 1000, color: '#ffc107', description: 'Lenda da comunidade' }
    ]
};

class PointsService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Award points to a user for a specific activity
     * @param {string} activityType - Type of activity (e.g., 'document_uploaded', 'document_found')
     * @param {string} [documentId] - Optional document ID for activity tracking
     * @returns {Promise<{success: boolean, points: number, rank: string}>}
     */
    async awardPoints(activityType, documentId = null) {
        try {
            // Get points for this activity
            let pointsToAward = 0;
            
            switch(activityType) {
                case 'document_uploaded':
                    pointsToAward = POINTS_CONFIG.ACTIVITY_POINTS.DOCUMENT_UPLOAD;
                    break;
                case 'document_found':
                    pointsToAward = POINTS_CONFIG.ACTIVITY_POINTS.DOCUMENT_FOUND;
                    break;
                case 'document_lost':
                    pointsToAward = POINTS_CONFIG.ACTIVITY_POINTS.DOCUMENT_LOST;
                    break;
                case 'profile_updated':
                    pointsToAward = POINTS_CONFIG.ACTIVITY_POINTS.PROFILE_UPDATE;
                    break;
                case 'help_provided':
                    pointsToAward = POINTS_CONFIG.ACTIVITY_POINTS.HELP_PROVIDED;
                    break;
                default:
                    console.warn(`Unknown activity type: ${activityType}`);
                    return { success: false, error: 'Invalid activity type' };
            }

            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Call the database function to award points
            const { data, error } = await this.supabase.rpc('award_user_points', {
                user_id: user.id,
                points_to_award: pointsToAward,
                activity_type: activityType,
                document_id: documentId
            });

            if (error) throw error;

            // Get updated user profile with points
            const { data: profile } = await this.supabase
                .from('user_profiles')
                .select('points')
                .eq('id', user.id)
                .single();

            // Get current rank
            const rank = this.getCurrentRank(profile.points);

            // Update UI
            this.updatePointsUI(profile.points, rank);

            return { 
                success: true, 
                points: profile.points, 
                rank: rank.name,
                pointsAwarded: pointsToAward
            };

        } catch (error) {
            console.error('Error awarding points:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get the current rank based on points
     * @param {number} points - User's current points
     * @returns {Object} - Rank information
     */
    getCurrentRank(points) {
        // Sort ranks by points in descending order
        const sortedRanks = [...POINTS_CONFIG.RANKS].sort((a, b) => b.minPoints - a.minPoints);
        
        // Find the highest rank the user has achieved
        return sortedRanks.find(rank => points >= rank.minPoints) || sortedRanks[sortedRanks.length - 1];
    }

    /**
     * Get the next rank and points needed
     * @param {number} points - User's current points
     * @returns {Object} - Next rank information and points needed
     */
    getNextRankInfo(points) {
        const currentRank = this.getCurrentRank(points);
        const currentIndex = POINTS_CONFIG.RANKS.findIndex(r => r.name === currentRank.name);
        
        if (currentIndex < POINTS_CONFIG.RANKS.length - 1) {
            const nextRank = POINTS_CONFIG.RANKS[currentIndex + 1];
            return {
                nextRank: nextRank,
                pointsNeeded: nextRank.minPoints - points,
                progress: ((points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100
            };
        }
        
        // If user has the highest rank
        return {
            nextRank: null,
            pointsNeeded: 0,
            progress: 100
        };
    }

    /**
     * Update the points and rank display in the UI
     * @param {number} points - Current points
     * @param {Object} rank - Current rank info
     * @param {boolean} showPopup - Whether to navigate to ranking section (default: true)
     */
    updatePointsUI(points, rank, showPopup = true) {
        // Update points display
        const pointsElement = document.getElementById('profile-points');
        if (pointsElement) pointsElement.textContent = points;
        
        // Navigate to ranking section only if explicitly requested
        if (showPopup && window.showSection) {
            window.showSection('ranking');
        }

        // Update rank badge
        const rankBadge = document.getElementById('profile-rank');
        if (rankBadge) {
            rankBadge.textContent = rank.name;
            rankBadge.style.backgroundColor = rank.color;
        }

        // Update progress to next rank
        const nextRankInfo = this.getNextRankInfo(points);
        const progressBar = document.getElementById('points-progress-bar');
        const pointsCurrent = document.getElementById('points-current');
        const pointsNext = document.getElementById('points-next');
        const nextRankName = document.getElementById('next-rank-name');

        if (progressBar && pointsCurrent && pointsNext && nextRankName) {
            if (nextRankInfo.nextRank) {
                progressBar.style.width = `${nextRankInfo.progress}%`;
                pointsCurrent.textContent = points;
                pointsNext.textContent = nextRankInfo.nextRank.minPoints;
                nextRankName.textContent = nextRankInfo.nextRank.name;
            } else {
                // User has max rank
                progressBar.style.width = '100%';
                pointsCurrent.textContent = points;
                pointsNext.textContent = 'Máx';
                nextRankName.textContent = 'Nível Máximo';
            }
        }
    }

    /**
     * Track document upload and award points
     * @param {string} documentId - ID of the uploaded document
     */
    async trackDocumentUpload(documentId) {
        return this.awardPoints('document_uploaded', documentId);
    }

    /**
     * Track found document report and award points
     * @param {string} documentId - ID of the found document
     */
    async trackDocumentFound(documentId) {
        return this.awardPoints('document_found', documentId);
    }

    /**
     * Track lost document report and award points
     * @param {string} documentId - ID of the lost document
     */
    async trackDocumentLost(documentId) {
        return this.awardPoints('document_lost', documentId);
    }

    /**
     * Track profile update and award points
     */
    async trackProfileUpdate() {
        return this.awardPoints('profile_updated');
    }

    /**
     * Track help provided to another user and award points
     * @param {string} conversationId - ID of the conversation/help provided
     */
    async trackHelpProvided(conversationId) {
        return this.awardPoints('help_provided', conversationId);
    }
}

// Initialize and export the service
let pointsService = null;

document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        pointsService = new PointsService(window.supabase);
        window.pointsService = pointsService;
        
        // Initialize points display without showing the modal
        (async () => {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                if (user) {
                    const points = parseInt(document.getElementById('profile-points')?.textContent || '0');
                    const rank = pointsService.getCurrentRank(points);
                    pointsService.updatePointsUI(points, rank, false); // Don't show modal
                }
            } catch (error) {
                console.error('Error initializing points display:', error);
            }
        })();
    }
});

// Export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PointsService, pointsService };
}
