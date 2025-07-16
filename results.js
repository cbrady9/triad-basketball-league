document.addEventListener('DOMContentLoaded', initializeSchedulePage);
window.initializePage = initializeSchedulePage;

// Renders a grid of completed game cards
function renderResultsGrid(games) {
    const container = document.getElementById('results-grid');
    if (!container) return;

    if (!games || games.length === 0) {
        container.innerHTML = `<div class="text-center py-12"><img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No results yet" class="mx-auto w-32 h-32 opacity-40"><p class="text-gray-400 mt-4">No results yet.</p></div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4'; // Changed to 2 columns for better spacing

    games.forEach(game => {
        const gameId = game['Game ID'];
        const team1 = game['Team 1'];
        const team2 = game['Team 2'];
        const team1Score = game['Team 1 Score'];
        const team2Score = game['Team 2 Score'];
        const gameDate = game['Date'];

        // Build the new score display
        const scoreDisplay = `
            <div class="text-center w-1/4">
                <span class="font-bold text-xl text-gray-200">${team1Score} - ${team2Score}</span>
            </div>
        `;

        const gameCard = `
            <a href="game-detail.html?gameId=${gameId}" class="block bg-gray-700/50 rounded-lg shadow-md hover:shadow-lg hover:border-gray-600 transition-all duration-200 overflow-hidden p-4">
                <p class="text-xs text-gray-400 text-center mb-2">${gameDate}</p>
                <div class="flex justify-between items-center text-lg text-gray-200">
                    <span class="font-semibold text-right w-2/5 truncate">${team1}</span>
                    ${scoreDisplay}
                    <span class="font-semibold text-left w-2/5 truncate">${team2}</span>
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
    if (!scheduleGID) { return; }

    const allGamesData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT *');

    if (allGamesData) {
        // Filter for valid games that have a winner, and sort by date descending
        const results = allGamesData
            .filter(game => game['Game ID'] && game.Winner && game.Winner.trim() !== '')
            .sort((a, b) => new Date(b.Date) - new Date(a.Date)); // Show most recent first

        renderResultsGrid(results);
    }
}