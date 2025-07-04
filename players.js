// players.js

function renderPlayerList(data) {
    const container = document.getElementById('player-list-container');
    if (!container) return;
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No players found for this season.</p>';
        return;
    }
    const playerHeaderKey = Object.keys(data[0])[0];
    data.sort((a, b) => a[playerHeaderKey].localeCompare(b[playerHeaderKey]));
    data.forEach(player => {
        const playerName = player[playerHeaderKey];
        if (playerName) {
            const playerLink = document.createElement('a');
            playerLink.href = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
            // Changed card colors and text
            playerLink.className = 'block p-3 bg-gray-800 border border-gray-700 rounded-md shadow-sm hover:bg-gray-700 transition duration-200 text-gray-200 font-medium text-center';
            playerLink.textContent = playerName;
            container.appendChild(playerLink);
        }
    });
}
async function initializePlayersPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const playersGID = getGID('PLAYERS_GID', currentSeason);
    if (!playersGID) {
        document.getElementById('player-list-container').innerHTML = '<p class="text-red-500">Error: Players data not configured for this season.</p>';
        return;
    }

    const PLAYERS_QUERY = 'SELECT A'; // Assuming Player Name is in Column A
    const playersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);

    if (playersData) {
        renderPlayerList(playersData);
    } else {
        document.getElementById('player-list-container').innerHTML = '<p class="text-red-500">Failed to load player list.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializePlayersPage);
window.initializePage = initializePlayersPage; // For season selector