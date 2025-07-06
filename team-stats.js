document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage;

function renderTeamStatsTable(data) {
    const container = document.getElementById('team-stats-data-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center py-12"><img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No stats available" class="mx-auto w-40 h-40 mb-4 opacity-50"><p class="text-lg text-gray-400">No team stats available yet.</p></div>`;
        return;
    }

    // A map to rename headers for a cleaner display
    const headerMap = {
        'Games Played (Internal)': 'GP',
        'Point Differential': 'PD'
    };

    // Define the exact order and headers to display
    const orderedHeaders = ['Team Name', 'Games Played (Internal)', 'Wins', 'Losses', 'Win %', 'Point Differential'];

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800"><tr>';

    orderedHeaders.forEach(header => {
        const displayHeader = headerMap[header] || header;
        tableHTML += `<th scope="col" class="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider sortable">${displayHeader}</th>`;
    });
    tableHTML += '</tr></thead>';

    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    data.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        orderedHeaders.forEach(header => {
            let displayValue = '';

            if (header.toUpperCase() === 'TEAM NAME') {
                const teamName = row[header] || '';
                const logoUrl = row['Logo URL'] || 'https://i.imgur.com/p3nQp25.png'; // Get logo from the same row
                const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
                displayValue = `
                    <a href="${teamLink}" class="flex items-center group">
                        <img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" class="w-8 h-8 mr-3 object-contain">
                        <span class="text-sky-400 group-hover:underline font-semibold">${teamName}</span>
                    </a>
                `;
            } else {
                const value = row[header] !== undefined ? row[header] : '';
                displayValue = value;
            }

            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;

    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
    });
}

async function initializeTeamStatsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);
    document.getElementById('team-stats-data-container').innerHTML = '<p class="text-gray-400">Loading team stats...</p>';

    // --- UPDATED: Now uses TEAMS_GID as the single source of data ---
    const teamsGID = getGID('TEAMS_GID', currentSeason);

    if (!teamsGID) {
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Error: Page not configured correctly.</p>';
        return;
    }

    try {
        const teamData = await fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT *');

        if (teamData) {
            // Filter out the "Reserve" team before rendering
            const filteredTeams = teamData.filter(team => team['Team Name'] !== 'Reserve');
            renderTeamStatsTable(filteredTeams);
        } else {
            throw new Error("Team data failed to load.");
        }
    } catch (error) {
        console.error("Failed to initialize team stats page:", error);
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Failed to load team stats.</p>';
    }
}