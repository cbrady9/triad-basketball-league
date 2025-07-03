// teams.js

// Query to get team names from the 'Teams' tab (assuming 'Team Name' is the column header in column A)
const TEAMS_QUERY = 'SELECT A';

async function renderTeamList(data) {
    const container = document.getElementById('team-list-container');
    if (!container) {
        console.error("Team list container not found.");
        return;
    }
    container.innerHTML = ''; // Clear "Loading teams..." message

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No teams found for this season.</p>';
        return;
    }

    // Assuming the first column in your 'Teams' tab is 'Team Name'
    const teamNameHeader = Object.keys(data[0])[0]; // Get the actual header of the first column

    data.forEach(team => {
        const teamName = team[teamNameHeader];
        if (teamName) { // Ensure team name is not empty
            const teamLink = document.createElement('a');
            teamLink.href = `team-detail.html?teamName=${encodeURIComponent(teamName)}`; // Link to new detail page
            teamLink.className = 'block p-4 bg-blue-100 rounded-lg shadow hover:bg-blue-200 transition duration-200 text-blue-800 font-semibold text-lg text-center';
            teamLink.textContent = teamName;
            container.appendChild(teamLink);
        }
    });
}

async function initializeTeamsPage() {
    const currentSeason = getCurrentSeason();
    // We need a GID for your 'Teams' tab in config.js!
    const teamsGID = getGID('TEAMS_GID', currentSeason);

    if (!teamsGID) {
        console.error("Teams GID not found for current season:", currentSeason);
        document.getElementById('team-list-container').innerHTML = '<p class="text-red-500">Error: Teams data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    document.getElementById('team-list-container').innerHTML = '<p class="text-gray-600">Loading teams...</p>';

    // fetchGoogleSheetData is assumed to be in utils.js
    const teamData = await fetchGoogleSheetData(SHEET_ID, teamsGID, TEAMS_QUERY);
    if (teamData) {
        renderTeamList(teamData);
    } else {
        document.getElementById('team-list-container').innerHTML = '<p class="text-red-500">Failed to load team list. Please try again later or select a different season.</p>';
    }

    createSeasonSelector(currentSeason); // Add season selector
}

document.addEventListener('DOMContentLoaded', initializeTeamsPage);
window.initializePage = initializeTeamsPage; // Make globally accessible for config.js