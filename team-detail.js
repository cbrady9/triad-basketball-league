document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);
window.initializePage = initializeTeamDetailPage; // For season selector

// --- NEW: Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.) ---
function getOrdinalSuffix(i) {
    const j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}

// --- UPDATED: Helper function to get a team's rank for a specific stat ---
function getStatRank(allTeamStats, teamName, statKey) {
    const sortedTeams = [...allTeamStats].sort((a, b) => (parseFloat(b[statKey]) || 0) - (parseFloat(a[statKey]) || 0));
    const rankIndex = sortedTeams.findIndex(team => team['Team Name'] === teamName);

    // Now returns the rank formatted in parentheses, e.g., "(1st of 10)"
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

    // Set loading states
    document.getElementById('team-name-display').innerHTML = `<h1 class="text-4xl font-extrabold text-gray-100">${decodedTeamName}</h1>`;
    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-400">Loading...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-400">Loading...</p>';

    // Fetch all necessary data
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

    // --- RENDER WIDGETS ---

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
        // --- UPDATED: This section builds the new rankings format ---
        const ppgValue = formatStat(teamStats['PPG FOR']);
        const rpgValue = formatStat(teamStats['RPG']);
        const apgValue = formatStat(teamStats['APG']);
        document.getElementById('team-rankings').innerHTML = `
            <p><strong>League Rank:</strong> ${teamData.Rank || 'N/A'}</p>
            <p><strong>PPG:</strong> ${ppgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'PPG FOR')}</span></p>
            <p><strong>RPG:</strong> ${rpgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'RPG')}</span></p>
            <p><strong>APG:</strong> ${apgValue} <span class="text-gray-400">${getStatRank(allTeamStatsData, decodedTeamName, 'APG')}</span></p>
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

    // 4. Render Schedule Widget (logic remains the same)
    if (scheduleData) {
        // ... Schedule rendering logic ...
    }
}