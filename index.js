document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage;

// --- WIDGET RENDERING FUNCTIONS ---

function renderStandingsWidget(data) {
    const container = document.getElementById('standings-widget-container');
    if (!container) return;

    // Get only the top 5 teams
    const topTeams = data.slice(0, 5);

    let html = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3>';
    html += '<ol class="space-y-3">';

    topTeams.forEach(team => {
        const rank = team['Rank'];
        const teamName = team['Team Name'];
        const wins = team['Wins'];
        const losses = team['Losses'];

        html += `
            <li class="flex items-center text-sm">
                <span class="text-center font-bold text-gray-400 w-5">${rank}</span>
                <span class="ml-4 flex-grow font-semibold text-gray-300">${teamName}</span>
                <span class="text-gray-400">${wins} - ${losses}</span>
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

    // Separate games that have a winner from those that don't
    const playedGames = data.filter(game => game.Winner && game.Winner.trim() !== '');
    const upcomingGames = data.filter(game => !game.Winner || game.Winner.trim() === '');

    // --- Render Recent Results (last 3 played) ---
    const recentGames = playedGames.slice(-3).reverse(); // Get last 3 and reverse to show newest first
    let recentHtml = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Recent Results</h3>';
    if (recentGames.length > 0) {
        recentHtml += '<div class="space-y-4">';
        recentGames.forEach(game => {
            recentHtml += `
                <div class="p-3 bg-gray-700/50 rounded-md">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">${game['Team 1']} vs ${game['Team 2']}</span>
                        <span class="font-bold text-gray-200">${game['Team 1 Score']} - ${game['Team 2 Score']}</span>
                    </div>
                </div>
            `;
        });
        recentHtml += '</div>';
    } else {
        recentHtml += '<p class="text-gray-400">No results yet.</p>';
    }
    recentResultsContainer.innerHTML = recentHtml;

    // --- Render Next Games (next 3 upcoming) ---
    const nextGames = upcomingGames.slice(0, 3);
    let nextHtml = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Next Games Up</h3>';
    if (nextGames.length > 0) {
        nextHtml += '<div class="space-y-4">';
        nextGames.forEach(game => {
            nextHtml += `
                <div class="p-3 bg-gray-700/50 rounded-md">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">${game['Team 1']} vs ${game['Team 2']}</span>
                        <span class="text-gray-400 text-sm">${game['Date']} - ${game['Time']}</span>
                    </div>
                </div>
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
    document.getElementById('next-games-widget-container').innerHTML = '<h3 class="text-xl font-semibold mb-4 text-gray-200">Next Games Up</h3><p class="text-gray-400">Loading...</p>';


    // Fetch all needed data at once
    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    try {
        const [standingsData, scheduleData] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT A, B, D, E'), // Select Rank, Name, Wins, Losses
            fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT B, C, D, E, F, G, H') // Select Date, Time, Teams, Scores, Winner
        ]);

        // Render the widgets with the fetched data
        if (standingsData) {
            renderStandingsWidget(standingsData);
        }
        if (scheduleData) {
            renderScheduleWidgets(scheduleData);
        }

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // You could add error messages to the widgets here
    }
}