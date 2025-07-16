document.addEventListener('DOMContentLoaded', initializePlayerDetailPage);
window.initializePage = initializePlayerDetailPage;

// --- NEW: Renders the player's game log table ---
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
    playerInfoContainer.innerHTML = '<p class="text-gray-400">Loading player info...</p>';
    playerStatsContainer.innerHTML = '<p class="text-gray-400">Loading player stats...</p>';
    playerGameLogContainer.innerHTML = '<p class="text-gray-400">Loading game log...</p>';

    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    // Get all necessary GIDs
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);

    // Fetch all data concurrently
    const [
        allPlayersData,
        allPlayerStatsData,
        playerGameLogData
    ] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, gameLogGID, `SELECT * WHERE G = '${decodedPlayerName}'`)
    ]);

    const playerData = allPlayersData ? allPlayersData.find(p => p['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase()) : null;
    const playerStats = allPlayerStatsData ? allPlayerStatsData.find(s => s['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase()) : null;

    // Render Headshot and Name
    const placeholderImg = 'https://i.imgur.com/8so6K5A.png';
    const headshotUrl = playerData?.['Headshot URL'] || placeholderImg;
    document.getElementById('player-name-display').innerHTML = `<div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"><img src="${headshotUrl}" alt="${decodedPlayerName}" class="w-24 h-24 rounded-full border-2 border-gray-600 object-cover bg-gray-700" onerror="this.onerror=null; this.src='${placeholderImg}';"><h1 class="text-4xl font-extrabold text-gray-100">${decodedPlayerName}</h1></div>`;

    // Render Player Info
    if (playerData) {
        const playerTeam = playerData['Team Name'] || 'N/A';
        const playerRole = playerData['Role'] || 'Player';
        let teamDisplayHtml = '';
        if (playerTeam === 'Reserve') {
            teamDisplayHtml = `<p><strong>Team:</strong> ${playerTeam}</p>`;
        } else {
            const teamLink = `team-detail.html?teamName=${encodeURIComponent(playerTeam)}`;
            teamDisplayHtml = `<p><strong>Team:</strong> <a href="${teamLink}" class="text-sky-400 hover:underline">${playerTeam}</a></p>`;
        }
        playerInfoContainer.innerHTML = `${teamDisplayHtml}<p><strong>Role:</strong> ${playerRole}</p>`;
    } else {
        playerInfoContainer.innerHTML = '<p class="text-gray-300">Basic player info not available.</p>';
    }

    // Render Season Averages
    if (playerStats) {
        const desiredStats = [
            { header: 'Games Played', key: 'Games Played' }, { header: 'PPG', key: 'PPG' }, { header: 'RPG', key: 'RPG' }, { header: 'APG', key: 'APG' },
            { header: 'SPG', key: 'SPG' }, { header: 'BPG', key: 'BPG' }, { header: 'TPG', key: 'TPG' }
        ];
        let statsHtml = `<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full"><thead class="bg-gray-800"><tr>`;
        desiredStats.forEach(stat => { statsHtml += `<th class="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300 uppercase">${stat.header}</th>`; });
        statsHtml += `</tr></thead><tbody class="divide-y divide-gray-700"><tr>`;
        desiredStats.forEach(stat => {
            let value = playerStats[stat.key] !== undefined ? playerStats[stat.key] : 'N/A';
            if (['PPG', 'RPG', 'APG', 'SPG', 'BPG', 'TPG'].includes(stat.key)) { value = formatStat(value); }
            statsHtml += `<td class="py-2 px-4 text-sm text-gray-300">${value}</td>`;
        });
        statsHtml += `</tr></tbody></table></div>`;
        playerStatsContainer.innerHTML = statsHtml;
    } else {
        playerStatsContainer.innerHTML = '<p class="text-gray-300">No season averages found.</p>';
    }

    // Render the new Game Log table
    if (playerGameLogData) {
        renderPlayerGameLog(playerGameLogData);
    } else {
        playerGameLogContainer.innerHTML = '<p class="text-gray-300">No game log data found.</p>';
    }
}