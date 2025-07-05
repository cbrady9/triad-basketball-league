document.addEventListener('DOMContentLoaded', initializeTeamsPage);
window.initializePage = initializeTeamsPage;

function renderTeamList(data) {
    const container = document.getElementById('team-list-container');
    if (!container) return;

    // This console.log is for debugging. It will show us the exact data being received.
    console.log("Data received for Teams page:", data);

    // Filter out the "Reserve" team before displaying
    const filteredData = data.filter(team => team['Team Name'] !== 'Reserve');

    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = `<div class="text-center py-12 col-span-full"><img src="https://images.undraw.co/undraw_people_re_8spw.svg" alt="No teams found" class="mx-auto w-40 h-40 mb-4 opacity-50"><p class="text-lg text-gray-400">No teams have been created yet.</p></div>`;
        return;
    }

    container.innerHTML = ''; // Clear loading message

    filteredData.forEach(team => {
        // Use the full header names to find the data
        const teamName = team['Team Name'];
        const logoUrl = team['Logo URL'] || 'https://i.imgur.com/p3nQp25.png'; // Default placeholder

        if (teamName) {
            const teamLink = document.createElement('a');
            teamLink.href = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
            teamLink.className = 'block p-4 bg-gray-800 border border-gray-700 rounded-lg shadow hover:bg-gray-700 transition duration-200 text-gray-200 font-semibold text-lg text-center';
            // Added an onerror fallback for the image tag
            teamLink.innerHTML = `<img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" alt="${teamName}" class="w-20 h-20 mx-auto mb-3 object-contain bg-gray-700 rounded-md"><span class="block">${teamName}</span>`;
            container.appendChild(teamLink);
        }
    });
}

async function initializeTeamsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);
    const teamsContainer = document.getElementById('team-list-container');
    teamsContainer.innerHTML = '<p class="text-gray-400">Loading teams...</p>';

    const teamsGID = getGID('TEAMS_GID', currentSeason);
    if (!teamsGID) {
        teamsContainer.innerHTML = '<p class="text-red-500">Error: Teams data not configured.</p>';
        return;
    }

    // Switched back to SELECT * for better reliability
    const teamData = await fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT *');

    if (teamData) {
        renderTeamList(teamData);
    } else {
        teamsContainer.innerHTML = '<p class="text-red-500">Failed to load team list.</p>';
    }
}