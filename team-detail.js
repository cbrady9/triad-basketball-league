// team-detail.js
console.log('team-detail.js loaded and executing.');

async function initializeTeamDetailPage() {
    console.log('Inside initializeTeamDetailPage. About to call getCurrentSeason. typeof getCurrentSeason:', typeof getCurrentSeason);

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

    const currentSeason = getCurrentSeason();
    console.log('currentSeason in team-detail.js:', currentSeason);

    // Initial loading messages for UX
    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-600">Loading record and stats...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-600">Loading rankings...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-600">Loading roster...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-600">Loading schedule...</p>';


    // --- Fetch Standings Data for Record and Rank ---
    if (currentSeason) {
        const standingsGID = getGID('STANDINGS_GID', currentSeason);
        if (standingsGID === null) { // Check for null explicitly as 0 is now a valid GID
            console.error("Standings GID not found for current season:", currentSeason);
            document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Error: Standings data not configured.</p>';
            document.getElementById('team-rankings').innerHTML = '';
        } else {
            const STANDINGS_QUERY = 'SELECT *';
            const standingsData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);

            console.log("Standings Data fetched:", standingsData);

            if (standingsData && standingsData.length > 0) {
                const teamStanding = standingsData.find(row => row['Team Name'] === decodeURIComponent(teamName));

                console.log("Team Standing for", decodeURIComponent(teamName), ":", teamStanding);


                if (teamStanding) {
                    // --- Customized Stats Display ---
                    const wins = parseFloat(teamStanding.Wins) || 0;
                    const losses = parseFloat(teamStanding.Losses) || 0;
                    const winPercentage = parseFloat(teamStanding['Win %']) || 0;
                    const pointDifferential = parseFloat(teamStanding['Point Differential']) || 0;

                    let recordStatsHtml = `
                        <p><strong>Record:</strong> ${wins} - ${losses}</p>
                        <p><strong>Win %:</strong> ${(winPercentage * 100).toFixed(0)}%</p>
                        <p><strong>Point Differential:</strong> ${pointDifferential > 0 ? `+${pointDifferential}` : pointDifferential}</p>
                    `;
                    document.getElementById('team-record-stats').innerHTML = recordStatsHtml;

                    // Rank display remains separate as it's not part of the core "stats" block requested for simplification
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
        document.getElementById('team-rankings').innerHTML = '';
    }

    // --- Fetch Players Data for Roster ---
    if (currentSeason) {
        const playersGID = getGID('PLAYERS_GID', currentSeason);
        if (playersGID === null) { // Check for null explicitly
            console.error("Players GID not found for current season:", currentSeason);
            document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Error: Player data not configured.</p>';
        } else {
            const PLAYERS_QUERY = 'SELECT A,B';

            const playersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);

            console.log("Players Data fetched:", playersData);
            const decodedTeamName = decodeURIComponent(teamName).trim(); // Trim the target team name
            console.log("Target Team Name for Roster Filter (trimmed):", decodedTeamName);


            if (playersData && playersData.length > 0) {
                const teamRoster = playersData.filter(player => {
                    const playerTeamName = player['Team ']; // Use the key with the trailing space
                    // Trim both values before comparison for robustness
                    const isMatch = playerTeamName && playerTeamName.trim() === decodedTeamName;
                    console.log(`Roster Compare: "${playerTeamName}" (trimmed: "${playerTeamName?.trim()}") === "${decodedTeamName}" ? ${isMatch}`);
                    return isMatch;
                });

                console.log("Team Roster for", decodeURIComponent(teamName), ":", teamRoster);

                if (teamRoster.length > 0) {
                    let rosterHtml = `
                        <table class="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Player Name</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    teamRoster.forEach(player => {
                        const playerName = player['Player Name'];

                        rosterHtml += `
                            <tr class="hover:bg-gray-50">
                                <td class="py-2 px-4 border-b text-sm">${playerName}</td>
                            </tr>
                        `;
                    });

                    rosterHtml += `
                            </tbody>
                        </table>
                    `;
                    // CORRECTED TYPO HERE: (] -> )
                    document.getElementById('team-roster-container').innerHTML = rosterHtml;
                } else {
                    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-700">No players found for this team in the roster.</p>';
                }
            } else {
                document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Failed to load player data for roster.</p>';
            }
        }
    } else {
        document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Error: Current season not determined for player data.</p>';
    }

    // --- Fetch Schedule Data ---
    if (currentSeason) {
        const scheduleGID = getGID('SCHEDULE_GID', currentSeason);
        if (scheduleGID === null) { // Check for null explicitly
            console.error("Schedule GID not found for current season:", currentSeason);
            document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Error: Schedule data not configured.</p>';
        } else {
            const SCHEDULE_QUERY = 'SELECT *';
            const scheduleData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, SCHEDULE_QUERY);

            console.log("Schedule Data fetched:", scheduleData);
            const decodedTeamName = decodeURIComponent(teamName).trim(); // Trim the target team name
            console.log("Target Team Name for Schedule Filter (trimmed):", decodedTeamName);


            if (scheduleData && scheduleData.length > 0) {
                const teamSchedule = scheduleData.filter(game => {
                    const homeTeamName = game['Home Team'];
                    const awayTeamName = game['Away Team'];

                    // Trim both values before comparison for robustness
                    const isHomeMatch = homeTeamName && homeTeamName.trim() === decodedTeamName;
                    const isAwayMatch = awayTeamName && awayTeamName.trim() === decodedTeamName;

                    console.log(`Schedule Compare: Home:"${homeTeamName}" (trimmed: "${homeTeamName?.trim()}") === "${decodedTeamName}" ? ${isHomeMatch}`);
                    console.log(`Schedule Compare: Away:"${awayTeamName}" (trimmed: "${awayTeamName?.trim()}") === "${decodedTeamName}" ? ${isAwayMatch}`);

                    return isHomeMatch || isAwayMatch;
                });

                console.log("Team Schedule for", decodeURIComponent(teamName), ":", teamSchedule);


                if (teamSchedule.length > 0) {
                    let scheduleHtml = `
                        <table class="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Date</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Time</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Home Team</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Away Team</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Score</th>
                                    <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Location</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    teamSchedule.forEach(game => {
                        const homeTeam = game['Home Team'] || 'N/A';
                        const awayTeam = game['Away Team'] || 'N/A';
                        const homeScore = game['Home Score'] !== undefined ? game['Home Score'] : '-';
                        const awayScore = game['Away Score'] !== undefined ? game['Away Score'] : '-';
                        const scoreDisplay = (game.Status === 'Completed') ? `${homeScore} - ${awayScore}` : 'Upcoming';
                        const location = game.Location || 'N/A';

                        scheduleHtml += `
                            <tr class="hover:bg-gray-50">
                                <td class="py-2 px-4 border-b text-sm">${game.Date || 'N/A'}</td>
                                <td class="py-2 px-4 border-b text-sm">${game.Time || 'N/A'}</td>
                                <td class="py-2 px-4 border-b text-sm">${homeTeam}</td>
                                <td class="py-2 px-4 border-b text-sm">${awayTeam}</td>
                                <td class="py-2 px-4 border-b text-sm">${scoreDisplay}</td>
                                <td class="py-2 px-4 border-b text-sm">${location}</td>
                            </tr>
                        `;
                    });

                    scheduleHtml += `
                            </tbody>
                        </table>
                    `;
                    // CORRECTED TYPO HERE: (] -> )
                    document.getElementById('team-schedule-container').innerHTML = scheduleHtml;
                } else {
                    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-700">No schedule found for this team.</p>';
                }
            } else {
                document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Failed to load schedule data.</p>';
            }
        }
    } else {
        document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Error: Current season not determined for schedule data.</p>';
    }

    console.log(`Finished attempting to fetch data for ${decodeURIComponent(teamName)} in Season ${currentSeason}.`);
}

document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);