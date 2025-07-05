document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage;

// --- WIDGET RENDERING FUNCTIONS ---

function renderStandingsWidget(data) {
    const container = document.getElementById('standings-widget-container');
    if (!container) return;

    // Sort the data by Win % first, then by Point Differential
    data.sort((a, b) => {
        const winPctA = parseFloat(a['Win %']) || 0;
        const winPctB = parseFloat(b['Win %']) || 0;
        const winPctDiff = winPctB - winPctA;
        if (winPctDiff !== 0) return winPctDiff;

        // --- CORRECTED TIEBREAKER LOGIC ---
        // Sorts by Point Differential from highest to lowest
        const pdA = parseFloat(a['Point Differential']) || 0;
        const pdB = parseFloat(b['Point Differential']) || 0;
        return pdB - pdA;
    });

    const topTeams = data.slice(0, 5);
    let html = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3>';
    html += '<ol class="space-y-2">';

    topTeams.forEach((team, index) => {
        const rank = index + 1;
        const teamName = team['Team Name'];
        const wins = team['Wins'];
        const losses = team['Losses'];
        const gamesPlayed = team['Games Played (Internal)'];
        const pointDiff = team['Point Differential'];

        let statsParts = [];
        if (gamesPlayed !== undefined) {
            statsParts.push(`(${gamesPlayed} GP)`);
        }
        if (wins !== undefined && losses !== undefined) {
            statsParts.push(`${wins}-${losses}`);
        }
        if (pointDiff !== undefined) {
            const diffSign = pointDiff > 0 ? '+' : '';
            statsParts.push(`${diffSign}${pointDiff} PD`);
        }
        const statsString = statsParts.join(' ');

        const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;

        html += `
            <li class="p-2 rounded-md hover:bg-gray-700/50">
                <a href="${teamLink}" class="flex items-center text-sm">
                    <span class="text-center font-bold text-gray-400 w-5">${rank}</span>
                    <span class="ml-4 flex-grow font-semibold text-gray-300">${teamName}</span>
                    <span class="text-gray-400 text-xs whitespace-nowrap">${statsString}</span>
                </a>
            </li>
        `;
    });

    html += '</ol>';
    container.innerHTML = html;
}

function renderScheduleWidgets(data) {
    const recentResultsContainer = document.getElementById('recent-results-widget-container');
    const nextGamesContainer = document.getElementById('next-games-widget-container');
    if (!recentResultsContainer || !nextGamesContainer) return;

    const playedGames = data.filter(game => game['Team 1 Score'] !== null && game['Team 1 Score'] !== '');
    const upcomingGames = data.filter(game => game['Team 1 Score'] === null || game['Team 1 Score'] === '');

    const recentGames = playedGames.slice(-3).reverse();
    let recentHtml = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Recent Results</h3>';
    if (recentGames.length > 0) {
        recentHtml += '<div class="space-y-3">';
        recentGames.forEach(game => {
            const gameId = game['Game ID'];
            const gameLink = `game-detail.html?gameId=${gameId}`;
            recentHtml += `
                <a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300 text-sm">${game['Team 1']} vs ${game['Team 2']}</span>
                        <span class="font-bold text-gray-200 text-sm">${game['Team 1 Score']} - ${game['Team 2 Score']}</span>
                    </div>
                </a>
            `;
        });
        recentHtml += '</div>';
    } else {
        recentHtml += '<p class="text-gray-400">No results yet.</p>';
    }
    recentResultsContainer.innerHTML = recentHtml;

    const nextGames = upcomingGames.slice(0, 3);
    let nextHtml = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Upcoming Games</h3>';
    if (nextGames.length > 0) {
        nextHtml += '<div class="space-y-3">';
        nextGames.forEach(game => {
            const gameLink = `schedule.html`;
            nextHtml += `
                 <a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300 text-sm">${game['Team 1']} vs ${game['Team 2']}</span>
                        <span class="text-gray-400 text-xs">${game['Date']} - ${game['Time']}</span>
                    </div>
                </a>
            `;
        });
        nextHtml += '</div>';
    } else {
        nextHtml += '<p class="text-gray-400">No upcoming games scheduled.</p>';
    }
    nextGamesContainer.innerHTML = nextHtml;
}

// --- MAIN INITIALIZATION FUNCTION ---

async function initializeHomePage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    document.getElementById('standings-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('recent-results-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Recent Results</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('next-games-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Upcoming Games</h3><p class="text-gray-400">Loading...</p>';

    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    try {
        // UPDATED to select all necessary columns including Win % (F) and Rank (G)
        const [standingsData, scheduleData] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT A, B, C, D, E, F, G'),
            fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT A, B, C, D, E, F, G, H')
        ]);

        if (standingsData) {
            renderStandingsWidget(standingsData);
        }
        if (scheduleData) {
            renderScheduleWidgets(scheduleData);
        }

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
    }
}