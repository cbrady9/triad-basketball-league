// team-detail.js

async function initializeTeamDetailPage() {
    // ... (rest of the initializeTeamDetailPage function before players section) ...

    // --- Fetch Players Data for Roster ---
    const playersGID = getGID('PLAYERS_GID', currentSeason);
    if (!playersGID) {
        console.error("Players GID not found for current season:", currentSeason);
        document.getElementById('team-roster-container').innerHTML = '<p class="text-red-500">Error: Player data not configured.</p>';
    } else {
        // UPDATED QUERY: Only fetching Player Name (A) and Team (B)
        const PLAYERS_QUERY = 'SELECT A,B';

        const playersData = await fetchGoogleSheetData(SHEET_ID, playersGID, PLAYERS_QUERY);

        if (playersData && playersData.length > 0) {
            const teamRoster = playersData.filter(player => {
                // Team Name is still at index 1 (Column B)
                const playerTeamName = Object.values(player)[1];
                return playerTeamName === decodeURIComponent(teamName);
            });

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
                    // UPDATED parsing: Player Name is at index 0 (Column A)
                    const playerName = Object.values(player)[0];
                    // Removed parsing for jerseyNumber and position as they don't exist

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

    console.log(`Fetching data for ${decodeURIComponent(teamName)} in Season ${currentSeason}...`);
    console.log("Next, we will implement data fetching for more stats and schedule.");
}

document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);