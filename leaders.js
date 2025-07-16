document.addEventListener('DOMContentLoaded', initializeLeadersPage);
window.initializePage = initializeLeadersPage;

// Renders a leaderboard card for per-game averages OR totals
function renderLeaderCard(containerId, data, title, statKey, sortOrder = 'desc') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sortedData = [...data].sort((a, b) => {
        const valA = parseFloat(a[statKey]) || 0;
        const valB = parseFloat(b[statKey]) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    const top5 = sortedData.slice(0, 5);
    let html = `<h3 class="text-xl font-semibold mb-4 text-gray-200">${title}</h3>`;
    html += '<ol class="space-y-3">';
    top5.forEach((player, index) => {
        const playerName = player['Player Name'];
        const statValueNum = parseFloat(player[statKey]);
        // Show decimal for averages, whole number for totals
        const statValue = statKey.includes('PG') ? statValueNum.toFixed(1) : statValueNum;
        const displayStat = !isNaN(statValueNum) ? statValue : '-';
        const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
        html += `<li class="flex items-center text-sm"><span class="text-center font-semibold text-gray-400 w-5">${index + 1}.</span><a href="${playerLink}" class="ml-3 flex-grow font-medium text-sky-400 hover:underline">${playerName}</a><span class="font-bold text-gray-200">${displayStat}</span></li>`;
    });
    html += '</ol>';
    container.innerHTML = html;
}

// Renders the cards for single-game season highs
function renderSeasonHighs(gameLogData) {
    const container = document.getElementById('season-highs-container');
    if (!container || !gameLogData || gameLogData.length === 0) {
        container.innerHTML = '<p class="text-gray-400 col-span-full text-center">No game data available to determine season highs.</p>';
        return;
    }
    container.innerHTML = '';

    // UPDATED: Replaced Turnovers with 2-Pointers Made
    const statCategories = [
        { title: 'Most Points in a Game', key: 'Points' },
        { title: 'Most Rebounds in a Game', key: 'Rebounds' },
        { title: 'Most Assists in a Game', key: 'Assists' },
        { title: 'Most Steals in a Game', key: 'Steals' },
        { title: 'Most Blocks in a Game', key: 'Blocks' },
        { title: 'Most 2-Pointers Made', key: '2PM' }
    ];

    statCategories.forEach(category => {
        const topPerformance = gameLogData.reduce((max, current) => {
            return (parseFloat(current[category.key]) || 0) > (parseFloat(max[category.key]) || 0) ? current : max;
        });

        const playerName = topPerformance['Player'];
        const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
        const statValue = topPerformance[category.key];
        const gameDate = topPerformance['Date'];
        // --- NEW: Get the Game ID for the link ---
        const gameId = topPerformance['Game ID'];
        const gameLink = `game-detail.html?gameId=${gameId}`;

        // --- NEW: The entire card is now a clickable link ---
        const cardHTML = `
            <a href="${gameLink}" class="block bg-gray-800 p-4 rounded-lg border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-colors">
                <p class="text-sm text-gray-400">${category.title}</p>
                <p class="text-3xl font-bold text-sky-400 my-1">${statValue}</p>
                <div class="text-sm text-gray-300">
                    by <span class="font-semibold">${playerName}</span>
                    <span class="text-gray-500">on ${gameDate}</span>
                </div>
            </a>
        `;
        container.innerHTML += cardHTML;
    });
}

async function initializeLeadersPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);

    if (!playerStatsGID || !gameLogGID) {
        console.error('Page GIDs not configured for this season.');
        return;
    }

    const [statsData, gameLogData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, gameLogGID, 'SELECT * WHERE G IS NOT NULL')
    ]);

    if (statsData) {
        renderLeaderCard('ppg-leaders', statsData, 'Points Per Game', 'PPG', 'desc');
        renderLeaderCard('rpg-leaders', statsData, 'Rebounds Per Game', 'RPG', 'desc');
        renderLeaderCard('apg-leaders', statsData, 'Assists Per Game', 'APG', 'desc');
        renderLeaderCard('spg-leaders', statsData, 'Steals Per Game', 'SPG', 'desc');
        renderLeaderCard('bpg-leaders', statsData, 'Blocks Per Game', 'BPG', 'desc');
        // UPDATED: This now renders the 2PMPG leaderboard instead of TPG
        renderLeaderCard('2pmpg-leaders', statsData, '2-Pointers Per Game', '2PMPG', 'desc');
    } else {
        console.error('Failed to load player stats for leaderboards.');
    }

    if (gameLogData) {
        renderSeasonHighs(gameLogData);
    } else {
        console.error('Failed to load game log for season highs.');
        document.getElementById('season-highs-container').innerHTML = '<p class="text-red-500 col-span-full text-center">Could not load season high data.</p>';
    }
}