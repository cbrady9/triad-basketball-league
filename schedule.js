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
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    games.forEach(game => {
        const gameId = game['Game ID'];
        const team1 = game['Team 1'];
        const team2 = game['Team 2'];
        const team1Score = game['Team 1 Score'];
        const team2Score = game['Team 2 Score'];
        const gameDate = game['Date'];
        const location = game['Location'] || '';

        const scoreDisplay = `<span class="font-bold">${team1Score} - ${team2Score}</span>`;
        const resultClass = 'bg-teal-900/50 text-teal-300';

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
                    <div class="flex items-center justify-center space-x-4">
                        <span class="text-gray-400 text-xs">${gameDate}</span>
                        ${scoreDisplay}
                    </div>
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