document.addEventListener('DOMContentLoaded', initializePlayerDetailPage);
window.initializePage = initializePlayerDetailPage;

// --- NEW: Renders the player's game log table ---
// --- NEW HELPER FUNCTION: Renders a Season Highs card ---
function renderSeasonHighs(containerId, gameLogData, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let content = `<h3 class="text-xl font-semibold mb-4 text-gray-200">${title}</h3>`;

    if (!gameLogData || gameLogData.length === 0) {
        content += '<p class="text-gray-400">No games played.</p>';
        container.innerHTML = content;
        return;
    }

    const findMax = (statKey) => {
        return gameLogData.reduce((max, game) => {
            const stat = parseFloat(game[statKey]) || 0;
            return stat > max ? stat : max;
        }, 0);
    };

    const seasonHighs = [
        { label: 'Points', value: findMax('Points') },
        { label: 'Rebounds', value: findMax('Rebounds') },
        { label: 'Assists', value: findMax('Assists') },
        { label: 'Steals', value: findMax('Steals') },
        { label: 'Blocks', value: findMax('Blocks') },
        { label: 'Turnovers', value: findMax('Turnovers') },
    ];

    content += '<div class="grid grid-cols-3 gap-4 text-center">';
    seasonHighs.forEach(high => {
        content += `
            <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">${high.label}</p>
                <p class="text-2xl font-bold text-sky-400">${high.value}</p>
            </div>
        `;
    });
    content += '</div>';

    container.innerHTML = content;
}
function renderPlayerGameLog(data) {
    const container = document.getElementById('player-gamelog-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No games played yet this season.</p>';
        return;
    }

    // Sort games by date, most recent first
    data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    let tableHTML = '<div class="overflow-x-auto"><table class="min-w-full text-sm">';
    tableHTML += `
        <thead class="bg-gray-700">
            <tr>
                <th class="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Opponent</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">PTS</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">REB</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">AST</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">STL</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">BLK</th>
                <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">TOV</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
    `;

    const getStat = (stat) => (stat === null || stat === undefined || stat === '') ? '-' : stat;

    data.forEach(game => {
        const gameId = game['Game ID'];
        const playerTeam = game['Team'];
        const team1 = game['Team 1'];
        const opponent = playerTeam === team1 ? game['Team 2'] : team1;

        // Make the entire row a clickable link to the game detail page
        tableHTML += `
            <tr class="hover:bg-gray-700 cursor-pointer" onclick="window.location.href='game-detail.html?gameId=${gameId}'">
                <td class="px-4 py-2 whitespace-nowrap text-gray-300">${game.Date}</td>
                <td class="px-4 py-2 whitespace-nowrap text-gray-300">vs ${opponent}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Points'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Rebounds'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Assists'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Steals'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Blocks'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(game['Turnovers'])}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
}


async function initializePlayerDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerNameParam = urlParams.get('playerName');
    const decodedPlayerName = decodeURIComponent(playerNameParam);

    document.getElementById('page-title').textContent = `${decodedPlayerName} - Player Details`;

    // Set loading states
    const playerInfoContainer = document.getElementById('player-info');
    const playerStatsContainer = document.getElementById('player-stats-container');
    const playerGameLogContainer = document.getElementById('player-gamelog-container');
    const confirmedHighsContainer = document.getElementById('confirmed-highs-container');
    const allHighsContainer = document.getElementById('all-highs-container');

    playerInfoContainer.innerHTML = '<p class="text-gray-400">Loading...</p>';
    playerStatsContainer.innerHTML = '<p class="text-gray-400">Loading...</p>';
    playerGameLogContainer.innerHTML = '<p class="text-gray-400">Loading...</p>';
    confirmedHighsContainer.innerHTML = '<p class="text-gray-400">Loading...</p>';
    allHighsContainer.innerHTML = '<p class="text-gray-400">Loading...</p>';


    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    // Fetch all necessary data
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);

    const [
        allPlayersData,
        allPlayerStatsData,
        playerGameLogData
    ] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, gameLogGID, `SELECT * WHERE G = '${decodedPlayerName}'`)
    ]);

    // ... (playerData and playerStats lookup remains the same)

    // Render Player Info
    if (playerData) {
        // ... (player info rendering logic remains the same)
    }

    // Render Season Averages
    if (playerStats) {
        // ... (season averages rendering logic remains the same)
    }

    // Render Game Log AND Season Highs
    if (playerGameLogData) {
        // Render the main game log table
        renderPlayerGameLog(playerGameLogData);

        // --- NEW: Calculate and render season highs ---

        // 1. Filter for only confirmed games
        const confirmedGames = playerGameLogData.filter(game =>
            !game['Stat Confirmation'] || game['Stat Confirmation'] === 'Full' || game['Stat Confirmation'] === 'Points Only'
        );

        // 2. Render the "Confirmed Stats" card
        renderSeasonHighs('confirmed-highs-container', confirmedGames, 'Season Highs (Confirmed Stats)');

        // 3. Render the "All Stats" card using the full game log
        renderSeasonHighs('all-highs-container', playerGameLogData, 'Season Highs (All Games)');

    } else {
        playerGameLogContainer.innerHTML = '<p class="text-gray-300">No game log data found.</p>';
        confirmedHighsContainer.innerHTML = '<h3 class="text-xl font-semibold text-gray-200">Season Highs (Confirmed)</h3><p class="text-gray-400">No games played.</p>';
        allHighsContainer.innerHTML = '<h3 class="text-xl font-semibold text-gray-200">Season Highs (All Games)</h3><p class="text-gray-400">No games played.</p>';
    }
}