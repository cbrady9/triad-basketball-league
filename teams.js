// teams.js

function renderTeamList(data) {
    const container = document.getElementById('team-list-container');
    if (!container) return;

    // Filter out the "Reserve" team before displaying.
    // We use 'A' because that's the column for the team name from our query.
    const filteredData = data.filter(team => team['A'] !== 'Reserve');

    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = `<div class="text-center py-12 col-span-full"><img src="https://images.undraw.co/undraw_people_re_8spw.svg" alt="No teams found" class="mx-auto w-40 h-40 mb-4 opacity-50"><p class="text-lg text-gray-400">No teams have been created yet.</p></div>`;
        return;
    }

    container.innerHTML = ''; // Clear loading message

    filteredData.forEach(team => {
        // Use column letters 'A' and 'H' because of our specific SELECT query
        const teamName = team['A'];
        const logoUrl = team['H'] || 'https://i.imgur.com/p3nQp25.png'; // Default placeholder

        if (teamName) {
            const teamLink = document.createElement('a');
            teamLink.href = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
            teamLink.className = 'block p-4 bg-gray-800 border border-gray-700 rounded-lg shadow hover:bg-gray-700 transition duration-200 text-gray-200 font-semibold text-lg text-center';
            teamLink.innerHTML = `<img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" alt="${teamName}" class="w-20 h-20 mx-auto mb-3 object-contain bg-gray-700 rounded-md"><span class="block">${teamName}</span>`;
            container.appendChild(teamLink);
        }
    });
}

async function initializeTeamsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason); // This is now an empty function but is safe to call
    const teamsContainer = document.getElementById('team-list-container');
    teamsContainer.innerHTML = '<p class="text-gray-400">Loading teams...</p>';

    const teamsGID = getGID('TEAMS_GID', currentSeason);
    if (!teamsGID) {
        teamsContainer.innerHTML = '<p class="text-red-500">Error: Teams data not configured.</p>';
        return;
    }

    // This specific query for columns A (Team Name) and H (Logo URL) is more reliable
    // NOTE: If your Logo URL is not in Column H of the "Teams S01" sheet, change 'H' to the correct letter.
    const teamData = await fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT A, H');

    if (teamData) {
        renderTeamList(teamData);
    } else {
        teamsContainer.innerHTML = '<p class="text-red-500">Failed to load team list.</p>';
    }
}

// These lines initialize the page
document.addEventListener('DOMContentLoaded', initializeTeamsPage);
window.initializePage = initializeTeamsPage;