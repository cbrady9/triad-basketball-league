// teams.js

// Query to get team names from the 'Teams' tab (assuming 'Team Name' is the column header in column A)
const TEAMS_QUERY = 'SELECT A';

function renderTeamList(data) {
    const container = document.getElementById('team-list-container');
    if (!container) return;

    // --- NEW: Filter out the "Reserve" team ---
    const filteredData = data.filter(team => team['Team Name'] !== 'Reserve');

    container.innerHTML = '';
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No teams found for this season.</p>';
        return;
    }

    filteredData.forEach(team => {
        const teamName = team['Team Name'];
        if (teamName) {
            const teamLink = document.createElement('a');
            teamLink.href = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
            teamLink.className = 'block p-4 bg-gray-800 border border-gray-700 rounded-lg shadow hover:bg-gray-700 transition duration-200 text-gray-200 font-semibold text-lg text-center';
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