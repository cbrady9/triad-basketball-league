document.addEventListener('DOMContentLoaded', initializeLeadersPage);
window.initializePage = initializeLeadersPage;

// This is a reusable function to create a leaderboard card for any stat
function renderLeaderCard(containerId, data, title, statKey, sortOrder = 'desc') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sort the data based on the desired order
    const sortedData = [...data].sort((a, b) => {
        const valA = parseFloat(a[statKey]) || 0;
        const valB = parseFloat(b[statKey]) || 0;

        // Use 'asc' for ascending (lowest is best), 'desc' for descending (highest is best)
        return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const top5 = sortedData.slice(0, 5);
    let html = `<h3 class="text-xl font-semibold mb-4 text-gray-200">${title}</h3>`;
    html += '<ol class="space-y-3">';

    top5.forEach((player, index) => {
        const playerName = player['Player Name'];
        const statValue = parseFloat(player[statKey]).toFixed(1);
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
        document.querySelector('.grid').innerHTML = '<p class="text-red-500 col-span-full text-center">League Leaders not configured for this season.</p>';
        return;
    }

    const statsData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *');

    // --- NEW: Check for data BEFORE trying to render cards ---
    if (statsData && statsData.length > 0) {
        // If data exists, render all the leader cards
        renderLeaderCard('ppg-leaders', statsData, 'Points Per Game', 'PPG', 'desc');
        renderLeaderCard('rpg-leaders', statsData, 'Rebounds Per Game', 'RPG', 'desc');
        renderLeaderCard('apg-leaders', statsData, 'Assists Per Game', 'APG', 'desc');
        renderLeaderCard('spg-leaders', statsData, 'Steals Per Game', 'SPG', 'desc');
        renderLeaderCard('bpg-leaders', statsData, 'Blocks Per Game', 'BPG', 'desc');
        renderLeaderCard('tpg-leaders', statsData, 'Turnovers Per Game', 'TPG', 'asc');
    } else {
        // If no data exists, show one single empty state message
        const leadersGrid = document.querySelector('.grid');
        if (leadersGrid) {
            leadersGrid.innerHTML = `
                <div class="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 p-6 rounded-lg border border-gray-700 text-center py-12">
                    <img src="https://images.undraw.co/undraw_analytics_re_dkf8.svg" alt="No stats available" class="mx-auto w-40 h-40 opacity-40">
                    <p class="text-lg text-gray-400 mt-4">No stats available yet. Check back after the first games are played!</p>
                </div>
            `;
        }
    }
}