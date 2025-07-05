document.addEventListener('DOMContentLoaded', initializePlayersPage);
window.initializePage = initializePlayersPage;

// A reusable function to render a list of players into a specific container
function renderPlayerSection(containerId, players) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sort players alphabetically
    players.sort((a, b) => a['Player Name'].localeCompare(b['Player Name']));

    if (!players || players.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No players in this category.</p>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4';

    players.forEach(player => {
        const playerName = player['Player Name'];
        if (playerName) {
            const playerLink = document.createElement('a');
            playerLink.href = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
            playerLink.className = 'block p-3 bg-gray-700/50 rounded-md shadow-sm hover:bg-gray-700 transition duration-200 text-gray-200 font-medium text-center';
            playerLink.textContent = playerName;
            grid.appendChild(playerLink);
        }
    });

    container.innerHTML = ''; // Clear loading text
    container.appendChild(grid);
}


async function initializePlayersPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const rosteredContainer = document.getElementById('rostered-players-grid');
    const reserveContainer = document.getElementById('reserve-players-grid');

    const playersGID = getGID('PLAYERS_GID', currentSeason);
    if (!playersGID) {
        console.error('Players GID not configured for this season.');
        rosteredContainer.innerHTML = '<p class="text-red-500">Error: Player data not configured.</p>';
        return;
    }

    const allPlayersData = await fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *');

    if (allPlayersData) {
        const rosteredPlayers = allPlayersData.filter(p => p['Team Name'] !== 'Reserve');
        const reservePlayers = allPlayersData.filter(p => p['Team Name'] === 'Reserve');

        // Pass the container ID and the list of players to the rendering function
        renderPlayerSection('rostered-players-grid', rosteredPlayers);
        renderPlayerSection('reserve-players-grid', reservePlayers);
    } else {
        console.error('Failed to load players data.');
        rosteredContainer.innerHTML = '<p class="text-red-500">Failed to load players data.</p>';
    }
}