// team-detail.js
console.log('team-detail.js loaded and executing.');

async function initializeTeamDetailPage() {
    // --- MOVE THIS LINE TO THE TOP ---
    const currentSeason = getCurrentSeason(); // Get the current season FIRST
    console.log('Inside initializeTeamDetailPage. currentSeason:', currentSeason, 'typeof getCurrentSeason:', typeof getCurrentSeason); // Updated log
    // --- END MOVE ---

    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('teamName');

    if (!teamName) {
        document.getElementById('team-name-display').textContent = 'Error: Team name not found in URL.';
        document.getElementById('page-title').textContent = 'Error - Team Details';
        document.getElementById('team-record-stats').innerHTML = '';
        document.getElementById('team-rankings').innerHTML = '';
        document.getElementById('team-roster-container').innerHTML = '';
        document.getElementById('team-schedule-container').innerHTML = '';
        return;
    }

    document.getElementById('page-title').textContent = `${decodeURIComponent(teamName)} - Team Details`;
    document.getElementById('team-name-display').textContent = decodeURIComponent(teamName);

    // Now currentSeason is defined and can be used here
    const seasonDisplayElement = document.getElementById('current-season-display');
    if (seasonDisplayElement) {
        const displaySeason = currentSeason.startsWith('S0') ? parseInt(currentSeason.substring(2)).toString() : currentSeason;
        seasonDisplayElement.textContent = `(Season ${displaySeason})`;
    }

    // Initial loading messages for UX
    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-600">Loading record and stats...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-600">Loading rankings...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-600">Loading roster...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-600">Loading schedule...</p>';


    // --- Rest of your code follows, it's correct after this fix ---
    // --- Fetch Standings Data for Record and Rank ---
    if (currentSeason) {
        const standingsGID = getGID('STANDINGS_GID', currentSeason);
        if (standingsGID === null) {
            console.error("Standings GID not found for current season:", currentSeason);
            document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Error: Standings data not configured.</p>';
            document.getElementById('team-rankings').innerHTML = '';
        } else {
            const STANDINGS_QUERY = 'SELECT *';
            const standingsData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);

            console.log("Standings Data fetched:", standingsData);

            if (standingsData && standingsData.length > 0) {
                const decodedTeamName = decodeURIComponent(teamName).trim().toLowerCase();
                const teamStanding = standingsData.find(row => (row['Team Name'] && row['Team Name'].trim().toLowerCase()) === decodedTeamName);

                console.log("Team Standing for", decodeURIComponent(teamName), ":", teamStanding);

                if (teamStanding) {
                    const wins = parseFloat(teamStanding.Wins) || 0;
                    const losses = parseFloat(teamStanding.Losses) || 0;
                    const pointDifferential = parseFloat(teamStanding['Point Differential']) || 0;

                    let recordStatsHtml = `
                        <p><strong>Record:</strong> ${wins} - ${losses}</p>
                        <p><strong>Win %:</strong> ${teamStanding['Win %']}</p>
                        <p><strong>Point Differential:</strong> ${pointDifferential > 0 ? `+${pointDifferential}` : pointDifferential}</p>
                    `;
                    document.getElementById('team-record-stats').innerHTML = recordStatsHtml;

                    if (teamStanding.Rank !== undefined) {
                        document.getElementById('team-rankings').innerHTML = `<p><strong>Rank:</strong> ${teamStanding.Rank}</p>`;
                    } else {
                        document.getElementById('team-rankings').innerHTML = '<p class="text-gray-700">Rank data not available.</p>';
                    }
                } else {
                    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-700">Team record and stats not found for this team.</p>';
                    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-700">Team rank not found for this team.</p>';
                }
            } else {
                document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Failed to load standings data.</p>';
                document.getElementById('team-rankings').innerHTML = '';
            }
        }
    } else {
        document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Error: Current season not determined for standings data.</p>';
    }

    // --- Fetch Players Data for Roster ---
    if (currentSeason) {
        const playersGID = getGID('PLAYERS_GID', currentSeason);
        if (playersGID === null) {
            console.error("Players GID not found for current season:", currentSeason);
            document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Error: Player data not configured.</p>';
        } else {
            const PLAYERS_QUERY = 'SELECT *';
            const playersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);
            const decodedTeamName = decodeURIComponent(teamName).trim().toLowerCase();

            if (playersData && playersData.length > 0) {
                const teamRoster = playersData.filter(player => {
                    const playerTeamName = player['Team Name'];
                    const cleanedPlayerTeamName = playerTeamName ? playerTeamName.trim().toLowerCase() : '';
                    return cleanedPlayerTeamName === decodedTeamName;
                });

                if (teamRoster.length > 0) {
                    let rosterHtml = `
                    <div class="overflow-x-auto border border-gray-700 rounded-lg">
                        <table class="min-w-full">
                            <thead class="bg-gray-800">
                                <tr>
                                    <th class="py-2 px-4 text-left text-sm font-medium text-gray-300 uppercase">Player Name</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700">
                `;
                    teamRoster.forEach(player => {
                        const playerName = player['Player Name'];
                        const encodedPlayerName = encodeURIComponent(playerName);
                        rosterHtml += `
                        <tr class="hover:bg-gray-700">
                            <td class="py-2 px-4 text-sm">
                                <a href="player-detail.html?playerName=${encodedPlayerName}" class="text-sky-400 hover:underline">
                                    ${playerName}
                                </a>
                            </td>
                        </tr>
                    `;
                    });
                    rosterHtml += `</tbody></table></div>`;
                    document.getElementById('team-roster-container').innerHTML = rosterHtml;
                } else {
                    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-300">No players found for this team in the roster.</p>';
                }
            } else {
                document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Failed to load player data for roster.</p>';
            }
        }
    }

    // --- Fetch Schedule Data ---
    if (currentSeason) {
        const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
        if (scheduleGID === null) {
            console.error("Schedule GID not found for current season:", currentSeason);
            document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Error: Schedule data not configured.</p>';
        } else {
            const SCHEDULE_QUERY = 'SELECT *';
            const scheduleData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, SCHEDULE_QUERY);
            const decodedTeamName = decodeURIComponent(teamName).trim().toLowerCase();

            if (scheduleData && scheduleData.length > 0) {
                const teamSchedule = scheduleData.filter(game => {
                    const team1Name = game['Team 1'];
                    const team2Name = game['Team 2'];
                    const cleanedTeam1Name = team1Name ? team1Name.trim().toLowerCase() : '';
                    const cleanedTeam2Name = team2Name ? team2Name.trim().toLowerCase() : '';
                    return cleanedTeam1Name === decodedTeamName || cleanedTeam2Name === decodedTeamName;
                });

                if (teamSchedule.length > 0) {
                    let scheduleHtml = `
                    <div class="overflow-x-auto border border-gray-700 rounded-lg">
                        <table class="min-w-full">
                            <thead class="bg-gray-800">
                                <tr>
                                    <th class="py-2 px-4 text-left text-sm font-medium text-gray-300 uppercase">Date</th>
                                    <th class="py-2 px-4 text-left text-sm font-medium text-gray-300 uppercase">Opponent</th>
                                    <th class="py-2 px-4 text-left text-sm font-medium text-gray-300 uppercase">Result</th>
                                    <th class="py-2 px-4 text-left text-sm font-medium text-gray-300 uppercase">Score</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700">
                `;
                    teamSchedule.forEach(game => {
                        const thisTeamName = decodeURIComponent(teamName);
                        const opponentName = game['Team 1'] === thisTeamName ? game['Team 2'] : game['Team 1'];
                        const thisTeamScore = game['Team 1'] === thisTeamName ? game['Team 1 Score'] : game['Team 2 Score'];
                        const opponentScore = game['Team 2'] === thisTeamName ? game['Team 2 Score'] : game['Team 1 Score'];
                        const scoreDisplay = (game.Winner !== undefined && game.Winner !== '') ? `${thisTeamScore} - ${opponentScore}` : 'Upcoming';
                        let result = 'TBD';
                        if (game.Winner === thisTeamName) {
                            result = '<span class="font-semibold text-green-400">W</span>';
                        } else if (game.Winner !== undefined && game.Winner !== '') {
                            result = '<span class="font-semibold text-red-400">L</span>';
                        }

                        scheduleHtml += `
                        <tr class="hover:bg-gray-700">
                            <td class="py-2 px-4 text-sm text-gray-300">${game.Date || 'N/A'}</td>
                            <td class="py-2 px-4 text-sm text-gray-300">${opponentName}</td>
                            <td class="py-2 px-4 text-sm text-gray-300">${result}</td>
                            <td class="py-2 px-4 text-sm text-gray-300">${scoreDisplay}</td>
                        </tr>
                    `;
                    });
                    scheduleHtml += `</tbody></table></div>`;
                    document.getElementById('team-schedule-container').innerHTML = scheduleHtml;
                } else {
                    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-300">No schedule found for this team.</p>';
                }
            } else {
                document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Failed to load schedule data.</p>';
            }
        }
    }

    console.log(`Finished attempting to fetch data for ${decodeURIComponent(teamName)} in Season ${currentSeason}.`);
}

document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);