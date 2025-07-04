// players.js

function renderPlayerList(data) {
    const container = document.getElementById('player-list-container');
    if (!container) {
        console.error("Player list container not found.");
        return;
    }
    container.innerHTML = ''; // Clear "Loading..." message

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No players found for this season.</p>';
        return;
    }

    // Sort players alphabetically
    data.sort((a, b) => a['Player Name'].localeCompare(b['Player Name']));

    data.forEach(player => {
        const playerName = player['Player Name'];
        if (playerName) {
            const playerLink = document.createElement('a');
            playerLink.href = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
            playerLink.className = 'block p-3 bg-gray-50 rounded-md shadow-sm hover:bg-blue-100 transition duration-200 text-blue-800 font-medium text-center';
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