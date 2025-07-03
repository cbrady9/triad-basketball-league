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
        if (!standingsGID) {
            console.error("Standings GID not found for current season:", currentSeason);
            document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Error: Standings data not configured.</p>';
            document.getElementById('team-rankings').innerHTML = '';
        } else {
            const STANDINGS_QUERY = 'SELECT *';
            const standingsData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);

            // *** DEBUGGING: Check what fetchGoogleSheetData returns for standings ***
            console.log("Standings Data fetched:", standingsData);

            if (standingsData && standingsData.length > 0) {
                const teamStanding = standingsData.find(row => row['Team Name'] === decodeURIComponent(teamName));

                // *** DEBUGGING: Check the specific team's standing object ***
                console.log("Team Standing for", decodeURIComponent(teamName), ":", teamStanding);


                if (teamStanding) {
                    let recordStatsHtml = `
                        <p><strong>Wins:</strong> ${teamStanding.Wins || 0}</p>
                        <p><strong>Losses:</strong> ${teamStanding.Losses || 0}</p>
                        <p><strong>Win %:</strong> ${teamStanding['Win %'] || 'N/A'}</p>
                        <p><strong>Points For:</strong> ${teamStanding['Points For'] || 0}</p>
                        <p><strong>Points Against:</strong> ${teamStanding['Points Against'] || 0}</p>
                        <p><strong>Point Differential:</strong> ${teamStanding['Point Differential'] || 0}</p>
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
        document.getElementById('team-rankings').innerHTML = '';
    }

    // --- Fetch Players Data for Roster ---
    if (currentSeason) {
        const playersGID = getGID('PLAYERS_GID', currentSeason);
        if (!playersGID) {
            console.error("Players GID not found for current season:", currentSeason);
            document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Error: Player data not configured.</p>';
        } else {
            const PLAYERS_QUERY = 'SELECT A,B';

            const playersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);

            // *** DEBUGGING: Check what fetchGoogleSheetData returns for players ***
            console.log("Players Data fetched:", playersData);
            console.log("Target Team Name for Roster Filter:", decodeURIComponent(teamName));


            if (playersData && playersData.length > 0) {
                const teamRoster = playersData.filter(player => player['Team Name'] === decodeURIComponent(teamName));

                // *** DEBUGGING: Check the filtered team roster ***
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
        if (!scheduleGID) {
            console.error("Schedule GID not found for current season:", currentSeason);
            document.getElementById('team-schedule-container').innerHTML = '<p class="text-red-500">Error: Schedule data not configured.</p>';
        } else {
            const SCHEDULE_QUERY = 'SELECT *';
            const scheduleData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, SCHEDULE_QUERY);

            if (scheduleData && scheduleData.length > 0) {
                const teamSchedule = scheduleData.filter(game =>
                    game['Home Team'] === decodeURIComponent(teamName) ||
                    game['Away Team'] === decodeURIComponent(teamName)
                );

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