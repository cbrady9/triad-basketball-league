// team-detail.js

async function initializeTeamDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('teamName');

    if (!teamName) {
        document.getElementById('team-name-display').textContent = 'Error: Team not specified.';
        document.getElementById('page-title').textContent = 'Error - Team Details';
        document.querySelector('main').innerHTML = '<p class="text-red-500 text-center mt-8">No team name found in the URL. Please go back to the <a href="teams.html" class="text-blue-600 hover:underline">Teams List</a>.</p>';
        return;
    }

    // Update page title and team name display
    document.getElementById('page-title').textContent = `${decodeURIComponent(teamName)} - Team Details`;
    document.getElementById('team-name-display').textContent = decodeURIComponent(teamName);

    const currentSeason = getCurrentSeason();

    // Placeholder for loading messages for various sections (keep these for now)
    document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-600">Loading record and stats...</p>';
    document.getElementById('team-rankings').innerHTML = '<p class="text-gray-600">Loading rankings...</p>';
    document.getElementById('team-roster-container').innerHTML = '<p class="text-gray-600">Loading roster...</p>';
    document.getElementById('team-schedule-container').innerHTML = '<p class="text-gray-600">Loading schedule...</p>';

    // --- Fetch Standings Data for Record and Rank ---
    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    if (!standingsGID) {
        console.error("Standings GID not found for current season:", currentSeason);
        document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Error: Standings data not configured.</p>';
        return;
    }

    // Query to get Team, Wins, Losses, Win % for all teams
    // Adjust column letters based on your actual "Team Standings" tab
    // Assuming columns are like: Team Name (A), Wins (B), Losses (C), Win % (D)
    // You might need to change 'A,B,C,D' to match your sheet.
    const STANDINGS_QUERY = 'SELECT B, C, D, E'; // Example: Select Team Name, Wins, Losses, Win Pct

    const standingsData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);

    if (standingsData && standingsData.length > 0) {
        let teamStandings = null;
        let teamsWithRecords = [];

        // Find the specific team's record and collect all teams for ranking
        standingsData.forEach(row => {
            // Assume the first column is the Team Name
            const recordTeamName = Object.values(row)[0];
            const wins = parseFloat(Object.values(row)[1]);
            const losses = parseFloat(Object.values(row)[2]);
            const winPct = parseFloat(Object.values(row)[3]); // Should be a number (0.XX)

            if (recordTeamName === decodeURIComponent(teamName)) {
                teamStandings = { wins, losses, winPct };
            }
            // Store all teams' records to calculate rank
            if (!isNaN(wins) && !isNaN(losses) && !isNaN(winPct)) {
                 teamsWithRecords.push({
                    name: recordTeamName,
                    wins: wins,
                    losses: losses,
                    winPct: winPct
                });
            }
        });

        if (teamStandings) {
            // Sort teams by Win % in descending order to determine rank
            teamsWithRecords.sort((a, b) => b.winPct - a.winPct);

            // Find the rank of the current team
            const teamRank = teamsWithRecords.findIndex(t => t.name === decodeURIComponent(teamName)) + 1;

            document.getElementById('team-record-stats').innerHTML = `
                <p>Record: <span id="record-display" class="font-bold">${teamStandings.wins}-${teamStandings.losses}</span></p>
                <p>Win %: <span id="win-pct-display" class="font-bold">${(teamStandings.winPct * 100).toFixed(1)}%</span></p>
                `;
            document.getElementById('team-rankings').innerHTML = `
                <p>Rank (Record/Win %): <span id="record-rank-display" class="font-bold">${teamRank} of ${teamsWithRecords.length}</span></p>
                `;
        } else {
            document.getElementById('team-record-stats').innerHTML = '<p class="text-gray-700">Team standings not found.</p>';
            document.getElementById('team-rankings').innerHTML = '<p class="text-gray-700">Rankings not available.</p>';
        }
    } else {
        document.getElementById('team-record-stats').innerHTML = '<p class="text-red-500">Failed to load standings data.</p>';
        document.getElementById('team-rankings').innerHTML = '<p class="text-red-500">Failed to load rankings.</p>';
    }

    // Keep console log for now for debugging progress
    console.log(`Fetching data for ${decodeURIComponent(teamName)} in Season ${currentSeason}...`);
    console.log("Next, we will implement data fetching for more stats, roster, and schedule.");
}

document.addEventListener('DOMContentLoaded', initializeTeamDetailPage);
// window.initializePage = initializeTeamDetailPage; // Uncomment if you add a season selector to this page.