document.addEventListener('DOMContentLoaded', initializeSchedulePage);
window.initializePage = initializeSchedulePage;

// Renders a grid of game cards into a specific container
function renderGameGrid(containerId, games, isUpcoming) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!games || games.length === 0) {
        const message = isUpcoming ? "No upcoming games scheduled." : "No results yet.";
        container.innerHTML = `<p class="text-gray-400">${message}</p>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    games.forEach(game => {
        const gameId = game['Game ID'];
        const team1 = game['Team 1'];
        const team2 = game['Team 2'];
        const team1Score = game['Team 1 Score'];
        const team2Score = game['Team 2 Score'];
        const gameDate = game['Date'];
        const location = game['Location'] || '';

        let scoreDisplay;
        let resultClass = 'bg-gray-700 text-gray-300';

        if (!isUpcoming) {
            // --- UPDATED: Result card now includes the date ---
            scoreDisplay = `
                <div class="flex items-center space-x-4">
                    <span class="text-gray-400 text-xs">${gameDate}</span>
                    <span class="font-bold">${team1Score} - ${team2Score}</span>
                </div>
            `;
            resultClass = 'bg-teal-900/50 text-teal-300';
        } else {
            scoreDisplay = `<span>${gameDate}</span>`;
        }

        const gameCard = `
            <a href="game-detail.html?gameId=${gameId}" class="block bg-gray-700/50 rounded-lg shadow-md hover:shadow-lg hover:border-gray-600 transition-all duration-200 overflow-hidden">
                <div class="p-4">
                    <p class="text-sm text-gray-400 text-center mb-2 h-4">${location}</p>
                    <div class="flex justify-between items-center text-lg text-gray-200">
                        <span class="font-semibold">${team1}</span>
                        <span class="font-semibold">${team2}</span>
                    </div>
                </div>
                <div class="px-4 py-2 text-center text-sm font-semibold ${resultClass}">
                    ${scoreDisplay}
                </div>
            </a>
        `;
        grid.innerHTML += gameCard;
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

async function initializeSchedulePage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
    if (!scheduleGID) {
        // Handle error
        return;
    }

    const allGamesData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT *');

    if (allGamesData) {
        // Filter out any rows that don't have a Game ID, which are likely blank
        const validGames = allGamesData.filter(game => game['Game ID'] && game['Game ID'].trim() !== '');

        // Separate games into two lists
        const upcomingGames = validGames.filter(game => !game.Winner || game.Winner.trim() === '');
        const results = validGames.filter(game => game.Winner && game.Winner.trim() !== '').reverse(); // Show most recent first

        // Render each section
        renderGameGrid('upcoming-games-grid', upcomingGames, true);
        renderGameGrid('results-grid', results, false);
    } else {
        // Handle error
    }
}