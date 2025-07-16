document.addEventListener('DOMContentLoaded', initializeGameDetailPage);
window.initializePage = initializeGameDetailPage;

// Creates a single box score table for one team
function createBoxScoreTable(teamName, teamStats) {
    let tableHtml = `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 class="text-xl font-semibold mb-3 text-gray-200">${teamName}</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-700">
                        <tr>
                            <th class="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Player</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">PTS</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">REB</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">AST</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">STL</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">BLK</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">TOV</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">1PM</th>
                            <th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">2PM</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
    `;
    teamStats.forEach(player => {
        const playerName = player['Player'];
        const encodedPlayerName = encodeURIComponent(playerName);
        const playerLink = `<a href="player-detail.html?playerName=${encodedPlayerName}" class="text-sky-400 hover:underline font-semibold">${playerName}</a>`;
        const getStat = (stat) => (stat === null || stat === undefined || stat === '') ? '-' : stat;
        tableHtml += `
            <tr class="hover:bg-gray-700">
                <td class="px-4 py-2 whitespace-nowrap">${playerLink}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Points'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Rebounds'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Assists'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Steals'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Blocks'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Turnovers'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['1PM'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['2PM'])}</td>
            </tr>
        `;
    });
    tableHtml += `</tbody></table></div></div>`;
    return tableHtml;
}


async function initializeGameDetailPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');

    const gameHeader = document.getElementById('game-header');
    const pageTitle = document.getElementById('page-title');
    const boxScoreContainer = document.getElementById('box-score-container');
    const videoContainer = document.getElementById('video-container');

    if (!gameId) {
        gameHeader.textContent = 'Error: No Game ID provided.';
        return;
    }

    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    if (!gameLogGID || !scheduleGID) {
        gameHeader.textContent = 'Error: Page not configured correctly.';
        return;
    }

    const [gameLogData, scheduleData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, gameLogGID, `SELECT * WHERE A = '${gameId}'`),
        fetchGoogleSheetData(SHEET_ID, scheduleGID, `SELECT * WHERE A = '${gameId}'`)
    ]);

    // Display the video if a URL exists
    if (scheduleData && scheduleData[0] && scheduleData[0]['Video URL']) {
        const videoUrl = scheduleData[0]['Video URL'];
        let videoId = '';
        if (videoUrl.includes('watch?v=')) {
            videoId = new URL(videoUrl).searchParams.get('v');
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = new URL(videoUrl).pathname.slice(1);
        }

        if (videoId) {
            videoContainer.innerHTML = `
                <div class="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border border-gray-700">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }
    }

    if (!gameLogData || gameLogData.length === 0) {
        gameHeader.textContent = 'Error: Could not find stats for this game.';
        // Also clear the sub-header in case a score was displayed before this error
        document.getElementById('game-sub-header').textContent = '';
        return;
    }

    const teams = {};
    gameLogData.forEach(playerRow => {
        const teamName = playerRow['Team'];
        if (!teams[teamName]) teams[teamName] = [];
        teams[teamName].push(playerRow);
    });
    const teamNames = Object.keys(teams);
    if (teamNames.length < 2) {
        gameHeader.textContent = 'Error: Game data is incomplete.';
        return;
    }
    const team1Name = teamNames[0];
    const team2Name = teamNames[1];
    gameHeader.textContent = `${team1Name} vs. ${team2Name}`;
    pageTitle.textContent = `${team1Name} vs. ${team2Name} - Game Details`;

    // This is the full and correct block for displaying the box scores
    const team1BoxScoreHtml = createBoxScoreTable(team1Name, teams[team1Name]);
    const team2BoxScoreHtml = createBoxScoreTable(team2Name, teams[team2Name]);
    boxScoreContainer.innerHTML = team1BoxScoreHtml + team2BoxScoreHtml;

    // This logic to get the score from the schedule remains
    if (scheduleData && scheduleData[0]) {
        const gameInfo = scheduleData[0];
        const score1 = gameInfo['Team 1 Score'];
        const score2 = gameInfo['Team 2 Score'];
        document.getElementById('game-sub-header').textContent = `Final Score: ${score1} - ${score2}`;
    }
}