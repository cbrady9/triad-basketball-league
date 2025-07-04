// player-detail.js
console.log('player-detail.js loaded and executing.');

async function initializePlayerDetailPage() {
    console.log('Inside initializePlayerDetailPage.');

    const urlParams = new URLSearchParams(window.location.search);
    const playerNameParam = urlParams.get('playerName');

    if (!playerNameParam) {
        document.getElementById('player-name-display').textContent = 'Error: Player name not found in URL.';
        document.getElementById('page-title').textContent = 'Error - Player Details';
        document.getElementById('player-info').innerHTML = '';
        document.getElementById('player-stats-container').innerHTML = '';
        return;
    }

    const decodedPlayerName = decodeURIComponent(playerNameParam);
    document.getElementById('page-title').textContent = `${decodedPlayerName} - Player Details`;
    document.getElementById('player-name-display').textContent = decodedPlayerName;

    // Initial loading messages for UX
    document.getElementById('player-info').innerHTML = '<p class="text-gray-600">Loading player info...</p>';
    document.getElementById('player-stats-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    const currentSeason = getCurrentSeason(); // Assuming getCurrentSeason is in utils.js
    console.log('currentSeason in player-detail.js:', currentSeason);

    if (currentSeason) {
        const playersGID = getGID('PLAYERS_GID', currentSeason);
        const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);

        let playerData = null; // From Players S01
        let playerStats = null; // From Player Stats S01

        // --- Fetch Basic Player Data (for Team Name, etc.) ---
        if (playersGID !== null) {
            try {
                const PLAYERS_QUERY = 'SELECT *';
                const allPlayersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);

                if (allPlayersData && allPlayersData.length > 0) {
                    playerData = allPlayersData.find(player =>
                        (player['A'] && player['A'].trim().toLowerCase()) === decodedPlayerName.trim().toLowerCase()
                    );
                }
            } catch (error) {
                console.error("Error fetching Players GID data:", error);
            }
        } else {
            console.warn("Players GID not configured for current season. Basic player info might be missing.");
        }

        // --- Fetch Detailed Player Stats Data ---
        if (playerStatsGID !== null) {
            try {
                const PLAYER_STATS_QUERY = 'SELECT *'; // Fetch all columns from the player stats sheet
                const allPlayerStatsData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, PLAYER_STATS_QUERY);

                if (allPlayerStatsData && allPlayerStatsData.length > 0) {
                    // Find the specific player's stats using the 'A' column (Player Name)
                    playerStats = allPlayerStatsData.find(stats =>
                        (stats['A'] && stats['A'].trim().toLowerCase()) === decodedPlayerName.trim().toLowerCase()
                    );
                }
            } catch (error) {
                console.error("Error fetching Player Stats GID data:", error);
            }
        } else {
            console.error("Player Stats GID not configured for current season. Detailed stats will be missing.");
        }

        // --- Display Information ---
        if (playerData || playerStats) { // If we found any data for the player
            // Display Player Info
            let playerInfoHtml = '';
            if (playerData) {
                const playerTeam = playerData['B'] || 'N/A'; // 'B' is Team Name from Players S01
                playerInfoHtml += `<p><strong>Team:</strong> ${playerTeam}</p>`;
                // Add more basic info from playerData if needed
            } else {
                playerInfoHtml += '<p class="text-gray-700">Basic player info not available.</p>';
            }
            document.getElementById('player-info').innerHTML = playerInfoHtml;

            // Display Player Stats
            if (playerStats) {
                let statsHtml = `
                    <table class="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <thead class="bg-gray-100">
                            <tr>
                `;

                // Get headers from playerStats object (excluding the player name column 'A')
                const statsKeys = Object.keys(playerStats).filter(key => key !== 'A' && key !== 'g'); // 'g' is the 'gsx$' prefix Google appends for new format

                statsKeys.forEach(key => {
                    // Make headers more readable (e.g., 'Games_Played' becomes 'Games Played')
                    const displayKey = key.replace(/_/g, ' ').trim(); 
                    statsHtml += `<th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">${displayKey}</th>`;
                });

                statsHtml += `
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                `;

                // Add table data for each stat
                statsKeys.forEach(key => {
                    const value = playerStats[key] !== undefined ? playerStats[key] : 'N/A';
                    statsHtml += `<td class="py-2 px-4 border-b text-sm">${value}</td>`;
                });

                statsHtml += `
                            </tr>
                        </tbody>
                    </table>
                `;
                document.getElementById('player-stats-container').innerHTML = statsHtml;

            } else {
                document.getElementById('player-stats-container').innerHTML = '<p class="text-gray-700">Detailed player stats not found for this player in "Player Stats S01".</p>';
            }

        } else {
            document.getElementById('player-info').innerHTML = '<p class="text-red-500">Player data (basic or stats) not found.</p>';
            document.getElementById('player-stats-container').innerHTML = '';
        }

    } else {
        document.getElementById('player-info').innerHTML = '<p class="text-red-500">Error: Current season not determined for player data.</p>';
        document.getElementById('player-stats-container').innerHTML = '';
    }
}

