document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);
window.initializePage = initializeTeamDetailPage; // For season selector

// Helper function to calculate a team's rank for a specific stat
function getStatRank(allTeamStats, teamName, statKey) {
    // Sort all teams by the stat from high to low
    const sortedTeams = [...allTeamStats].sort((a, b) => (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0));
    // Find the index (which is rank - 1) of our team
    const rankIndex = sortedTeams.findIndex(team => team['Team Name'] === teamName);

    // Return rank as "X of Y" (e.g., "1st of 10")
    if (rankIndex !== -1) {
        return `${rankIndex + 1} of ${sortedTeams.length}`;
    }
    return 'N/A';
}

async function initializeTeamDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('teamName');
    const decodedTeamName = decodeURIComponent(teamName);
    const currentSeason = getCurrentSeason();

    createSeasonSelector(currentSeason);
    document.getElementById('page-title').textContent = `${decodedTeamName} - Team Details`;
    document.getElementById('team-name-display').textContent = decodedTeamName;

    // Set loading states
    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-400">Loading...</p>';

    // Fetch all necessary data from multiple sheets at once
    const teamsGID = getGID('TEAMS_GID', currentSeason); // This is your new "standings" sheet
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

    // --- RENDER WIDGETS ---

    // Find the specific data for the current team
    const teamData = allTeamsData.find(t => t['Team Name'] === decodedTeamName);
    const teamStats = allTeamStatsData.find(ts => ts['Team Name'] === decodedTeamName);

    // 1. Render Record & Stats Widget
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

    // 2. Render Rankings Widget
    if (teamData && teamStats && allTeamStatsData) {
        document.getElementById('team-rankings').innerHTML = `
            <p><strong>League Rank:</strong> ${teamData.Rank || 'N/A'}</p>
            <p><strong>PPG Rank:</strong> ${getStatRank(allTeamStatsData, decodedTeamName, 'PPG FOR')}</p>
            <p><strong>RPG Rank:</strong> ${getStatRank(allTeamStatsData, decodedTeamName, 'RPG')}</p>
            <p><strong>APG Rank:</strong> ${getStatRank(allTeamStatsData, decodedTeamName, 'APG')}</p>
        `;
    }

    // 3. Render Roster Widget with Headshots
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
                        <img src="${headshotUrl}" class="w-10 h-10 rounded-full mr-3 object-cover bg-gray-600">
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

    // 4. Render Schedule Widget
    if (scheduleData) {
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
            document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-300">No schedule found.</p>';
        }
    }
}