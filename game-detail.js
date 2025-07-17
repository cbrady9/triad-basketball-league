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
    let tableHtml = `<div class="bg-gray-800 p-4 rounded-lg border border-gray-700"><h3 class="text-xl font-semibold mb-3 text-gray-200">${teamName}</h3><div class="overflow-x-auto"><table class="min-w-full text-sm"><thead class="bg-gray-700"><tr><th class="px-4 py-2 text-left font-medium text-gray-300 uppercase tracking-wider">Player</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">PTS</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">REB</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">AST</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">STL</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">BLK</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">TOV</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">1PM</th><th class="px-4 py-2 text-right font-medium text-gray-300 uppercase tracking-wider">2PM</th></tr></thead><tbody class="divide-y divide-gray-700">`;

    teamStats.forEach(player => {
        const playerName = player['Player'];
        const encodedPlayerName = encodeURIComponent(playerName);
        const playerLink = `<a href="player-detail.html?playerName=${encodedPlayerName}" class="text-sky-400 hover:underline font-semibold">${playerName}</a>`;

        // This function displays a dash for any stat that is blank
        const getStat = (stat) => (stat === null || stat === undefined || stat === '') ? '-' : stat;

        // --- NEW: A simple function to decide if a stat needs an asterisk ---
        const getAsterisk = (statName) => {
            const confirmationStatus = player['Stat Confirmation'];
            if (confirmationStatus === 'Estimated') {
                return '<sup class="text-amber-400">*</sup>';
            }
            if (confirmationStatus === 'Points Only' && statName !== 'Points') {
                return '<sup class="text-amber-400">*</sup>';
            }
            return ''; // Return no asterisk if the stat is confirmed
        };

        tableHtml += `
            <tr class="hover:bg-gray-700">
                <td class="px-4 py-2 whitespace-nowrap">${playerLink}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Points'])}${getAsterisk('Points')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Rebounds'])}${getAsterisk('Rebounds')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Assists'])}${getAsterisk('Assists')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Steals'])}${getAsterisk('Steals')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Blocks'])}${getAsterisk('Blocks')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['Turnovers'])}${getAsterisk('Turnovers')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['1PM'])}${getAsterisk('1PM')}</td>
                <td class="px-4 py-2 text-right text-gray-300">${getStat(player['2PM'])}${getAsterisk('2PM')}</td>
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

    // Get containers
    const scoreDisplayContainer = document.getElementById('score-display');
    const boxScoreContainer = document.getElementById('box-score-container');
    const videoContainer = document.getElementById('video-container');

    if (!gameId || !scoreDisplayContainer) {
        if (scoreDisplayContainer) scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: No Game ID provided.</p>';
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
        fetchGoogleSheetData(SHEET_ID, scheduleGID, `SELECT * WHERE A = '${gameId}'`)
    ]);

    const currentGame = scheduleData ? scheduleData.find(g => g['Game ID'] === gameId) : null;

    // Render Video
    if (currentGame && currentGame['Video URL']) {
        const videoUrl = currentGame['Video URL'];
        let videoId = '';
        if (videoUrl.includes('watch?v=')) { videoId = new URL(videoUrl).searchParams.get('v'); }
        else if (videoUrl.includes('youtu.be/')) { videoId = new URL(videoUrl).pathname.slice(1); }
        if (videoId) {
            videoContainer.innerHTML = `
                <div class="video-wrapper rounded-lg overflow-hidden border border-gray-700">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }
    }

    // Render Header and Box Scores
    if (gameLogData && gameLogData.length > 0 && currentGame) {
        const teams = {};
        gameLogData.forEach(playerRow => {
            const teamName = playerRow['Team'];
            if (!teams[teamName]) teams[teamName] = [];
            teams[teamName].push(playerRow);
        });
        const teamNames = Object.keys(teams);

        if (teamNames.length >= 2) {
            const team1Name = currentGame['Team 1'];
            const team2Name = currentGame['Team 2'];
            const team1Record = calculateRecordUpToGame(team1Name, currentGame, scheduleData);
            const team2Record = calculateRecordUpToGame(team2Name, currentGame, scheduleData);
            const score1 = currentGame['Team 1 Score'];
            const score2 = currentGame['Team 2 Score'];

            // --- UPDATED: New structure for the score display ---
            scoreDisplayContainer.innerHTML = `
                <div class="grid grid-cols-3 items-center text-gray-200 gap-2">
                    <div class="text-right">
                        <span class="font-semibold text-lg sm:text-2xl truncate">${team1Name}</span>
                        <p class="text-sm text-gray-400">${team1Record}</p>
                    </div>
                    <div class="text-center">
                        <span class="font-bold text-2xl sm:text-4xl">${score1} - ${score2}</span>
                    </div>
                    <div class="text-left">
                        <span class="font-semibold text-lg sm:text-2xl truncate">${team2Name}</span>
                        <p class="text-sm text-gray-400">${team2Record}</p>
                    </div>
                </div>
            `;

            // Render box scores
            const team1BoxScoreHtml = createBoxScoreTable(team1Name, teams[team1Name] || []);
            const team2BoxScoreHtml = createBoxScoreTable(team2Name, teams[team2Name] || []);
            boxScoreContainer.innerHTML = team1BoxScoreHtml + team2BoxScoreHtml;

        } else {
            scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Game data is incomplete.</p>';
        }
    } else {
        scoreDisplayContainer.innerHTML = '<p class="text-center text-red-500">Error: Could not find stats for this game.</p>';
    }
}