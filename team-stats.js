document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage;

function renderTeamStatsTable(statsData, teamsData) {
    const container = document.getElementById('team-stats-data-container');
    if (!container) return;

    if (!statsData || statsData.length === 0) {
        container.innerHTML = `<div class="text-center py-12"><img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No stats available" class="mx-auto w-40 h-40 mb-4 opacity-50"><p class="text-lg text-gray-400">No team stats available yet.</p></div>`;
        return;
    }

    // Create a robust lookup map for logos
    const logoMap = new Map(teamsData.map(team => [team['Team Name'], team['Logo URL']]));

    // List of stat headers that need decimal formatting
    const statsToFormat = ['PPG For', 'PPG Against', 'RPG', 'APG', 'SPG', 'BPG', 'TPG'];
    const headers = Object.keys(statsData[0]);

    // Added classes for better scrolling with a sticky header
    let tableHTML = '<div class="overflow-x-auto max-h-[75vh] overflow-y-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800 sticky top-0"><tr>';

    headers.forEach(header => {
        const isSortable = ['TEAM NAME'].includes(header.toUpperCase()) ? '' : 'sortable';
        tableHTML += `<th scope="col" class="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${isSortable}">${header}</th>`;
    });
    tableHTML += '</tr></thead>';

    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    statsData.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            let value = row[header] ?? ''; // Use ?? to handle null/undefined
            let displayValue = value;

            // Apply decimal formatting to all average stats
            if (statsToFormat.includes(header)) {
                displayValue = formatStat(value); // formatStat() will show '-' for non-numbers
            }

            if (header.toUpperCase() === 'TEAM NAME') {
                const teamName = value;
                // Trim the team name from this sheet before looking it up in the map
                const logoUrl = logoMap.get(teamName.trim()) || 'https://i.imgur.com/p3nQp25.png';

                const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
                displayValue = `
                    <a href="${teamLink}" class="flex items-center group">
                        <img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" class="w-8 h-8 mr-3 object-contain">
                        <span class="text-sky-400 group-hover:underline font-semibold">${teamName}</span>
                    </a>
                `;
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

    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);
    const teamsGID = getGID('TEAMS_GID', currentSeason);

    if (!teamStatsGID || !teamsGID) {
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Error: Page not configured correctly.</p>';
        return;
    }

    try {
        const [teamStatsData, teamsData] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, teamStatsGID, 'SELECT *'),
            fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT A, H')
        ]);

        if (teamStatsData && teamsData) {
            const renamedTeamsData = teamsData.map(team => ({
                'Team Name': team['A'] ? team['A'].trim() : '',
                'Logo URL': team['H']
            }));

            const filteredStatsData = teamStatsData.filter(team => team['Team Name'] !== 'Reserve');
            renderTeamStatsTable(filteredStatsData, renamedTeamsData);
        } else {
            throw new Error("One or more datasets failed to load.");
        }
    } catch (error) {
        console.error("Failed to initialize team stats page:", error);
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Failed to load team stats.</p>';
    }
}