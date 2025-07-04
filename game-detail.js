// game-detail.js

// This function creates a single box score table for one team
function createBoxScoreTable(teamName, teamStats) {
    let tableHtml = `
        <div class="bg-white p-4 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-3">${teamName}</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Player</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">REB</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">AST</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">STL</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">BLK</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">FGM-A</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
    `;
    // Column headers from your "Game Log" sheet
    const statColumns = {
        points: 'Points',
        rebounds: 'Rebounds',
        assists: 'Assists',
        steals: 'Steals',
        blocks: 'Blocks'
    };

    teamStats.forEach(player => {
        const fgm = player['FGM'] || 0;
        const fga = player['FGA'] || 0;
        tableHtml += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 whitespace-nowrap">${player['Player']}</td>
                <td class="px-4 py-2 text-right">${player[statColumns.points] || 0}</td>
                <td class="px-4 py-2 text-right">${player[statColumns.rebounds] || 0}</td>
                <td class="px-4 py-2 text-right">${player[statColumns.assists] || 0}</td>
                <td class="px-4 py-2 text-right">${player[statColumns.steals] || 0}</td>
                <td class="px-4 py-2 text-right">${player[statColumns.blocks] || 0}</td>
                <td class="px-4 py-2 text-right">${fgm}-${fga}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table></div></div>`;
    return tableHtml;
}


async function initializeGameDetailPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason); // Initialize the season selector

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');

    const gameInfoContainer = document.getElementById('game-info-container');
    const boxScoreContainer = document.getElementById('box-score-container');
    const gameHeader = document.getElementById('game-header');
    const pageTitle = document.getElementById('page-title');

    if (!gameId) {
        gameHeader.textContent = 'Error: No Game ID provided.';
        return;
    }

    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);
    if (!gameLogGID) {
        gameHeader.textContent = 'Error: Game Log data not configured for this season.';
        return;
    }

    // Fetch all game log data for the specific game
    const GAME_LOG_QUERY = `SELECT * WHERE A = '${gameId}'`;
    const gameLogData = await fetchGoogleSheetData(SHEET_ID, gameLogGID, GAME_LOG_QUERY);

    if (!gameLogData || gameLogData.length === 0) {
        gameHeader.textContent = 'Error: Could not find stats for this game.';
        return;
    }

    // Separate player stats by team
    const teams = {};
    gameLogData.forEach(playerRow => {
        const teamName = playerRow['Team'];
        if (!teams[teamName]) {
            teams[teamName] = [];
        }
        teams[teamName].push(playerRow);
    });

    const teamNames = Object.keys(teams);
    if (teamNames.length < 2) {
        gameHeader.textContent = 'Error: Game data is incomplete.';
        return;
    }

    // Update headers and page title
    const team1Name = teamNames[0];
    const team2Name = teamNames[1];
    gameHeader.textContent = `${team1Name} vs. ${team2Name}`;
    pageTitle.textContent = `${team1Name} vs. ${team2Name} - Game Details`;

    // Get total scores to display in the sub-header
    const team1Score = teams[team1Name].reduce((total, player) => total + (player['Points'] || 0), 0);
    const team2Score = teams[team2Name].reduce((total, player) => total + (player['Points'] || 0), 0);
    document.getElementById('game-sub-header').textContent = `Final Score: ${team1Score} - ${team2Score}`;

    // Create and display the box score tables
    const team1BoxScoreHtml = createBoxScoreTable(team1Name, teams[team1Name]);
    const team2BoxScoreHtml = createBoxScoreTable(team2Name, teams[team2Name]);

    boxScoreContainer.innerHTML = team1BoxScoreHtml + team2BoxScoreHtml;
}

document.addEventListener('DOMContentLoaded', initializeGameDetailPage);
window.initializePage = initializeGameDetailPage; // For season selector