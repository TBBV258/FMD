// Points and Ranks Configuration
const RANKS = [
    { name: 'Novato', points: 0, icon: 'fa-seedling', color: '#28a745' },
    { name: 'Iniciante', points: 100, icon: 'fa-star', color: '#17a2b8' },
    { name: 'Intermediário', points: 500, icon: 'fa-medal', color: '#6f42c1' },
    { name: 'Avançado', points: 1000, icon: 'fa-trophy', color: '#fd7e14' },
    { name: 'Mestre', points: 2500, icon: 'fa-crown', color: '#ffc107' },
    { name: 'Lenda', points: 5000, icon: 'fa-award', color: '#dc3545' }
];

// Points configuration for different activities
const POINTS_CONFIG = {
    document_upload: { points: 100, type: 'upload' },
    document_verified: { points: 50, type: 'verify' },
    document_returned: { points: 200, type: 'help' },
    profile_completed: { points: 50, type: 'profile' },
    daily_login: { points: 10, type: 'login' },
    referred_user: { points: 150, type: 'referral' }
};

// Activity titles and descriptions
const ACTIVITY_TITLES = {
    upload: 'Documento carregado',
    verify: 'Verificação concluída',
    help: 'Documento devolvido',
    profile: 'Perfil completo',
    login: 'Login diário',
    referral: 'Usuário indicado'
};

const ACTIVITY_DESCRIPTIONS = {
    upload: 'Você ganhou pontos por adicionar um novo documento',
    verify: 'Verificação de documento concluída',
    help: 'Você ajudou alguém a recuperar um documento perdido',
    profile: 'Você completou todas as informações do seu perfil',
    login: 'Você ganhou pontos por fazer login hoje',
    referral: 'Você ganhou pontos por indicar um novo usuário'
};

// Activities will be populated from the user's data
let activities = [];
let totalPoints = 0;

// Format timestamp to relative time
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `Há ${interval} ${interval === 1 ? 'ano' : 'anos'}`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `Há ${interval} ${interval === 1 ? 'mês' : 'meses'}`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `Há ${interval} ${interval === 1 ? 'dia' : 'dias'}`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `Há ${interval} ${interval === 1 ? 'hora' : 'horas'}`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `Há ${interval} ${interval === 1 ? 'minuto' : 'minutos'}`;
    
    return 'Agora mesmo';
}

// Get current rank based on points
function getCurrentRank(points) {
    let currentRank = RANKS[0];
    for (const rank of RANKS) {
        if (points >= rank.points) {
            currentRank = rank;
        } else {
            break;
        }
    }
    return currentRank;
}

// Get next rank
function getNextRank(currentRank) {
    const currentIndex = RANKS.findIndex(rank => rank.name === currentRank.name);
    return RANKS[currentIndex + 1] || null;
}

// Calculate progress to next rank
function calculateRankProgress(points, currentRank, nextRank) {
    if (!nextRank) return 100; // Max rank reached
    
    const pointsInCurrentRank = points - currentRank.points;
    const pointsNeeded = nextRank.points - currentRank.points;
    return Math.min(100, Math.round((pointsInCurrentRank / pointsNeeded) * 100));
}

// Calculate total points from activities
function calculateTotalPoints(activities) {
    if (!Array.isArray(activities)) return 0;
    return activities.reduce((total, activity) => {
        const points = Number(activity.points) || 0;
        return total + (isNaN(points) ? 0 : points);
    }, 0);
}

// Get the current user's ID from Supabase auth
async function getCurrentUserId() {
    try {
        if (!window.supabase) {
            console.error('Supabase client not found');
            return null;
        }
        
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
            console.error('Error getting user:', error);
            return null;
        }
        
        return user?.id || null;
    } catch (error) {
        console.error('Error in getCurrentUserId:', error);
        return null;
    }
}

// Fetch user activities from the database
async function fetchUserActivities() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            console.error('[Points] Cannot fetch activities: No user ID available');
            return [];
        }
        
        console.log(`[Points] Fetching activities for user ${userId}`);
        
        const { data, error } = await window.supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('[Points] Error fetching activities:', error);
            return [];
        }
        
        console.log(`[Points] Fetched ${data?.length || 0} activities`);
        
        // Transform the data to match our activity format
        const formattedActivities = (data || []).map(activity => {
            const config = POINTS_CONFIG[activity.activity_type] || {};
            return {
                id: activity.id,
                type: activity.activity_type,
                points: activity.points_earned,
                title: ACTIVITY_TITLES[config.type] || activity.activity_type,
                description: ACTIVITY_DESCRIPTIONS[config.type] || 'Atividade concluída',
                timestamp: new Date(activity.created_at).getTime(),
                metadata: activity.metadata || {}
            };
        });
        
        return formattedActivities;
    } catch (error) {
        console.error('[Points] Error in fetchUserActivities:', error);
        return [];
    }
}

// Update points display in the UI
function updatePointsDisplay(points) {
    console.log('[Points] Updating points display:', points);
    
    // Update profile points display
    const profilePoints = document.getElementById('profile-points');
    if (profilePoints) {
        profilePoints.textContent = points;
        console.log('[Points] Updated profile points display');
    } else {
        console.warn('[Points] Profile points element not found');
    }
    
    // Update points popup display if it exists
    const pointsTotal = document.getElementById('points-total');
    if (pointsTotal) {
        pointsTotal.textContent = points;
        console.log('[Points] Updated popup points display');
    }
    
    // Update rank in the profile
    const currentRank = getCurrentRank(points);
    const rankDisplay = document.getElementById('profile-rank');
    if (rankDisplay) {
        rankDisplay.textContent = currentRank.name;
        console.log('[Points] Updated rank display:', currentRank.name);
    }
    
    // Update badge if badge system is available
    if (typeof window.badgeSystem !== 'undefined') {
        console.log('[Points] Updating badge system with points:', points);
        window.badgeSystem.updatePoints(points);
    } else if (typeof initBadgeSystem !== 'undefined') {
        // Initialize badge system if not already initialized
        console.log('[Points] Initializing badge system with points:', points);
        window.badgeSystem = initBadgeSystem(points);
    }
    
    // Dispatch an event that points have been updated
    const event = new CustomEvent('pointsUpdated', { 
        detail: { 
            points,
            rank: currentRank,
            nextRank: getNextRank(currentRank)
        } 
    });
    document.dispatchEvent(event);
}

// Render activities list
function renderActivities(activities) {
    const activitiesList = document.getElementById('recent-activities-list');
    const noActivitiesElement = document.getElementById('no-activities');
    if (!activitiesList) return;
    
    // Clear existing activities
    activitiesList.innerHTML = '';
    
    // Show no activities message if empty
    if (!activities || activities.length === 0) {
        if (noActivitiesElement) {
            activitiesList.appendChild(noActivitiesElement);
            noActivitiesElement.style.display = 'block';
        }
        return;
    }
    
    // Hide no activities message if it exists
    if (noActivitiesElement) {
        noActivitiesElement.style.display = 'none';
    }
    
    // Sort activities by timestamp (newest first)
    const sortedActivities = [...activities].sort((a, b) => b.timestamp - a.timestamp);
    
    // Get activity icon and color
    function getActivityIcon(type) {
        const config = POINTS_CONFIG[type] || {};
        const activityType = config.type || type;
        
        switch(activityType) {
            case 'upload': return { icon: 'fa-upload', color: '#4a6cf7' };
            case 'verify': return { icon: 'fa-check-circle', color: '#28a745' };
            case 'help': return { icon: 'fa-hands-helping', color: '#6f42c1' };
            case 'profile': return { icon: 'fa-user-check', color: '#17a2b8' };
            case 'login': return { icon: 'fa-sign-in-alt', color: '#6c757d' };
            case 'referral': return { icon: 'fa-user-plus', color: '#fd7e14' };
            default: return { icon: 'fa-star', color: '#ffc107' };
        }
    }
    
    // Create activity items (limit to 10 most recent)
    sortedActivities.slice(0, 10).forEach(activity => {
        const { icon, color } = getActivityIcon(activity.type);
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.style.display = 'flex';
        activityItem.style.alignItems = 'center';
        activityItem.style.padding = '10px 0';
        activityItem.style.borderBottom = '1px solid #f0f0f0';
        
        activityItem.innerHTML = `
            <div class="activity-badge" style="background-color: ${color}20; color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-details" style="flex: 1;">
                <div class="activity-title" style="font-weight: 500; margin-bottom: 4px;" data-i18n="activity.${activity.type}">${activity.title || activity.type}</div>
                <div class="activity-points" style="color: ${color}; font-size: 13px; font-weight: 500;">+${activity.points || 0} pontos</div>
                <div class="activity-time" style="font-size: 12px; color: #888;">${formatTimeAgo(activity.timestamp)}</div>
            </div>
        `;
        
        activitiesList.appendChild(activityItem);
    });
    
    // Add a view all button if there are more than 10 activities
    if (sortedActivities.length > 10) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'btn secondary small';
        viewAllButton.style.width = '100%';
        viewAllButton.style.marginTop = '15px';
        viewAllButton.textContent = 'Ver todas as atividades';
        viewAllButton.onclick = () => {
            // Implement view all functionality if needed
            console.log('View all activities');
        };
        activitiesList.appendChild(viewAllButton);
    }
}

// Update points popup with current data
function updatePointsPopup(points) {
    renderActivities(activities);
    
    const currentRank = getCurrentRank(points);
    const nextRank = getNextRank(currentRank);
    const progress = calculateRankProgress(points, currentRank, nextRank);
    
    // Update rank progress in the popup if elements exist
    const rankProgress = document.getElementById('rank-progress');
    const rankProgressBar = document.getElementById('rank-progress-bar');
    const nextRankText = document.getElementById('next-rank-text');
    
    if (rankProgress && rankProgressBar) {
        rankProgressBar.style.width = `${progress}%`;
        rankProgress.setAttribute('aria-valuenow', progress);
    }
    
    if (nextRankText) {
        if (nextRank) {
            nextRankText.textContent = `Próximo nível: ${nextRank.name} (${nextRank.points - points} pontos restantes)`;
        } else {
            nextRankText.textContent = 'Você atingiu o nível máximo!';
        }
    }
}

// Initialize points popup
function initPointsPopup() {
    const pointsDisplay = document.getElementById('points-display');
    const pointsPopup = document.getElementById('points-popup');
    const closeBtn = document.getElementById('close-points-popup');
    
    if (!pointsDisplay || !pointsPopup) return;
    
    // Open popup when clicking on points
    pointsDisplay.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // Show loading state
            pointsPopup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Fetch latest activities
            const activities = await fetchUserActivities();
            totalPoints = calculateTotalPoints(activities);
            
            // Update the popup with fresh data
            updatePointsPopup(totalPoints);
            
        } catch (error) {
            console.error('[Points] Error opening points popup:', error);
        }
    });
    
    // Close popup when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            pointsPopup.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close popup when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pointsPopup) {
            pointsPopup.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Function to log a new activity (call this when user performs an action)
window.logActivity = async function(activityType, metadata = {}) {
    try {
        console.log(`[Points] Logging activity: ${activityType}`, metadata);
        
        // Check if Supabase is available
        if (!window.supabase) {
            console.error('[Points] Supabase client not found');
            return null;
        }
        
        const userId = await getCurrentUserId();
        if (!userId) {
            console.error('[Points] Cannot log activity: No user ID available');
            return null;
        }
        
        const config = POINTS_CONFIG[activityType];
        if (!config) {
            console.error(`[Points] No configuration found for activity type: ${activityType}`);
            return null;
        }
        
        console.log(`[Points] Logging ${activityType} for user ${userId} (${config.points} points)`);
        
        // Create the activity object
        const activityData = { 
            user_id: userId, 
            activity_type: activityType,
            points_earned: config.points,
            metadata: metadata
        };
        
        console.log('[Points] Activity data:', activityData);
        
        // Add the activity to the database
        const { data, error } = await window.supabase
            .from('user_activities')
            .insert([activityData])
            .select();
            
        if (error) {
            console.error('[Points] Error saving activity to database:', error);
            throw error;
        }
        
        console.log('[Points] Activity saved successfully:', data);
        
        // Update the local activities array
        const newActivity = {
            id: data?.[0]?.id || Date.now().toString(),
            type: config.type || activityType,
            points: config.points,
            title: ACTIVITY_TITLES[config.type] || activityType,
            description: ACTIVITY_DESCRIPTIONS[config.type] || 'Atividade concluída',
            timestamp: data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : Date.now(),
            metadata: metadata
        };
        
        activities.unshift(newActivity);
        totalPoints = calculateTotalPoints(activities);
        
        console.log(`[Points] Updated total points: ${totalPoints}`);
        
        // Update the UI
        updatePointsDisplay(totalPoints);
        
        // Update the popup if it's open
        const pointsPopup = document.getElementById('points-popup');
        if (pointsPopup && pointsPopup.style.display === 'flex') {
            updatePointsPopup(totalPoints);
        }
        
        return newActivity;
    } catch (error) {
        console.error('[Points] Error logging activity:', error);
        throw error;
    }
};

// Function to initialize the points system
async function initializePointsSystem() {
    console.log('[Points] Initializing points system...');
    
    // Initialize points display
    async function initializePoints() {
        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                console.log('[Points] User not logged in, skipping points initialization');
                return;
            }
            
            // Fetch user's activities
            const activities = await fetchUserActivities();
            totalPoints = calculateTotalPoints(activities);
            
            // Update points display in profile
            updatePointsDisplay(totalPoints);
            
            // Initialize points popup if it exists
            initPointsPopup();
            
        } catch (error) {
            console.error('[Points] Error initializing points:', error);
        }
    }
    
    try {
        // Initialize the popup
        initPointsPopup();
        
        try {
            // Fetch and display user activities
            console.log('[Points] Fetching user activities...');
            activities = await fetchUserActivities();
            console.log(`[Points] Fetched ${activities.length} activities`);
            
            // Calculate total points
            totalPoints = calculateTotalPoints(activities);
            console.log(`[Points] Total points calculated: ${totalPoints}`);
            
            // Update the UI
            updatePointsDisplay(totalPoints);
            
            console.log(`[Points] Initialized with ${activities.length} activities and ${totalPoints} points`);
            
            // Log a test activity if no activities found (for testing)
            // Log test activity if no activities found
            if (activities.length === 0) {
                console.log('[Points] No activities found.');
                // Test activity will be created on user's first action
            }
        } catch (error) {
            console.error('[Points] Error initializing points system:', error);
        }
        
        // Update the points display in the profile
        const pointsDisplay = document.getElementById('profile-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = totalPoints;
            console.log('[Points] Updated points display in UI');
        }
        
        // Update the points popup with real data
        updatePointsPopup(totalPoints);
        
        // Initialize badge system if available
        if (typeof window.BadgeSystem !== 'undefined') {
            const currentLanguage = window.currentLanguage || 'pt';
            window.badgeSystem = window.BadgeSystem.initBadgeSystem(totalPoints, 'badge-container', currentLanguage);
            
            // Update badge when points change
            window.updateBadgePoints = (newPoints) => {
                if (window.badgeSystem) {
                    window.badgeSystem.updatePoints(newPoints);
                }
            };
            
            // Listen for language changes
            document.addEventListener('languageChange', (e) => {
                if (window.badgeSystem) {
                    window.badgeSystem.changeLanguage(e.detail.language);
                }
            });
        }
        
        // Add event listener for language change
        document.addEventListener('languageChange', () => {
            updatePointsPopup(totalPoints);
        });
        
        console.log('[Points] Points system initialized successfully');
    } catch (error) {
        console.error('[Points] Error initializing points system:', error);
    }
};

// Initialize the points system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Points] DOM Content Loaded, initializing points system...');
    // Load badge system script if not already loaded
    if (typeof initBadgeSystem === 'undefined') {
        const script = document.createElement('script');
        script.src = 'js/badgeSystem.js';
        script.onload = () => {
            console.log('[Points] Badge system script loaded');
            initializePointsSystem();
        };
        document.head.appendChild(script);
    } else {
        initializePointsSystem();
    }
});

// Also initialize when Supabase is ready if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('[Points] DOM already loaded, initializing points system...');
    if (typeof initBadgeSystem === 'undefined') {
        const script = document.createElement('script');
        script.src = 'js/badgeSystem.js';
        script.onload = initializePointsSystem;
        document.head.appendChild(script);
    } else {
        initializePointsSystem();
    }
}

// Initialize when Supabase is ready (if not already initialized)
document.addEventListener('supabaseReady', () => {
    console.log('[Points] Supabase ready, initializing points system...');
    if (!window.pointsSystemInitialized) {
        initializePointsSystem();
        window.pointsSystemInitialized = true;
    }
});

// Example usage:
// When a user uploads a document:
// logActivity('document_upload', { documentId: '123' });

// When a user verifies their document:
// logActivity('document_verified', { documentId: '123' });

// When a user helps return a document:
// logActivity('document_returned', { documentId: '123', helpedUserId: '456' });

// When a user completes their profile:
// logActivity('profile_completed');

// For daily login (call this when user logs in):
// const lastLogin = localStorage.getItem('lastLogin');
// const today = new Date().toDateString();
// if (lastLogin !== today) {
//     logActivity('daily_login');
//     localStorage.setItem('lastLogin', today);
// }
