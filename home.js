document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage;

// --- NEW: Helper function to calculate a team's record at the time of a game ---
function calculateRecordUpToGame(teamName, game, allScheduleData) {
    const gameDate = new Date(game.Date);
    let wins = 0;
    let losses = 0;

    // Filter for games played by this team *on or before* the current game's date
    const pastGames = allScheduleData.filter(g => {
        const pastGameDate = new Date(g.Date);
        return (g['Team 1'] === teamName || g['Team 2'] === teamName) && pastGameDate <= gameDate && g.Winner;
    });

    // Calculate record from those games
    pastGames.forEach(g => {
        if (g.Winner === teamName) {
            wins++;
        } else {
            losses++;
        }
    });

    return `(${wins}-${losses})`;
}

// --- WIDGET RENDERING FUNCTIONS ---

function renderWeeklyAwardsWidget(data) {
    const container = document.getElementById('weekly-awards-container');
    if (!container || !data || data.length === 0) return;
    const latestAward = data[0];
    const playerName = latestAward['Player of the Week'];
    const teamName = latestAward['Team of the Week'];
    const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
    const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
    const html = `<div class="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 rounded-lg border border-sky-400/50 shadow-lg"><h3 class="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">${latestAward.Week} Awards</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"><div><p class="text-sm font-bold uppercase tracking-wider text-sky-200">Player of the Week</p><a href="${playerLink}" class="text-xl font-semibold text-white mt-1 hover:underline inline-block">${playerName}</a><p class="text-sm text-sky-100 mt-1 italic">"${latestAward['Player Blurb']}"</p></div><div><p class="text-sm font-bold uppercase tracking-wider text-indigo-200">Team of the Week</p><a href="${teamLink}" class="text-xl font-semibold text-white mt-1 hover:underline inline-block">${teamName}</a><p class="text-sm text-indigo-100 mt-1 italic">"${latestAward['Team Blurb']}"</p></div></div></div>`;
    container.innerHTML = html;
}

function renderStandingsWidget(data) {
    const container = document.getElementById('standings-widget-container');
    if (!container) return;
    data.sort((a, b) => {
        const winPctA = parseFloat(a['Win %']) || 0;
        const winPctB = parseFloat(b['Win %']) || 0;
        const winPctDiff = winPctB - winPctA;
        if (winPctDiff !== 0) return winPctDiff;
        const pdA = parseFloat(a['Point Differential']) || 0;
        const pdB = parseFloat(b['Point Differential']) || 0;
        return pdB - pdA;
    });
    const topTeams = data.slice(0, 5);
    let html = '<h3 class="text-2xl font-semibold mb-4 text-gray-200"><a href="standings.html" class="hover:underline">Top 5 Standings</a></h3>';
    html += '<ol class="space-y-2">';
    topTeams.forEach((team, index) => {
        const rank = index + 1;
        const teamName = team['Team Name'];
        const wins = team['Wins'];
        const losses = team['Losses'];
        const gamesPlayed = team['Games Played'];
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

// --- UPDATED to render records ---
function renderResultsWidget(scheduleData) {
    const container = document.getElementById('recent-results-widget-container');
    if (!container) return;
    const playedGames = scheduleData.filter(game => game.Winner && game.Winner.trim() !== '');
    const recentGames = playedGames.slice(-3).reverse();
    let recentHtml = '<h3 class="text-2xl font-semibold mb-4 text-gray-200"><a href="results.html" class="hover:underline">Recent Results</a></h3>';
    if (recentGames.length > 0) {
        recentHtml += '<div class="space-y-3">';
        recentGames.forEach(game => {
            const gameId = game['Game ID'];
            const team1Name = game['Team 1'];
            const team2Name = game['Team 2'];

            const team1Record = calculateRecordUpToGame(team1Name, game, scheduleData);
            const team2Record = calculateRecordUpToGame(team2Name, game, scheduleData);

            const gameLink = `game-detail.html?gameId=${gameId}`;
            recentHtml += `
                <a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-300">${team1Name} <span class="text-xs text-gray-500">${team1Record}</span></span>
                        <span class="font-bold text-gray-200">${game['Team 1 Score']} - ${game['Team 2 Score']}</span>
                        <span class="text-gray-300"><span class="text-xs text-gray-500">${team2Record}</span> ${team2Name}</span>
                    </div>
                </a>
            `;
        });
        recentHtml += '</div>';
    } else {
        recentHtml += `<div class="text-center py-8"><img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No results yet" class="mx-auto w-32 h-32 opacity-40"><p class="text-gray-400 mt-4">No results yet.</p></div>`;
    }
    container.innerHTML = recentHtml;
}

function renderLeadersWidget(data) {
    const container = document.getElementById('leaders-widget-container');
    if (!container || !data || data.length === 0) {
        container.innerHTML = '<h3 class="text-2xl font-semibold mb-4 text-gray-200"><a href="leaders.html" class="hover:underline">League Leaders</a></h3><div class="text-center py-8"><img src="https://images.undraw.co/undraw_analytics_re_dkf8.svg" alt="No stats available" class="mx-auto w-32 h-32 opacity-40"><p class="text-gray-400 mt-4">No stats available yet.</p></div>';
        return;
    }
    const findLeader = (statKey) => {
        return [...data].sort((a, b) => (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0))[0];
    };
    const ppgLeader = findLeader('PPG');
    const rpgLeader = findLeader('RPG');
    const apgLeader = findLeader('APG');
    let html = '<h3 class="text-2xl font-semibold mb-4 text-gray-200"><a href="leaders.html" class="hover:underline">League Leaders</a></h3>';
    html += '<div class="space-y-4">';
    const leaderCategories = [{ title: 'Points Per Game', leader: ppgLeader, statKey: 'PPG' }, { title: 'Rebounds Per Game', leader: rpgLeader, statKey: 'RPG' }, { title: 'Assists Per Game', leader: apgLeader, statKey: 'APG' },];
    leaderCategories.forEach(cat => {
        if (cat.leader) {
            const playerName = cat.leader['Player Name'];
            const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
            const statValue = formatStat(cat.leader[cat.statKey]);
            html += `<div class="flex justify-between items-center text-sm p-3 bg-gray-700/50 rounded-md"><span class="text-gray-400">${cat.title}</span><a href="${playerLink}" class="flex items-center space-x-2 group"><span class="font-semibold text-gray-200 group-hover:text-sky-400">${playerName}</span><span class="font-bold text-sky-400 text-base">${statValue}</span></a></div>`;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

async function initializeHomePage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);
    document.getElementById('standings-widget-container').innerHTML = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">Top 5 Standings</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('recent-results-widget-container').innerHTML = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">Recent Results</h3><p class="text-gray-400">Loading...</p>';
    document.getElementById('leaders-widget-container').innerHTML = '<h3 class="text-2xl font-semibold mb-4 text-gray-200">League Leaders</h3><p class="text-gray-400">Loading...</p>';
    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
    const weeklyAwardsGID = getGID('WEEKLY_AWARDS_GID', currentSeason);
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    try {
        const [
            standingsData,
            scheduleData,
            weeklyAwardsData,
            playerStatsData
        ] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT *'),
            fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT *'),
            weeklyAwardsGID ? fetchGoogleSheetData(SHEET_ID, weeklyAwardsGID, 'SELECT * ORDER BY A DESC LIMIT 1') : Promise.resolve(null),
            playerStatsGID ? fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *') : Promise.resolve(null)
        ]);
        if (weeklyAwardsData) { renderWeeklyAwardsWidget(weeklyAwardsData); }
        if (standingsData) { renderStandingsWidget(standingsData); }
        if (scheduleData) { renderResultsWidget(scheduleData); }
        if (playerStatsData) { renderLeadersWidget(playerStatsData); }
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
    }
}