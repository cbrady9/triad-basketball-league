document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage;

// --- WIDGET RENDERING FUNCTIONS ---

function renderStandingsWidget(data) {
    const container = document.getElementById('standings-widget-container');
    if (!container) return;

    // 1. Sort the data by Rank to get the true Top 5
    // This will now work correctly once the 'Rank' column has data.
    data.sort((a, b) => (a['Rank'] || 99) - (b['Rank'] || 99));

    const topTeams = data.slice(0, 5);
    let html = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3>';
    html += '<ol class="space-y-2">';

    topTeams.forEach(team => {
        // 2. Use a default value ('-') if Rank is still missing
        const rank = team['Rank'] || '-';
        const teamName = team['Team Name'];
        const wins = team['Wins'];
        const losses = team['Losses'];
        // 3. Look for the exact header "Games Played (Internal)"
        const gamesPlayed = team['Games Played (Internal)'];
        const pointDiff = team['Point Differential'];

        // Build the stats string more carefully to avoid "undefined"
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

    // A game has been played if its score is not empty/null. This is more reliable.
    const playedGames = data.filter(game => game['Team 1 Score'] !== null && game['Team 1 Score'] !== '');
    const upcomingGames = data.filter(game => game['Team 1 Score'] === null || game['Team 1 Score'] === '');

    // --- Render Recent Results (last 3 played) ---
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

    // --- Render Upcoming Games (next 3 upcoming) ---
    const nextGames = upcomingGames.slice(0, 3);
    let nextHtml = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Upcoming Games</h3>'; // Text changed here
    if (nextGames.length > 0) {
        nextHtml += '<div class="space-y-3">';
        nextGames.forEach(game => {
            const gameId = game['Game ID'];
            // Upcoming games are not yet clickable as they have no stats page
            // If you want them to be, change the line below to: const gameLink = `...`;
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

    // Show loading messages
    document.getElementById('standings-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('recent-results-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Recent Results</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('next-games-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Upcoming Games</h3><p class="text-gray-400">Loading...</p>';

    // Fetch all needed data at once
    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    try {
        // Updated the queries to fetch the correct columns
        const [standingsData, scheduleData] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT A, B, C, D'), // Select Rank, Team Name, Win %, Point Diff
            fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT A, B, C, D, E, F, G, H') // Select GameID, Date, Time, Teams, Scores, Winner
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