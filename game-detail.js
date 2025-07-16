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

    // Get all necessary containers
    const scoreDisplayContainer = document.getElementById('score-display');
    const boxScoreContainer = document.getElementById('box-score-container');
    const videoContainer = document.getElementById('video-container');

    if (!gameId || !scoreDisplayContainer) {
        if (scoreDisplayContainer) {
            scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: No Game ID provided.</p>';
        }
        return;
    }

    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    if (!gameLogGID || !scheduleGID) {
        scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Page not configured correctly.</p>';
        return;
    }

    // Fetch data from both sheets
    const [gameLogData, scheduleData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, gameLogGID, `SELECT * WHERE A = '${gameId}'`),
        fetchGoogleSheetData(SHEET_ID, scheduleGID, `SELECT * WHERE A = '${gameId}'`)
    ]);

    // Render Video
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
                <div class="video-wrapper rounded-lg overflow-hidden border border-gray-700">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }
    }

    // Render Box Scores
    if (gameLogData && gameLogData.length > 0) {
        const teams = {};
        gameLogData.forEach(playerRow => {
            const teamName = playerRow['Team'];
            if (!teams[teamName]) teams[teamName] = [];
            teams[teamName].push(playerRow);
        });

        const teamNames = Object.keys(teams);
        if (teamNames.length >= 2) {
            const team1Name = teamNames[0];
            const team2Name = teamNames[1];

            // Render the box score tables
            const team1BoxScoreHtml = createBoxScoreTable(team1Name, teams[team1Name]);
            const team2BoxScoreHtml = createBoxScoreTable(team2Name, teams[team2Name]);
            boxScoreContainer.innerHTML = team1BoxScoreHtml + team2BoxScoreHtml;

            // Render the new score display
            if (scheduleData && scheduleData[0]) {
                const gameInfo = scheduleData[0];
                const score1 = gameInfo['Team 1 Score'];
                const score2 = gameInfo['Team 2 Score'];
                scoreDisplayContainer.innerHTML = `
                    <span class="font-semibold text-2xl text-right w-2/5 truncate">${gameInfo['Team 1']}</span>
                    <div class="text-center w-1/5">
                        <span class="font-bold text-3xl text-gray-200">${score1} - ${score2}</span>
                    </div>
                    <span class="font-semibold text-2xl text-left w-2/5 truncate">${gameInfo['Team 2']}</span>
                `;
            }
        } else {
            scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Game data is incomplete.</p>';
        }
    } else {
        scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Could not find stats for this game.</p>';
    }
}