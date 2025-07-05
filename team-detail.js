document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);
window.initializePage = initializeTeamDetailPage;

function getOrdinalSuffix(i) {
    const j = i % 10, k = i % 100;
    if (j == 1 && k != 11) { return "st"; }
    if (j == 2 && k != 12) { return "nd"; }
    if (j == 3 && k != 13) { return "rd"; }
    return "th";
}

function getStatRank(allTeamStats, teamName, statKey) {
    const sortedTeams = [...allTeamStats].sort((a, b) => (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0));
    const rankIndex = sortedTeams.findIndex(team => team['Team Name'] === teamName);

    if (rankIndex !== -1) {
        const rank = rankIndex + 1;
        return `(${rank}${getOrdinalSuffix(rank)} of ${sortedTeams.length})`;
    }
    return '(N/A)';
}

async function initializeTeamDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('teamName');
    const decodedTeamName = decodeURIComponent(teamName);
    const currentSeason = getCurrentSeason();

    createSeasonSelector(currentSeason);
    document.getElementById('page-title').textContent = `${decodedTeamName} - Team Details`;
    document.getElementById('team-name-display').textContent = decodedTeamName;

    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-400">Loading...</p>';

    const teamsGID = getGID('TEAMS_GID', currentSeason);
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);

    const [
        allTeamsData,
        allPlayersData,
        scheduleData,
        allTeamStatsData
    ] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, scheduleGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, teamStatsGID, 'SELECT *')
    ]);

    const teamData = allTeamsData ? allTeamsData.find(t => t['Team Name'] === decodedTeamName) : null;
    const teamStats = allTeamStatsData ? allTeamStatsData.find(ts => ts['Team Name'] === decodedTeamName) : null;

    if (teamData) {
        const wins = teamData.Wins || 0;
        const losses = teamData.Losses || 0;
        const pd = teamData['Point Differential'] > 0 ? `+${teamData['Point Differential']}` : teamData['Point Differential'];
        document.getElementById('team-record-stats').innerHTML = `
            <p><strong>Record:</strong> ${wins} - ${losses}</p>
            <p><strong>Win %:</strong> ${teamData['Win %']}</p>
            <p><strong>Point Diff:</strong> ${pd}</p>
        `;
    }

    if (teamData && teamStats && allTeamStatsData) {
        const ppgValue = formatStat(teamStats['PPG For']);
        const rpgValue = formatStat(teamStats['RPG']);
        const apgValue = formatStat(teamStats['APG']);
        document.getElementById('team-rankings').innerHTML = `
            <p><strong>League Rank:</strong> ${teamData.Rank || 'N/A'}</p>
            <p><strong>PPG:</strong> ${ppgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'PPG For')}</span></p>
            <p><strong>RPG:</strong> ${rpgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'RPG')}</span></p>
            <p><strong>APG:</strong> ${apgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'APG')}</span></p>
        `;
    }

    // --- THIS IS THE CORRECTED ROSTER SECTION ---
    if (allPlayersData) {
        const teamRoster = allPlayersData.filter(p => p['Team Name'] === decodedTeamName);
        if (teamRoster.length > 0) {
            let rosterHtml = '<div class="space-y-3">';
            teamRoster.forEach(player => {
                const playerName = player['Player Name'];
                const headshotUrl = player['Headshot URL'] || 'https://i.imgur.com/8so6K5A.png';
                const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
                rosterHtml += `
                    <a href="${playerLink}" class="flex items-center group p-2 rounded-md hover:bg-gray-700">
                        <img src="${headshotUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/8so6K5A.png';" class="w-10 h-10 rounded-full mr-3 object-cover bg-gray-600">
                        <span class="text-sky-400 group-hover:underline font-medium">${playerName}</span>
                    </a>
                `;
            });
            rosterHtml += '</div>';
            document.getElementById('team-roster-container').innerHTML = rosterHtml;
        } else {
            document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-300">No players found.</p>';
        }
    }
    // --- END ROSTER SECTION ---

    // --- THIS IS THE CORRECTED SCHEDULE SECTION ---
    if (scheduleData && Array.isArray(scheduleData)) {
        const teamSchedule = scheduleData.filter(g => g['Team 1'] === decodedTeamName || g['Team 2'] === decodedTeamName);
        if (teamSchedule.length > 0) {
            let scheduleHtml = '<div class="space-y-3">';
            teamSchedule.forEach(game => {
                const opponentName = game['Team 1'] === decodedTeamName ? game['Team 2'] : game['Team 1'];
                const thisTeamScore = game['Team 1'] === decodedTeamName ? game['Team 1 Score'] : game['Team 2 Score'];
                const opponentScore = game['Team 1'] === decodedTeamName ? game['Team 2 Score'] : game['Team 1 Score'];
                const scoreDisplay = game.Winner ? `${thisTeamScore} - ${opponentScore}` : 'Upcoming';
                let result = '';
                if (game.Winner === decodedTeamName) result = '<span class="font-bold text-green-400">W</span>';
                else if (game.Winner) result = '<span class="font-bold text-red-400">L</span>';
                const gameLink = `game-detail.html?gameId=${game['Game ID']}`;
                scheduleHtml += `
                    <a href="${gameLink}" class="block p-3 bg-gray-700/50 rounded-md hover:bg-gray-700">
                        <div class="flex justify-between items-center">
                            <div class="text-sm"><span class="text-gray-400">${game.Date}</span><span class="text-gray-200 ml-4">vs ${opponentName}</span></div>
                            <div class="text-sm flex items-center space-x-4"><span>${result}</span><span class="font-semibold text-gray-300">${scoreDisplay}</span></div>
                        </div>
                    </a>
                `;
            });
            scheduleHtml += '</div>';
            document.getElementById('team-schedule-container').innerHTML = scheduleHtml;
        } else {
            document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-300">No schedule found for this team.</p>';
        }
    } else {
        document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Could not load schedule data.</p>';
    }
    // --- END SCHEDULE SECTION ---
}