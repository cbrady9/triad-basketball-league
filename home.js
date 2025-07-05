document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage;

// --- WIDGET RENDERING FUNCTIONS ---

function renderWeeklyAwardsWidget(data) {
    const container = document.getElementById('weekly-awards-container');
    if (!container || !data || data.length === 0) return;

    const latestAward = data[0];
    const playerName = latestAward['Player of the Week'];
    const teamName = latestAward['Team of the Week'];
    const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
    const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;

    const html = `
        <div class="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 rounded-lg border border-sky-400/50 shadow-lg">
            <h3 class="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">${latestAward.Week} Awards</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                    <p class="text-sm font-bold uppercase tracking-wider text-sky-200">Player of the Week</p>
                    <a href="${playerLink}" class="text-xl font-semibold text-white mt-1 hover:underline inline-block">${playerName}</a>
                    <p class="text-sm text-sky-100 mt-1 italic">"${latestAward['Player Blurb']}"</p>
                </div>
                <div>
                    <p class="text-sm font-bold uppercase tracking-wider text-indigo-200">Team of the Week</p>
                    <a href="${teamLink}" class="text-xl font-semibold text-white mt-1 hover:underline inline-block">${teamName}</a>
                    <p class="text-sm text-indigo-100 mt-1 italic">"${latestAward['Team Blurb']}"</p>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function renderStandingsWidget(data) {
    const container = document.getElementById('standings-widget-container');
    if (!container) return;
    data.sort((a, b) => (a['Rank'] || 99) - (b['Rank'] || 99));
    const topTeams = data.slice(0, 5);
    let html = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3>';
    html += '<ol class="space-y-2">';
    topTeams.forEach((team, index) => {
        const rank = team['Rank'] || '-';
        const teamName = team['Team Name'];
        const wins = team['Wins'];
        const losses = team['Losses'];
        const gamesPlayed = team['Games Played (Internal)'];
        const pointDiff = team['Point Differential'];
        let statsParts = [];
        if (gamesPlayed !== undefined) { statsParts.push(`(${gamesPlayed} GP)`); }
        if (wins !== undefined && losses !== undefined) { statsParts.push(`${wins}-${losses}`); }
        if (pointDiff !== undefined) {
            const diffSign = pointDiff > 0 ? '+' : '';
            statsParts.push(`${diffSign}${pointDiff} PD`);
        }
        const statsString = statsParts.join(' ');
        const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
        html += `<li class="p-2 rounded-md hover:bg-gray-700/50"><a href="${teamLink}" class="flex items-center text-sm"><span class="text-center font-bold text-gray-400 w-5">${rank}</span><span class="ml-4 flex-grow font-semibold text-gray-300">${teamName}</span><span class="text-gray-400 text-xs whitespace-nowrap">${statsString}</span></a></li>`;
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
    let recentHtml = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">Recent Results</h3>';
    if (recentGames.length > 0) {
        recentHtml += '<div class="space-y-3">';
        recentGames.forEach(game => {
            const gameId = game['Game ID'];
            const gameLink = `game-detail.html?gameId=${gameId}`;
            recentHtml += `<a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700"><div class="flex justify-between items-center"><span class="text-gray-300 text-sm">${game['Team 1']} vs ${game['Team 2']}</span><span class="font-bold text-gray-200 text-sm">${game['Team 1 Score']} - ${game['Team 2 Score']}</span></div></a>`;
        });
        recentHtml += '</div>';
    } else { recentHtml += '<p class="text-gray-400">No results yet.</p>'; }
    recentResultsContainer.innerHTML = recentHtml;

    const nextGames = upcomingGames.slice(0, 3);
    let nextHtml = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">Upcoming Games</h3>';
    if (nextGames.length > 0) {
        nextHtml += '<div class="space-y-3">';
        nextGames.forEach(game => {
            const gameLink = `schedule.html`;
            nextHtml += `<a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700"><div class="flex justify-between items-center"><span class="text-gray-300 text-sm">${game['Team 1']} vs ${game['Team 2']}</span><span class="text-gray-400 text-xs">${game['Date']} - ${game['Time']}</span></div></a>`;
        });
        nextHtml += '</div>';
    } else { nextHtml += '<p class="text-gray-400">No upcoming games scheduled.</p>'; }
    nextGamesContainer.innerHTML = nextHtml;
}


async function initializeHomePage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
    const weeklyAwardsGID = getGID('WEEKLY_AWARDS_GID', currentSeason); // Get the new GID

    try {
        const [
            standingsData,
            scheduleData,
            weeklyAwardsData
        ] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT A, B, C, D, E, G'),
            fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT A, B, C, D, E, F, G, H'),
            // Fetch the latest award by sorting by Week (Col A) descending and taking 1
            weeklyAwardsGID ? fetchGoogleSheetData(SHEET_ID, weeklyAwardsGID, 'SELECT * ORDER BY A DESC LIMIT 1') : Promise.resolve(null)
        ]);

        if (weeklyAwardsData) {
            renderWeeklyAwardsWidget(weeklyAwardsData);
        }
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