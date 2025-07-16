document.addEventListener('DOMContentLoaded', initializeGameDetailPage);
window.initializePage = initializeGameDetailPage;

// Helper function to calculate a team's record at the time of a game
function calculateRecordUpToGame(teamName, game, allScheduleData) {
    const gameDate = new Date(game.Date);
    let wins = 0;
    let losses = 0;
    const pastGames = allScheduleData.filter(g => {
        const pastGameDate = new Date(g.Date);
        return (g['Team 1'] === teamName || g['Team 2'] === teamName) && pastGameDate <= gameDate && g.Winner;
    });
    pastGames.forEach(g => {
        if (g.Winner === teamName) {
            wins++;
        } else {
            losses++;
        }
    });
    return `(${wins}-${losses})`;
}

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

        // --- NEW: More advanced logic to handle different estimation levels ---
        const confirmationStatus = player['Stat Confirmation'];

        const getStatDisplay = (statName, statValue) => {
            const value = (statValue === null || statValue === undefined || statValue === '') ? '-' : statValue;
            let asterisk = '';

            if (confirmationStatus === 'Estimated') {
                asterisk = '<sup class="text-amber-400">*</sup>';
            } else if (confirmationStatus === 'Points Only' && statName !== 'Points') {
                asterisk = '<sup class="text-amber-400">*</sup>';
            }

            return `${value}${asterisk}`;
        };

        tableHtml += `
            <tr class="hover:bg-gray-700">
                <td class="px-4 py-2 whitespace-nowrap">${playerLink}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Points', player['Points'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Rebounds', player['Rebounds'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Assists', player['Assists'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Steals', player['Steals'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Blocks', player['Blocks'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('Turnovers', player['Turnovers'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('1PM', player['1PM'])}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStatDisplay('2PM', player['2PM'])}</td>
            </tr>
        `;
    });
    tableHTML += `</tbody></table></div></div>`;
    return tableHtml;
}

async function initializeGameDetailPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    const scoreDisplayContainer = document.getElementById('score-display');
    const boxScoreContainer = document.getElementById('box-score-container');
    const videoContainer = document.getElementById('video-container');
    if (!gameId || !scoreDisplayContainer) {
        if (scoreDisplayContainer) { scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: No Game ID provided.</p>'; }
        return;
    }
    const gameLogGID = getGID('GAME_LOG_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
    if (!gameLogGID || !scheduleGID) {
        scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Page not configured correctly.</p>';
        return;
    }

    const [gameLogData, scheduleData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, gameLogGID, `SELECT * WHERE A = '${gameId}'`),
        fetchGoogleSheetData(SHEET_ID, scheduleGID, `SELECT *`)
    ]);

    const currentGame = scheduleData.find(g => g['Game ID'] === gameId);

    if (currentGame && currentGame['Video URL']) {
        const videoUrl = currentGame['Video URL'];
        let videoId = '';
        if (videoUrl.includes('watch?v=')) { videoId = new URL(videoUrl).searchParams.get('v'); }
        else if (videoUrl.includes('youtu.be/')) { videoId = new URL(videoUrl).pathname.slice(1); }
        if (videoId) {
            videoContainer.innerHTML = `<div class="video-wrapper rounded-lg overflow-hidden border border-gray-700"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
    }

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
            const team1BoxScoreHtml = createBoxScoreTable(team1Name, teams[team1Name]);
            const team2BoxScoreHtml = createBoxScoreTable(team2Name, teams[team2Name]);
            boxScoreContainer.innerHTML = team1BoxScoreHtml + team2BoxScoreHtml;
            if (currentGame) {
                const team1Record = calculateRecordUpToGame(team1Name, currentGame, scheduleData);
                const team2Record = calculateRecordUpToGame(team2Name, currentGame, scheduleData);
                const score1 = currentGame['Team 1 Score'];
                const score2 = currentGame['Team 2 Score'];
                scoreDisplayContainer.innerHTML = `<div class="w-2/5 text-right"><span class="font-semibold text-2xl truncate">${team1Name}</span><p class="text-sm text-gray-400">${team1Record}</p></div><div class="text-center w-1/5"><span class="font-bold text-3xl text-gray-200">${score1} - ${score2}</span></div><div class="w-2/5 text-left"><span class="font-semibold text-2xl truncate">${team2Name}</span><p class="text-sm text-gray-400">${team2Record}</p></div>`;
            }
        } else {
            scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Game data is incomplete.</p>';
        }
    } else {
        scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Could not find stats for this game.</p>';
    }
}