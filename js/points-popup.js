// Points Popup Management
document.addEventListener('DOMContentLoaded', () => {
    // Initialize points popup if element exists
    const pointsPopup = document.getElementById('points-popup');
    if (pointsPopup) {
        setupPointsPopup();
    }
});

function setupPointsPopup() {
    // Add event listeners for showing/hiding the popup
    const pointsInfoIcons = document.querySelectorAll('.points-info');
    const closePopupBtn = document.getElementById('close-points-popup');
    const pointsPopup = document.getElementById('points-popup');

    pointsInfoIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            pointsPopup.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            pointsPopup.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }

    // Close when clicking outside the popup
    window.addEventListener('click', (e) => {
        if (e.target === pointsPopup) {
            pointsPopup.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
}

// Function to update points popup content
export function updatePointsPopup(points, rank, nextRank) {
    const pointsTotal = document.getElementById('points-total');
    const rankElement = document.getElementById('popup-rank');
    const nextRankElement = document.getElementById('next-rank');
    const pointsNeededElement = document.getElementById('points-needed');
    const progressBar = document.querySelector('#points-popup .progress-bar');

    if (pointsTotal) pointsTotal.textContent = points;
    if (rankElement) rankElement.textContent = rank;
    
    if (nextRank && nextRankElement && pointsNeededElement && progressBar) {
        nextRankElement.textContent = nextRank.name;
        const pointsNeeded = nextRank.pointsRequired - points;
        pointsNeededElement.textContent = pointsNeeded;
        
        // Update progress bar
        const progress = Math.min(100, (points / nextRank.pointsRequired) * 100);
        progressBar.style.width = `${progress}%`;
    }
}
