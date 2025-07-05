document.addEventListener('DOMContentLoaded', initializePlayersPage);
window.initializePage = initializePlayersPage;

// A reusable function to render a list of players into a specific container
function renderPlayerSection(containerId, players, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sort players alphabetically
    players.sort((a, b) => a['Player Name'].localeCompare(b['Player Name']));

    let html = `<h2 class="text-xl font-semibold mb-4 text-gray-200">${title}</h2>`;

    if (!players || players.length === 0) {
        html += '<p class="text-gray-400">No players in this category.</p>';
        container.innerHTML = html;
        return;
    }

    html += '<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">';

    players.forEach(player => {
        const playerName = player['Player Name'];
        if (playerName) {
            const playerLink = document.createElement('a');
            playerLink.href = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
            playerLink.className = 'block p-3 bg-gray-700/50 rounded-md shadow-sm hover:bg-gray-700 transition duration-200 text-gray-200 font-medium text-center';
            playerLink.textContent = playerName;
            html += playerLink.outerHTML;
        }
    });

    html += '</div>';
    container.innerHTML = html;
}


async function initializePlayersPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    // Add loading text to containers
    document.getElementById('rostered-players-container').innerHTML = '<h2 class="text-xl font-semibold mb-4 text-gray-200">League Players</h2><p class="text-gray-400">Loading...</p>';
    document.getElementById('reserve-players-container').innerHTML = '<h2 class="text-xl font-semibold mb-4 text-gray-200">Reserve Players</h2><p class="text-gray-400">Loading...</p>';

    const playersGID = getGID('PLAYERS_GID', currentSeason);
    if (!playersGID) {
        console.error('Players GID not configured for this season.');
        return;
    }

    const allPlayersData = await fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *');

    if (allPlayersData) {
        // Filter players into two separate arrays
        const rosteredPlayers = allPlayersData.filter(p => p['Team Name'] !== 'Reserve');
        const reservePlayers = allPlayersData.filter(p => p['Team Name'] === 'Reserve');

        // Render each section with its corresponding list of players
        renderPlayerSection('rostered-players-container', rosteredPlayers, 'League Players');
        renderPlayerSection('reserve-players-container', reservePlayers, 'Reserve Players');
    } else {
        console.error('Failed to load players data.');
    }
}