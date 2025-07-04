// player-detail.js
console.log('player-detail.js loaded and executing.');

async function initializePlayerDetailPage() {
    console.log('Inside initializePlayerDetailPage.');

    const urlParams = new URLSearchParams(window.location.search);
    const playerNameParam = urlParams.get('playerName');
    const decodedPlayerName = decodeURIComponent(playerNameParam);

    document.getElementById('page-title').textContent = `${decodedPlayerName} - Player Details`;
    document.getElementById('player-name-display').textContent = decodedPlayerName;

    document.getElementById('player-info').innerHTML = '<p class="text-gray-600">Loading player info...</p>';
    document.getElementById('player-stats-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    // --- Fetch Basic Player Data (for Team Name) ---
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    const allPlayersData = await fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *');
    // Find player by 'Player Name' instead of column letter 'A'
    const playerData = allPlayersData.find(p => p['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase());

    if (playerData) {
        // Get team from 'Team Name' instead of column letter 'B'
        const playerTeam = playerData['Team Name'] || 'N/A';
        document.getElementById('player-info').innerHTML = `<p><strong>Team:</strong> ${playerTeam}</p>`;
    } else {
        document.getElementById('player-info').innerHTML = '<p class="text-gray-700">Basic player info not available.</p>';
    }

    // --- Fetch Detailed Player Stats and Build Curated Table ---
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    const allPlayerStatsData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *');
    // Find player stats by 'PLAYER' header
    const playerStats = allPlayerStatsData.find(s => s['Player Name']?.trim().toLowerCase() === decodedPlayerName.trim().toLowerCase());

    if (playerStats) {
        // Define the exact stats you want to display, in order
        const desiredStats = [
            { header: 'Games Played', key: 'GP' },
            { header: 'PPG', key: 'PPG' },
            { header: 'RPG', key: 'RPG' },
            { header: 'APG', key: 'APG' },
            { header: 'SPG', key: 'SPG' },
            { header: 'BPG', key: 'BPG' },
            { header: 'Total 1PM', key: '1PM' },
            { header: 'Total 2PM', key: '2PM' }
        ];

        let statsHtml = `
            <table class="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <thead class="bg-gray-100">
                    <tr>`;

        // Create headers from our desiredStats array
        desiredStats.forEach(stat => {
            statsHtml += `<th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">${stat.header}</th>`;
        });

        statsHtml += `</tr></thead><tbody><tr>`;

        // Add table data from our desiredStats array
        desiredStats.forEach(stat => {
            const value = playerStats[stat.key] !== undefined ? playerStats[stat.key] : 'N/A';
            statsHtml += `<td class="py-2 px-4 border-b text-sm">${value}</td>`;
        });

        statsHtml += `</tr></tbody></table>`;
        document.getElementById('player-stats-container').innerHTML = statsHtml;
    } else {
        document.getElementById('player-stats-container').innerHTML = '<p class="text-gray-700">Detailed player stats not found.</p>';
    }
}
document.addEventListener('DOMContentLoaded', initializePlayerDetailPage);