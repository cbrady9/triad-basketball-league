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

    document.getElementById('page-title').textContent = `${decodeURIComponent(teamName)} - Team Details`;
    document.getElementById('team-name-display').textContent = decodeURIComponent(teamName);

    const currentSeason = getCurrentSeason();

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

    // IMPORTANT: Confirm these column letters match your "Team Standings" Google Sheet tab:
    // A: Rank
    // B: Team Name
    // C: Wins
    // D: Losses
    // E: Win %
    const STANDINGS_QUERY = 'SELECT A,B,C,D,E'; // Adjusted to include Rank (Column A)

    const standingsData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);

    if (standingsData && standingsData.length > 0) {
        let teamStandings = null;
        // No need for teamsWithRecords array or custom sorting now that rank comes from the sheet directly.

        // Find the specific team's record and rank
        standingsData.forEach(row => {
            // Ensure these indices match the columns in your STANDINGS_QUERY (A=0, B=1, C=2, D=3, E=4)
            const rank = Object.values(row)[0];           // Column A: Rank
            const recordTeamName = Object.values(row)[1]; // Column B: Team Name
            const wins = parseFloat(Object.values(row)[2]);      // Column C: Wins
            const losses = parseFloat(Object.values(row)[3]);    // Column D: Losses
            const winPct = parseFloat(Object.values(row)[4]);    // Column E: Win %

            if (recordTeamName === decodeURIComponent(teamName)) {
                teamStandings = { rank: rank, wins: wins, losses: losses, winPct: winPct };
            }
        });

        if (teamStandings) {
            document.getElementById('team-record-stats').innerHTML = `
                <p>Record: <span id="record-display" class="font-bold">${teamStandings.wins}-${teamStandings.losses}</span></p>
                <p>Win %: <span id="win-pct-display" class="font-bold">${(teamStandings.winPct * 100).toFixed(1)}%</span></p>
                `;
            // UPDATED LEAGUE RANKING DISPLAY:
            document.getElementById('team-rankings').innerHTML = `
                <p>League Rank: <span id="league-rank-display" class="font-bold">${teamStandings.rank}</span></p>