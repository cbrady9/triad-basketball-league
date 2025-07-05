document.addEventListener('DOMContentLoaded', initializeLeadersPage);
window.initializePage = initializeLeadersPage;

// This is a reusable function to create a leaderboard card for any stat
function renderLeaderCard(containerId, data, title, statKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sort the data by the specified stat, descending
    const sortedData = [...data].sort((a, b) => (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0));

    // Get the top 5 players
    const top5 = sortedData.slice(0, 5);

    let html = `<h3 class="text-xl font-semibold mb-4 text-gray-200">${title}</h3>`;
    html += '<ol class="space-y-3">';

    top5.forEach((player, index) => {
        const playerName = player['Player Name'];
        const statValue = parseFloat(player[statKey]).toFixed(1); // Format to one decimal place
        const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;

        html += `
            <li class="flex items-center text-sm">
                <span class="text-center font-semibold text-gray-400 w-5">${index + 1}.</span>
                <a href="${playerLink}" class="ml-3 flex-grow font-medium text-sky-400 hover:underline">${playerName}</a>
                <span class="font-bold text-gray-200">${statValue}</span>
            </li>
        `;
    });

    html += '</ol>';
    container.innerHTML = html;
}

async function initializeLeadersPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    if (!playerStatsGID) {
        console.error('Player Stats GID not found for this season.');
        return;
    }

    const statsData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *');

    if (statsData) {
        renderLeaderCard('ppg-leaders', statsData, 'Points Per Game', 'PPG');
        renderLeaderCard('rpg-leaders', statsData, 'Rebounds Per Game', 'RPG');
        renderLeaderCard('apg-leaders', statsData, 'Assists Per Game', 'APG');
        renderLeaderCard('spg-leaders', statsData, 'Steals Per Game', 'SPG');
        renderLeaderCard('bpg-leaders', statsData, 'Blocks Per Game', 'BPG');
        // --- NEW line to render the TPG leaderboard ---
        renderLeaderCard('tpg-leaders', statsData, 'Turnovers Per Game', 'TPG');
    } else {
        console.error('Failed to load player stats for leaderboards.');
    }
}