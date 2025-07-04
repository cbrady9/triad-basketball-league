// player-detail.js
console.log('player-detail.js loaded and executing.');

async function initializePlayerDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerNameParam = urlParams.get('playerName');
    const decodedPlayerName = decodeURIComponent(playerNameParam);

    document.getElementById('page-title').textContent = `${decodedPlayerName} - Player Details`;

    const playerInfoContainer = document.getElementById('player-info');
    const playerStatsContainer = document.getElementById('player-stats-container');
    playerInfoContainer.innerHTML = '<p class="text-gray-400">Loading player info...</p>';
    playerStatsContainer.innerHTML = '<p class="text-gray-400">Loading player stats...</p>';

    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    // Fetch data
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);

    const [allPlayersData, allPlayerStatsData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *')
    ]);

    const playerData = allPlayersData.find(p => p['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase());
    const playerStats = allPlayerStatsData.find(s => s['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase());

    // --- NEW: Display Headshot ---
    const headshotUrl = playerData?.['Headshot URL'] || 'https://i.imgur.com/8so6K5A.png'; // Default placeholder
    document.getElementById('player-name-display').innerHTML = `
        <div class="flex items-center space-x-6">
            <img src="${headshotUrl}" alt="${decodedPlayerName}" class="w-24 h-24 rounded-full border-2 border-gray-600 object-cover">
            <h1 class="text-4xl font-extrabold text-gray-100">${decodedPlayerName}</h1>
        </div>
    `;

    // Display Player Info
    if (playerData) {
        const playerTeam = playerData['Team Name'] || 'N/A';
        const teamLink = `team-detail.html?teamName=${encodeURIComponent(playerTeam)}`;
        playerInfoContainer.innerHTML = `<p><strong>Team:</strong> <a href="${teamLink}" class="text-sky-400 hover:underline">${playerTeam}</a></p>`;
    } else {
        playerInfoContainer.innerHTML = '<p class="text-gray-300">Basic player info not available.</p>';
    }

    // Display Curated Player Stats
    if (playerStats) {
        const desiredStats = [
            { header: 'Games Played', key: 'Games Played' }, { header: 'PPG', key: 'PPG' }, { header: 'RPG', key: 'RPG' }, { header: 'APG', key: 'APG' },
            { header: 'SPG', key: 'SPG' }, { header: 'BPG', key: 'BPG' }, { header: 'TPG', key: 'TPG' }, { header: 'FG%', key: 'FG%' }
        ];
        let statsHtml = `<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full"><thead class="bg-gray-800"><tr>`;
        desiredStats.forEach(stat => { statsHtml += `<th class="py-2 px-4 border-b border-gray-600 text-left text-sm font-semibold text-gray-300">${stat.header}</th>`; });
        statsHtml += `</tr></thead><tbody class="divide-y divide-gray-700"><tr>`;
        desiredStats.forEach(stat => {
            const value = playerStats[stat.key] !== undefined ? playerStats[stat.key] : 'N/A';
            statsHtml += `<td class="py-2 px-4 text-sm text-gray-300">${value}</td>`;
        });
        statsHtml += `</tr></tbody></table></div>`;
        playerStatsContainer.innerHTML = statsHtml;
    } else {
        playerStatsContainer.innerHTML = '<p class="text-gray-300">Detailed player stats not found.</p>';
    }
}
document.addEventListener('DOMContentLoaded', initializePlayerDetailPage);